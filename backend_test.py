#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Resonance Music Player
Tests all backend endpoints including tracks, YouTube integration, and file streaming.
"""

import requests
import json
import os
import time
from typing import Dict, Any, Optional
from pathlib import Path
from urllib.parse import quote

class ResonanceMusicPlayerTester:
    def __init__(self):
        # Get backend URL from frontend .env file
        frontend_env_path = "frontend/.env"
        self.base_url = self._get_backend_url(frontend_env_path)
        self.api_url = f"{self.base_url}/api"
        self.session = requests.Session()
        self.test_results = []
        
    def _get_backend_url(self, env_path: str) -> str:
        """Extract backend URL from frontend .env file"""
        try:
            with open(env_path, 'r') as f:
                for line in f:
                    if line.startswith('REACT_APP_BACKEND_URL='):
                        return line.split('=', 1)[1].strip()
        except Exception as e:
            print(f"Warning: Could not read frontend .env file: {e}")
        
        # Fallback to local development server
        return "http://localhost:8001"
    
    def log_test(self, test_name: str, success: bool, details: str = "", response_time: float = 0):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        result = {
            "test": test_name,
            "status": status,
            "success": success,
            "details": details,
            "response_time": f"{response_time:.3f}s" if response_time > 0 else "N/A"
        }
        self.test_results.append(result)
        print(f"{status} {test_name} ({result['response_time']}) - {details}")
    
    def test_api_health(self):
        """Test basic API health check"""
        print("\n=== Testing API Health ===")
        try:
            start_time = time.time()
            response = self.session.get(f"{self.api_url}/", timeout=10)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                if "message" in data:
                    self.log_test("API Health Check", True, f"API is responding: {data['message']}", response_time)
                else:
                    self.log_test("API Health Check", False, f"Unexpected response format: {data}", response_time)
            else:
                self.log_test("API Health Check", False, f"HTTP {response.status_code}: {response.text}", response_time)
        except Exception as e:
            self.log_test("API Health Check", False, f"Connection error: {str(e)}")
    
    def test_track_endpoints(self):
        """Test all track-related endpoints"""
        print("\n=== Testing Track Endpoints ===")
        
        # Test GET /tracks (list all tracks)
        try:
            start_time = time.time()
            response = self.session.get(f"{self.api_url}/tracks", timeout=10)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                tracks = response.json()
                self.log_test("GET /tracks", True, f"Retrieved {len(tracks)} tracks", response_time)
                
                # Store first track ID for further testing
                self.test_track_id = tracks[0]["id"] if tracks else None
            else:
                self.log_test("GET /tracks", False, f"HTTP {response.status_code}: {response.text}", response_time)
                self.test_track_id = None
        except Exception as e:
            self.log_test("GET /tracks", False, f"Error: {str(e)}")
            self.test_track_id = None
        
        # Test GET /tracks/recent
        try:
            start_time = time.time()
            response = self.session.get(f"{self.api_url}/tracks/recent", timeout=10)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                recent_tracks = response.json()
                self.log_test("GET /tracks/recent", True, f"Retrieved {len(recent_tracks)} recent tracks", response_time)
            else:
                self.log_test("GET /tracks/recent", False, f"HTTP {response.status_code}: {response.text}", response_time)
        except Exception as e:
            self.log_test("GET /tracks/recent", False, f"Error: {str(e)}")
        
        # Test GET /tracks/stats
        try:
            start_time = time.time()
            response = self.session.get(f"{self.api_url}/tracks/stats", timeout=10)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                stats = response.json()
                self.log_test("GET /tracks/stats", True, f"Library stats: {stats.get('total_tracks', 0)} total tracks", response_time)
            else:
                self.log_test("GET /tracks/stats", False, f"HTTP {response.status_code}: {response.text}", response_time)
        except Exception as e:
            self.log_test("GET /tracks/stats", False, f"Error: {str(e)}")
        
        # Test individual track endpoints if we have a track ID
        if self.test_track_id:
            self._test_individual_track_endpoints(self.test_track_id)
        else:
            self.log_test("Individual Track Tests", False, "No tracks available for testing")
    
    def _test_individual_track_endpoints(self, track_id: str):
        """Test endpoints that require a specific track ID"""
        
        # Test GET /tracks/{id}
        try:
            start_time = time.time()
            response = self.session.get(f"{self.api_url}/tracks/{track_id}", timeout=10)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                track = response.json()
                self.log_test("GET /tracks/{id}", True, f"Retrieved track: {track.get('title', 'Unknown')}", response_time)
            else:
                self.log_test("GET /tracks/{id}", False, f"HTTP {response.status_code}: {response.text}", response_time)
        except Exception as e:
            self.log_test("GET /tracks/{id}", False, f"Error: {str(e)}")
        
        # Test PUT /tracks/{id} (update track)
        try:
            update_data = {
                "title": "Test Updated Title",
                "artist": "Test Updated Artist"
            }
            start_time = time.time()
            response = self.session.put(
                f"{self.api_url}/tracks/{track_id}",
                json=update_data,
                timeout=10
            )
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                updated_track = response.json()
                self.log_test("PUT /tracks/{id}", True, f"Updated track: {updated_track.get('title', 'Unknown')}", response_time)
            else:
                self.log_test("PUT /tracks/{id}", False, f"HTTP {response.status_code}: {response.text}", response_time)
        except Exception as e:
            self.log_test("PUT /tracks/{id}", False, f"Error: {str(e)}")
        
        # Test GET /tracks/{id}/stream
        try:
            start_time = time.time()
            response = self.session.get(f"{self.api_url}/tracks/{track_id}/stream", timeout=10)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                content_type = response.headers.get('content-type', '')
                if 'audio' in content_type or 'application/octet-stream' in content_type:
                    self.log_test("GET /tracks/{id}/stream", True, f"Stream available, content-type: {content_type}", response_time)
                else:
                    self.log_test("GET /tracks/{id}/stream", False, f"Unexpected content-type: {content_type}", response_time)
            elif response.status_code == 400:
                # This might be expected if the track is not a local file
                self.log_test("GET /tracks/{id}/stream", True, "Track is not a local file (expected for YouTube tracks)", response_time)
            else:
                self.log_test("GET /tracks/{id}/stream", False, f"HTTP {response.status_code}: {response.text}", response_time)
        except Exception as e:
            self.log_test("GET /tracks/{id}/stream", False, f"Error: {str(e)}")
    
    def test_track_upload(self):
        """Test track upload functionality"""
        print("\n=== Testing Track Upload ===")
        
        # Create a small test audio file (mock MP3)
        test_file_path = "/tmp/test_audio.mp3"
        try:
            # Create a minimal MP3-like file for testing
            with open(test_file_path, 'wb') as f:
                # Write minimal MP3 header
                f.write(b'\xff\xfb\x90\x00')  # MP3 frame header
                f.write(b'\x00' * 1000)  # Some data
            
            # Test valid file upload
            with open(test_file_path, 'rb') as f:
                files = {'file': ('test_audio.mp3', f, 'audio/mpeg')}
                start_time = time.time()
                response = self.session.post(f"{self.api_url}/tracks/upload", files=files, timeout=30)
                response_time = time.time() - start_time
                
                if response.status_code == 200:
                    track = response.json()
                    self.log_test("POST /tracks/upload (valid)", True, f"Uploaded track: {track.get('title', 'Unknown')}", response_time)
                    # Store the uploaded track ID for cleanup
                    self.uploaded_track_id = track.get('id')
                else:
                    self.log_test("POST /tracks/upload (valid)", False, f"HTTP {response.status_code}: {response.text}", response_time)
                    self.uploaded_track_id = None
        except Exception as e:
            self.log_test("POST /tracks/upload (valid)", False, f"Error: {str(e)}")
            self.uploaded_track_id = None
        finally:
            # Clean up test file
            if os.path.exists(test_file_path):
                os.remove(test_file_path)
        
        # Test invalid file type
        try:
            test_txt_path = "/tmp/test.txt"
            with open(test_txt_path, 'w') as f:
                f.write("This is not an audio file")
            
            with open(test_txt_path, 'rb') as f:
                files = {'file': ('test.txt', f, 'text/plain')}
                start_time = time.time()
                response = self.session.post(f"{self.api_url}/tracks/upload", files=files, timeout=10)
                response_time = time.time() - start_time
                
                if response.status_code == 400:
                    self.log_test("POST /tracks/upload (invalid)", True, "Correctly rejected invalid file type", response_time)
                else:
                    self.log_test("POST /tracks/upload (invalid)", False, f"Should have rejected invalid file: HTTP {response.status_code}", response_time)
            
            os.remove(test_txt_path)
        except Exception as e:
            self.log_test("POST /tracks/upload (invalid)", False, f"Error: {str(e)}")
    
    def test_youtube_endpoints(self):
        """Test YouTube integration endpoints"""
        print("\n=== Testing YouTube Integration ===")
        
        # Test YouTube search
        try:
            params = {'q': 'classical music', 'limit': 5}
            start_time = time.time()
            response = self.session.get(f"{self.api_url}/youtube/search", params=params, timeout=15)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                results = response.json()
                self.log_test("GET /youtube/search", True, f"Found {len(results)} search results", response_time)
                
                # Store first result for further testing
                self.test_youtube_id = results[0]["id"] if results else None
            else:
                self.log_test("GET /youtube/search", False, f"HTTP {response.status_code}: {response.text}", response_time)
                self.test_youtube_id = None
        except Exception as e:
            self.log_test("GET /youtube/search", False, f"Error: {str(e)}")
            self.test_youtube_id = None
        
        # Test YouTube track info and stream if we have a YouTube ID
        if self.test_youtube_id:
            self._test_youtube_track_endpoints(self.test_youtube_id)
        else:
            # Use a known YouTube ID for testing
            self.test_youtube_id = "dQw4w9WgXcQ"  # Rick Roll - commonly available
            self._test_youtube_track_endpoints(self.test_youtube_id)
    
    def _test_youtube_track_endpoints(self, youtube_id: str):
        """Test YouTube endpoints that require a specific YouTube ID"""
        
        # Test GET /youtube/track/{youtube_id}
        try:
            start_time = time.time()
            response = self.session.get(f"{self.api_url}/youtube/track/{youtube_id}", timeout=15)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                track_info = response.json()
                self.log_test("GET /youtube/track/{id}", True, f"Retrieved track info: {track_info.get('title', 'Unknown')}", response_time)
            else:
                self.log_test("GET /youtube/track/{id}", False, f"HTTP {response.status_code}: {response.text}", response_time)
        except Exception as e:
            self.log_test("GET /youtube/track/{id}", False, f"Error: {str(e)}")
        
        # Test GET /youtube/stream/{youtube_id}
        try:
            start_time = time.time()
            response = self.session.get(f"{self.api_url}/youtube/stream/{youtube_id}", timeout=15)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                stream_data = response.json()
                if "stream_url" in stream_data:
                    self.log_test("GET /youtube/stream/{id}", True, "Stream URL retrieved successfully", response_time)
                else:
                    self.log_test("GET /youtube/stream/{id}", False, f"No stream_url in response: {stream_data}", response_time)
            else:
                self.log_test("GET /youtube/stream/{id}", False, f"HTTP {response.status_code}: {response.text}", response_time)
        except Exception as e:
            self.log_test("GET /youtube/stream/{id}", False, f"Error: {str(e)}")
        
        # Test POST /youtube/add-track
        try:
            start_time = time.time()
            response = self.session.post(f"{self.api_url}/youtube/add-track", params={'youtube_id': youtube_id}, timeout=15)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                track = response.json()
                self.log_test("POST /youtube/add-track", True, f"Added YouTube track: {track.get('title', 'Unknown')}", response_time)
                self.added_youtube_track_id = track.get('id')
            else:
                self.log_test("POST /youtube/add-track", False, f"HTTP {response.status_code}: {response.text}", response_time)
                self.added_youtube_track_id = None
        except Exception as e:
            self.log_test("POST /youtube/add-track", False, f"Error: {str(e)}")
            self.added_youtube_track_id = None
    
    def test_artwork_endpoint(self):
        """Test artwork serving endpoint"""
        print("\n=== Testing Artwork Endpoint ===")
        
        # Test with a non-existent artwork file
        try:
            start_time = time.time()
            response = self.session.get(f"{self.api_url}/artwork/nonexistent.jpg", timeout=10)
            response_time = time.time() - start_time
            
            if response.status_code == 404:
                self.log_test("GET /artwork/{filename} (not found)", True, "Correctly returned 404 for non-existent file", response_time)
            else:
                self.log_test("GET /artwork/{filename} (not found)", False, f"Expected 404, got HTTP {response.status_code}", response_time)
        except Exception as e:
            self.log_test("GET /artwork/{filename} (not found)", False, f"Error: {str(e)}")
        
        # Test directory traversal protection
        try:
            start_time = time.time()
            traversal_path = "/".join(part.replace('.', '%2E') for part in "../../../etc/passwd".split("/"))
            response = self.session.get(f"{self.api_url}/artwork/{traversal_path}", timeout=10)
            response_time = time.time() - start_time
            
            if response.status_code == 400:
                self.log_test("GET /artwork/{filename} (security)", True, "Correctly blocked directory traversal", response_time)
            else:
                self.log_test("GET /artwork/{filename} (security)", False, f"Security issue: HTTP {response.status_code}", response_time)
        except Exception as e:
            self.log_test("GET /artwork/{filename} (security)", False, f"Error: {str(e)}")
    
    def test_error_handling(self):
        """Test error handling for various scenarios"""
        print("\n=== Testing Error Handling ===")
        
        # Test invalid track ID
        try:
            start_time = time.time()
            response = self.session.get(f"{self.api_url}/tracks/invalid_id", timeout=10)
            response_time = time.time() - start_time
            
            if response.status_code == 400:
                self.log_test("Invalid Track ID", True, "Correctly returned 400 for invalid ID", response_time)
            else:
                self.log_test("Invalid Track ID", False, f"Expected 400, got HTTP {response.status_code}", response_time)
        except Exception as e:
            self.log_test("Invalid Track ID", False, f"Error: {str(e)}")
        
        # Test non-existent track ID (valid format but doesn't exist)
        try:
            fake_id = "507f1f77bcf86cd799439011"  # Valid ObjectId format
            start_time = time.time()
            response = self.session.get(f"{self.api_url}/tracks/{fake_id}", timeout=10)
            response_time = time.time() - start_time
            
            if response.status_code == 404:
                self.log_test("Non-existent Track ID", True, "Correctly returned 404 for non-existent track", response_time)
            else:
                self.log_test("Non-existent Track ID", False, f"Expected 404, got HTTP {response.status_code}", response_time)
        except Exception as e:
            self.log_test("Non-existent Track ID", False, f"Error: {str(e)}")
        
        # Test malformed request (empty search query)
        try:
            start_time = time.time()
            response = self.session.get(f"{self.api_url}/youtube/search", params={'q': '', 'limit': 5}, timeout=10)
            response_time = time.time() - start_time
            
            if response.status_code == 422:  # FastAPI validation error
                self.log_test("Empty Search Query", True, "Correctly rejected empty search query", response_time)
            else:
                self.log_test("Empty Search Query", False, f"Expected 422, got HTTP {response.status_code}", response_time)
        except Exception as e:
            self.log_test("Empty Search Query", False, f"Error: {str(e)}")
    
    def cleanup_test_data(self):
        """Clean up any test data created during testing"""
        print("\n=== Cleaning Up Test Data ===")
        
        # Delete uploaded test track if it exists
        if hasattr(self, 'uploaded_track_id') and self.uploaded_track_id:
            try:
                response = self.session.delete(f"{self.api_url}/tracks/{self.uploaded_track_id}", timeout=10)
                if response.status_code == 200:
                    self.log_test("Cleanup: Delete uploaded track", True, "Test track deleted successfully")
                else:
                    self.log_test("Cleanup: Delete uploaded track", False, f"HTTP {response.status_code}: {response.text}")
            except Exception as e:
                self.log_test("Cleanup: Delete uploaded track", False, f"Error: {str(e)}")
        
        # Note: We don't delete the YouTube track as it might be useful to keep
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*60)
        print("TEST SUMMARY")
        print("="*60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests*100):.1f}%")
        
        if failed_tests > 0:
            print(f"\nFAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"❌ {result['test']}: {result['details']}")
        
        print("\nDETAILED RESULTS:")
        for result in self.test_results:
            print(f"{result['status']} {result['test']} ({result['response_time']}) - {result['details']}")
    
    def run_all_tests(self):
        """Run all backend tests"""
        print(f"Starting Resonance Music Player Backend Tests")
        print(f"Backend URL: {self.base_url}")
        print(f"API URL: {self.api_url}")
        print("="*60)
        
        # Run all test suites
        self.test_api_health()
        self.test_track_endpoints()
        self.test_track_upload()
        self.test_youtube_endpoints()
        self.test_artwork_endpoint()
        self.test_error_handling()
        self.cleanup_test_data()
        
        # Print summary
        self.print_summary()
        
        return self.test_results


def main():
    """Main function to run all tests"""
    tester = ResonanceMusicPlayerTester()
    results = tester.run_all_tests()
    
    # Return exit code based on test results
    failed_tests = sum(1 for result in results if not result['success'])
    return 0 if failed_tests == 0 else 1


if __name__ == "__main__":
    exit(main())