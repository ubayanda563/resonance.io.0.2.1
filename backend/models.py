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
    duration: int  # in seconds
    file_path: Optional[str] = None  # for local files
    youtube_url: Optional[str] = None  # for YouTube tracks
    youtube_id: Optional[str] = None
    artwork_url: str
    upload_date: datetime = Field(default_factory=datetime.utcnow)
    play_count: int = 0
    user_rating: Optional[int] = None  # 1-5 stars
    source: TrackSource = TrackSource.LOCAL
    file_size: Optional[int] = None  # in bytes
    format: Optional[str] = None  # mp3, flac, etc.
    mime_type: Optional[str] = None

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class TrackCreate(BaseModel):
    title: str
    artist: str
    album: Optional[str] = None
    duration: int
    youtube_url: Optional[str] = None
    youtube_id: Optional[str] = None
    artwork_url: str
    source: TrackSource = TrackSource.LOCAL


class TrackUpdate(BaseModel):
    title: Optional[str] = None
    artist: Optional[str] = None
    album: Optional[str] = None
    user_rating: Optional[int] = None


class Playlist(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    name: str
    tracks: List[str] = []  # List of track IDs
    created_date: datetime = Field(default_factory=datetime.utcnow)
    updated_date: datetime = Field(default_factory=datetime.utcnow)
    artwork_url: Optional[str] = None

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
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

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


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
    total_duration: int  # in seconds
    total_size: int  # in bytes
    artists_count: int
    albums_count: int
    playlists_count: int