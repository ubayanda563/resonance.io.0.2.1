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


class InMemoryResult:
    def __init__(self, inserted_id=None, matched_count=0, deleted_count=0, inserted_ids=None):
        self.inserted_id = inserted_id
        self.matched_count = matched_count
        self.deleted_count = deleted_count
        self.inserted_ids = inserted_ids or []


class InMemoryCursor:
    def __init__(self, items):
        self._items = items
        self._sort_spec = None
        self._skip = 0
        self._limit = None

    def sort(self, sort_spec, direction=None):
        if direction is not None:
            self._sort_spec = [(sort_spec, direction)]
        elif isinstance(sort_spec, tuple):
            self._sort_spec = [sort_spec]
        else:
            self._sort_spec = sort_spec
        return self

    def skip(self, count):
        self._skip = count
        return self

    def limit(self, count):
        self._limit = count
        return self

    async def to_list(self, length):
        items = list(self._items)
        if self._sort_spec:
            for key, direction in reversed(self._sort_spec):
                items.sort(key=lambda doc: doc.get(key), reverse=(direction == -1))
        if self._skip:
            items = items[self._skip:]
        if self._limit is not None:
            items = items[: self._limit]
        # Return shallow copies to avoid mutating the stored documents
        return [item.copy() for item in items]


class InMemoryAggregateCursor:
    def __init__(self, items):
        self._items = items

    async def to_list(self, length):
        return self._items[:length]


class InMemoryCollection:
    def __init__(self, name):
        self.name = name
        self.items = []

    async def create_index(self, *args, **kwargs):
        return None

    def find(self, query=None):
        return InMemoryCursor(self._filter_items(query))

    async def find_one(self, query):
        for item in self._filter_items(query):
            return item.copy()
        return None

    async def insert_one(self, document):
        doc = document.copy()
        if '_id' not in doc:
            doc['_id'] = ObjectId()
        self.items.append(doc)
        return InMemoryResult(inserted_id=doc['_id'])

    async def insert_many(self, documents):
        inserted_ids = []
        for document in documents:
            doc = document.copy()
            if '_id' not in doc:
                doc['_id'] = ObjectId()
            self.items.append(doc)
            inserted_ids.append(doc['_id'])
        return InMemoryResult(inserted_ids=inserted_ids)

    async def update_one(self, query, update):
        item = None
        for row in self._filter_items(query):
            item = row
            break
        if not item:
            return InMemoryResult(matched_count=0)
        if '$set' in update:
            item.update(update['$set'])
        return InMemoryResult(matched_count=1)

    async def delete_one(self, query):
        for idx, item in enumerate(self.items):
            if self._matches(item, query):
                del self.items[idx]
                return InMemoryResult(deleted_count=1)
        return InMemoryResult(deleted_count=0)

    async def count_documents(self, query):
        return len(list(self._filter_items(query)))

    def aggregate(self, pipeline):
        if not pipeline:
            return InMemoryAggregateCursor([])
        result = list(self.items)
        for stage in pipeline:
            if '$group' in stage:
                group = stage['$group']
                if group.get('_id') is None:
                    aggregate = {
                        'total_tracks': 0,
                        'local_tracks': 0,
                        'youtube_tracks': 0,
                        'total_duration': 0,
                        'total_size': 0,
                        'artists': set(),
                        'albums': set(),
                    }
                    for doc in result:
                        aggregate['total_tracks'] += 1
                        aggregate['local_tracks'] += 1 if doc.get('source') == 'local' else 0
                        aggregate['youtube_tracks'] += 1 if doc.get('source') == 'youtube' else 0
                        aggregate['total_duration'] += doc.get('duration', 0) or 0
                        aggregate['total_size'] += doc.get('file_size', 0) or 0
                        if doc.get('artist'):
                            aggregate['artists'].add(doc.get('artist'))
                        if doc.get('album'):
                            aggregate['albums'].add(doc.get('album'))
                    return InMemoryAggregateCursor([
                        {
                            'total_tracks': aggregate['total_tracks'],
                            'local_tracks': aggregate['local_tracks'],
                            'youtube_tracks': aggregate['youtube_tracks'],
                            'total_duration': aggregate['total_duration'],
                            'total_size': aggregate['total_size'],
                            'artists': list(aggregate['artists']),
                            'albums': list(aggregate['albums']),
                        }
                    ])
        return InMemoryAggregateCursor([])

    def _filter_items(self, query):
        if not query:
            return list(self.items)
        return [item for item in self.items if self._matches(item, query)]

    def _matches(self, item, query):
        if query is None:
            return True
        if '$or' in query:
            return any(self._matches(item, cond) for cond in query['$or'])
        for key, value in query.items():
            if isinstance(value, dict) and '$regex' in value:
                pattern = value['$regex']
                flags = re.IGNORECASE if value.get('$options', '').lower() == 'i' else 0
                if not re.search(pattern, str(item.get(key, '')), flags):
                    return False
            else:
                if item.get(key) != value:
                    return False
        return True


class InMemoryDatabase:
    def __init__(self):
        self.tracks = InMemoryCollection('tracks')
        self.playlists = InMemoryCollection('playlists')


# MongoDB connection
mongo_url = os.environ.get('MONGO_URL')
db_name = os.environ.get('DB_NAME', 'resonance')

client = None
if mongo_url:
    client = AsyncIOMotorClient(mongo_url)
    database = client[db_name]
else:
    print('No MONGO_URL configured; using in-memory fallback database')
    database = InMemoryDatabase()


def get_database() -> AsyncIOMotorDatabase:
    """Dependency to get database instance"""
    return database


async def _safe_create_index(collection, *args, **kwargs):
    try:
        await asyncio.wait_for(collection.create_index(*args, **kwargs), timeout=8)
    except asyncio.TimeoutError:
        print(f"Timeout creating index: {args}")
    except Exception as e:
        print(f"Error creating index {args}: {str(e)}")


async def create_indexes():
    """Create database indexes for better performance"""
    try:
        # Tracks collection indexes
        await _safe_create_index(database.tracks, "title")
        await _safe_create_index(database.tracks, "artist")
        await _safe_create_index(database.tracks, "album")
        await _safe_create_index(database.tracks, "upload_date")
        await _safe_create_index(database.tracks, "play_count")
        await _safe_create_index(database.tracks, "youtube_id", sparse=True)
        await _safe_create_index(
            database.tracks,
            [("title", "text"), ("artist", "text"), ("album", "text")]
        )
        
        # Playlists collection indexes
        await _safe_create_index(database.playlists, "name")
        await _safe_create_index(database.playlists, "created_date")
        
        print("Database indexes created successfully")
    except Exception as e:
        print(f"Error creating indexes: {str(e)}")