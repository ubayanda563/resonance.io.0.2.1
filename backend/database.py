import asyncio
import os
import re
from uuid import uuid4

try:
    from bson import ObjectId
except ImportError:
    class ObjectId(str):
        def __new__(cls, value=None):
            return str.__new__(cls, value or uuid4().hex)

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase


# ---------------------------------------------------------------------------
# In-memory fallback (no MongoDB configured)
# ---------------------------------------------------------------------------

class InMemoryResult:
    def __init__(self, inserted_id=None, matched_count=0, deleted_count=0, inserted_ids=None, modified_count=0):
        self.inserted_id = inserted_id
        self.matched_count = matched_count
        self.modified_count = modified_count
        self.deleted_count = deleted_count
        self.inserted_ids = inserted_ids or []


class InMemoryCursor:
    def __init__(self, items):
        self._items = list(items)
        self._sort_spec = None
        self._skip_n = 0
        self._limit_n = None

    def sort(self, sort_spec, direction=None):
        if direction is not None:
            self._sort_spec = [(sort_spec, direction)]
        elif isinstance(sort_spec, tuple):
            self._sort_spec = [sort_spec]
        else:
            self._sort_spec = sort_spec
        return self

    def skip(self, count):
        self._skip_n = count
        return self

    def limit(self, count):
        self._limit_n = count
        return self

    async def to_list(self, length):
        items = list(self._items)
        if self._sort_spec:
            for key, direction in reversed(self._sort_spec):
                items.sort(key=lambda d: (d.get(key) is None, d.get(key)), reverse=(direction == -1))
        if self._skip_n:
            items = items[self._skip_n:]
        cap = length if self._limit_n is None else min(self._limit_n, length or self._limit_n)
        if cap is not None:
            items = items[:cap]
        return [i.copy() for i in items]


class InMemoryAggregateCursor:
    def __init__(self, items):
        self._items = items

    async def to_list(self, length):
        return self._items[:length] if length else self._items


class InMemoryCollection:
    def __init__(self, name):
        self.name = name
        self.items: list[dict] = []

    async def create_index(self, *args, **kwargs):
        return None

    def find(self, query=None):
        return InMemoryCursor(self._filter(query))

    async def find_one(self, query):
        for item in self._filter(query):
            return item.copy()
        return None

    async def insert_one(self, document):
        doc = document.copy()
        if "_id" not in doc:
            doc["_id"] = ObjectId()
        self.items.append(doc)
        return InMemoryResult(inserted_id=doc["_id"])

    async def insert_many(self, documents):
        ids = []
        for document in documents:
            doc = document.copy()
            if "_id" not in doc:
                doc["_id"] = ObjectId()
            self.items.append(doc)
            ids.append(doc["_id"])
        return InMemoryResult(inserted_ids=ids)

    async def update_one(self, query, update, upsert=False):
        for item in self._filter(query):
            if "$set" in update:
                item.update(update["$set"])
            if "$inc" in update:
                for k, v in update["$inc"].items():
                    item[k] = item.get(k, 0) + v
            if "$addToSet" in update:
                for k, v in update["$addToSet"].items():
                    lst = item.setdefault(k, [])
                    if v not in lst:
                        lst.append(v)
            if "$pull" in update:
                for k, v in update["$pull"].items():
                    item[k] = [x for x in item.get(k, []) if x != v]
            return InMemoryResult(matched_count=1, modified_count=1)
        return InMemoryResult(matched_count=0)

    async def delete_one(self, query):
        for idx, item in enumerate(self.items):
            if self._matches(item, query):
                del self.items[idx]
                return InMemoryResult(deleted_count=1)
        return InMemoryResult(deleted_count=0)

    async def delete_many(self, query):
        before = len(self.items)
        self.items = [i for i in self.items if not self._matches(i, query)]
        return InMemoryResult(deleted_count=before - len(self.items))

    async def count_documents(self, query):
        return len(list(self._filter(query)))

    def aggregate(self, pipeline):
        if not pipeline:
            return InMemoryAggregateCursor([])
        result = list(self.items)
        for stage in pipeline:
            if "$group" in stage:
                group = stage["$group"]
                if group.get("_id") is None:
                    agg = {
                        "total_tracks": 0, "local_tracks": 0, "youtube_tracks": 0,
                        "total_duration": 0, "total_size": 0,
                        "artists": set(), "albums": set(),
                    }
                    for doc in result:
                        agg["total_tracks"] += 1
                        agg["local_tracks"] += 1 if doc.get("source") == "local" else 0
                        agg["youtube_tracks"] += 1 if doc.get("source") == "youtube" else 0
                        agg["total_duration"] += doc.get("duration", 0) or 0
                        agg["total_size"] += doc.get("file_size", 0) or 0
                        if doc.get("artist"):
                            agg["artists"].add(doc["artist"])
                        if doc.get("album"):
                            agg["albums"].add(doc["album"])
                    return InMemoryAggregateCursor([{
                        **agg,
                        "artists": list(agg["artists"]),
                        "albums": list(agg["albums"]),
                    }])
            if "$match" in stage:
                result = [d for d in result if self._matches(d, stage["$match"])]
            if "$sort" in stage:
                for key, direction in reversed(list(stage["$sort"].items())):
                    result.sort(key=lambda d: (d.get(key) is None, d.get(key)), reverse=(direction == -1))
            if "$limit" in stage:
                result = result[:stage["$limit"]]
        return InMemoryAggregateCursor(result)

    # ------------------------------------------------------------------
    def _filter(self, query):
        if not query:
            return list(self.items)
        return [i for i in self.items if self._matches(i, query)]

    def _matches(self, item, query):
        if not query:
            return True
        if "$or" in query:
            return any(self._matches(item, c) for c in query["$or"])
        for key, value in query.items():
            if key.startswith("$"):
                continue
            if isinstance(value, dict):
                if "$regex" in value:
                    flags = re.IGNORECASE if "i" in value.get("$options", "") else 0
                    if not re.search(value["$regex"], str(item.get(key, "")), flags):
                        return False
                elif "$ne" in value:
                    if item.get(key) == value["$ne"]:
                        return False
                elif "$in" in value:
                    if item.get(key) not in value["$in"]:
                        return False
                elif "$gte" in value:
                    if item.get(key) is None or item.get(key) < value["$gte"]:
                        return False
                elif "$gt" in value:
                    if item.get(key) is None or item.get(key) <= value["$gt"]:
                        return False
            else:
                if item.get(key) != value:
                    return False
        return True


