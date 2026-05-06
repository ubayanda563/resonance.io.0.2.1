import os
import uuid
import hashlib
import mimetypes
from typing import Optional, Dict, Any
from fastapi import UploadFile
from mutagen import File as MutagenFile
from mutagen.id3 import ID3NoHeaderError
from PIL import Image
import io
import base64
import logging

logger = logging.getLogger(__name__)


class FileService:
    def __init__(self, upload_dir: str = None):
        if upload_dir is None:
            # Use relative path from the backend directory
            backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            upload_dir = os.path.join(backend_dir, "uploads")
        
        self.upload_dir = upload_dir
        self.audio_dir = os.path.join(upload_dir, "audio")
        self.artwork_dir = os.path.join(upload_dir, "artwork")
        
        # Create directories if they don't exist
        os.makedirs(self.audio_dir, exist_ok=True)
        os.makedirs(self.artwork_dir, exist_ok=True)
    
    async def save_audio_file(self, file: UploadFile) -> Dict[str, Any]:
        """Save uploaded audio file and extract metadata"""
        try:
            # Generate unique filename
            file_extension = os.path.splitext(file.filename)[1].lower()
            unique_filename = f"{uuid.uuid4()}{file_extension}"
            file_path = os.path.join(self.audio_dir, unique_filename)
            
            # Save file
            content = await file.read()
            with open(file_path, "wb") as f:
                f.write(content)
            
                # Extract metadata and verify audio format
            metadata = self._extract_metadata(file_path)
            if metadata is None:
                raise ValueError("Unsupported audio format")

            # Extract artwork if available
            artwork_url = await self._extract_artwork(file_path, unique_filename)
            
            return {
                "file_path": file_path,
                "filename": unique_filename,
                "original_filename": file.filename,
                "file_size": len(content),
                "format": file_extension[1:],  # Remove the dot
                "mime_type": self._guess_mime_type(file_path),
                "metadata": metadata,
                "artwork_url": artwork_url
            }
        except Exception as e:
            logger.error(f"Error saving audio file: {str(e)}")
            # Clean up file if it was created
            if 'file_path' in locals() and os.path.exists(file_path):
                os.remove(file_path)
            raise
    
    def _extract_metadata(self, file_path: str) -> Dict[str, Any]:
        """Extract metadata from audio file"""
        try:
            audio_file = MutagenFile(file_path)
            if audio_file is None:
                return None
            
            metadata = {
                "title": self._get_tag(audio_file, ['TIT2', 'TITLE', '\xa9nam']),
                "artist": self._get_tag(audio_file, ['TPE1', 'ARTIST', '\xa9ART']),
                "album": self._get_tag(audio_file, ['TALB', 'ALBUM', '\xa9alb']),
                "duration": int(audio_file.info.length) if audio_file.info else 0,
                "bitrate": getattr(audio_file.info, 'bitrate', 0),
                "sample_rate": getattr(audio_file.info, 'sample_rate', 0)
            }
            
            # Clean up metadata
            for key, value in metadata.items():
                if isinstance(value, list) and value:
                    metadata[key] = str(value[0])
                elif value is None:
                    metadata[key] = ""
                else:
                    metadata[key] = str(value)
            
            return metadata
        except (ID3NoHeaderError, Exception) as e:
            logger.warning(f"Could not extract metadata from {file_path}: {str(e)}")
            return {}
    
    def _get_tag(self, audio_file, tag_names: list) -> str:
        """Get tag value from audio file using multiple possible tag names"""
        for tag_name in tag_names:
            if tag_name in audio_file:
                value = audio_file[tag_name]
                if isinstance(value, list) and value:
                    return str(value[0])
                return str(value)
        return ""
    
    async def _extract_artwork(self, file_path: str, unique_filename: str) -> str:
        """Extract album artwork from audio file"""
        try:
            audio_file = MutagenFile(file_path)
            if audio_file is None:
                return self._get_default_artwork()
            
            # Try to get artwork from different tag formats
            artwork_data = None
            
            # ID3 tags (MP3)
            if 'APIC:' in audio_file:
                artwork_data = audio_file['APIC:'].data
            elif 'APIC' in audio_file:
                artwork_data = audio_file['APIC'].data
            
            # MP4 tags
            elif 'covr' in audio_file:
                artwork_data = audio_file['covr'][0]
            
            # FLAC tags
            elif hasattr(audio_file, 'pictures') and audio_file.pictures:
                artwork_data = audio_file.pictures[0].data
            
            if artwork_data:
                # Save artwork as image file
                artwork_filename = f"{os.path.splitext(unique_filename)[0]}.jpg"
                artwork_path = os.path.join(self.artwork_dir, artwork_filename)
                
                # Convert to JPEG if needed
                try:
                    img = Image.open(io.BytesIO(artwork_data))
                    img = img.convert('RGB')
                    img.save(artwork_path, 'JPEG', quality=85)
                    return f"/api/artwork/{artwork_filename}"
                except Exception as e:
                    logger.warning(f"Could not process artwork: {str(e)}")
            
            return self._get_default_artwork()
        except Exception as e:
            logger.warning(f"Could not extract artwork from {file_path}: {str(e)}")
            return self._get_default_artwork()
    
    def _get_default_artwork(self) -> str:
        """Return default artwork URL"""
        return "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop&crop=center"

    def _guess_mime_type(self, file_path: str) -> str:
        """Guess MIME type based on file extension"""
        mime_type, _ = mimetypes.guess_type(file_path)
        return mime_type or 'application/octet-stream'
    
    def delete_file(self, file_path: str) -> bool:
        """Delete a file from the filesystem"""
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                return True
            return False
        except Exception as e:
            logger.error(f"Error deleting file {file_path}: {str(e)}")
            return False
    
    def get_file_info(self, file_path: str) -> Optional[Dict[str, Any]]:
        """Get information about a file"""
        try:
            if not os.path.exists(file_path):
                return None
            
            stat = os.stat(file_path)
            return {
                "size": stat.st_size,
                "created": stat.st_ctime,
                "modified": stat.st_mtime,
                "exists": True
            }
        except Exception as e:
            logger.error(f"Error getting file info for {file_path}: {str(e)}")
            return None