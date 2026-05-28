from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from enum import Enum


class RepeatMode(str, Enum):
    NONE = "none"
    TRACK = "track"
    PLAYLIST = "playlist"


class TrackSource(str, Enum):
    LOCAL = "local"
    YOUTUBE = "youtube"


class Track(BaseModel):
    id: Optional[str] = None
    title: str
    artist: str
    album: Optional[str] = None
    genre: Optional[str] = None          # NEW — populated from ID3 tags
    duration: int                         # seconds
    file_path: Optional[str] = None
    youtube_url: Optional[str] = None
    youtube_id: Optional[str] = None
    artwork_url: str
    upload_date: datetime = Field(default_factory=datetime.utcnow)
    play_count: int = 0
    user_rating: Optional[int] = None    # 1-5 stars
    source: TrackSource = TrackSource.LOCAL
    file_size: Optional[int] = None      # bytes
    format: Optional[str] = None
    mime_type: Optional[str] = None

    model_config = {"json_encoders": {datetime: lambda v: v.isoformat()}}


class TrackCreate(BaseModel):
    title: str
    artist: str
    album: Optional[str] = None
    genre: Optional[str] = None
    duration: int
    youtube_url: Optional[str] = None
    youtube_id: Optional[str] = None
    artwork_url: str
    source: TrackSource = TrackSource.LOCAL


class TrackUpdate(BaseModel):
    title: Optional[str] = None
    artist: Optional[str] = None
    album: Optional[str] = None
    genre: Optional[str] = None
    user_rating: Optional[int] = None


class Playlist(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    name: str
    tracks: List[str] = []
    created_date: datetime = Field(default_factory=datetime.utcnow)
    updated_date: datetime = Field(default_factory=datetime.utcnow)
    artwork_url: Optional[str] = None

    model_config = {
        "populate_by_name": True,
        "json_encoders": {datetime: lambda v: v.isoformat()},
    }


class PlaylistCreate(BaseModel):
    name: str
    tracks: List[str] = []


class PlaylistUpdate(BaseModel):
    name: Optional[str] = None
    tracks: Optional[List[str]] = None


class UserPreferences(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    current_track: Optional[str] = None
    queue: List[str] = []
    shuffle: bool = False
    repeat: RepeatMode = RepeatMode.NONE
    volume: float = 1.0
    updated_date: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "populate_by_name": True,
        "json_encoders": {datetime: lambda v: v.isoformat()},
    }


class FavoriteTrack(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    track_id: str
    added_date: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "populate_by_name": True,
        "json_encoders": {datetime: lambda v: v.isoformat()},
    }


class SearchQuery(BaseModel):
    query: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    model_config = {"json_encoders": {datetime: lambda v: v.isoformat()}}


class SimilarTrackSuggestion(BaseModel):
    track_id: str
    similarity_score: float
    reason: str


class YouTubeSearchResult(BaseModel):
    id: str
    title: str
    artist: str
    duration: int
    thumbnail: str
    url: str


class LibraryStats(BaseModel):
    total_tracks: int
    local_tracks: int
    youtube_tracks: int
    total_duration: int
    total_size: int
    artists_count: int
    albums_count: int
    playlists_count: int