class InMemoryDatabase:
    def __init__(self):
        self.tracks = InMemoryCollection("tracks")
        self.playlists = InMemoryCollection("playlists")
        self.favorites = InMemoryCollection("favorites")
        self.search_history = InMemoryCollection("search_history")


# ---------------------------------------------------------------------------
# Connection
# ---------------------------------------------------------------------------
mongo_url = os.environ.get("MONGO_URL")
db_name = os.environ.get("DB_NAME", "resonance")

client = None
if mongo_url:
    client = AsyncIOMotorClient(mongo_url)
    database = client[db_name]
else:
    print("No MONGO_URL configured — using in-memory fallback database")
    database = InMemoryDatabase()


def get_database():
    return database


# ---------------------------------------------------------------------------
# Index creation
# ---------------------------------------------------------------------------
async def _safe_create_index(collection, *args, **kwargs):
    try:
        await asyncio.wait_for(collection.create_index(*args, **kwargs), timeout=8)
    except asyncio.TimeoutError:
        print(f"Timeout creating index: {args}")
    except Exception as exc:
        print(f"Error creating index {args}: {exc}")


async def create_indexes():
    """Create all collection indexes."""
    try:
        # tracks
        await _safe_create_index(database.tracks, "title")
        await _safe_create_index(database.tracks, "artist")
        await _safe_create_index(database.tracks, "album")
        await _safe_create_index(database.tracks, "genre")
        await _safe_create_index(database.tracks, "upload_date")
        await _safe_create_index(database.tracks, "play_count")
        await _safe_create_index(database.tracks, "youtube_id", sparse=True)
        await _safe_create_index(
            database.tracks,
            [("title", "text"), ("artist", "text"), ("album", "text"), ("genre", "text")],
        )
        # playlists
        await _safe_create_index(database.playlists, "name")
        await _safe_create_index(database.playlists, "created_date")
        # favorites — index track_id for fast lookup + dedup
        await _safe_create_index(database.favorites, "track_id", unique=True)
        await _safe_create_index(database.favorites, "added_date")
        # search history
        await _safe_create_index(database.search_history, "timestamp")
        await _safe_create_index(database.search_history, "query")

        print("Database indexes created successfully")
    except Exception as exc:
        print(f"Error creating indexes: {exc}")
