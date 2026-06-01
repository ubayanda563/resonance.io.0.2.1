#!/usr/bin/env python3
"""
🎵 Resonance Health Check & Diagnostics
Tests backend API, frontend connectivity, and system health
"""

import requests
import json
import sys
import time
from datetime import datetime

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

class HealthChecker:
    def __init__(self):
        self.backend_url = "http://localhost:8001"
        self.frontend_url = "http://localhost:3000"
        self.results = []
        self.timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    def log(self, category, test_name, success, details=""):
        """Log test result"""
        status = f"{Colors.GREEN}✓{Colors.RESET}" if success else f"{Colors.RED}✗{Colors.RESET}"
        self.results.append({
            "category": category,
            "test": test_name,
            "success": success,
            "details": details
        })
        print(f"{status} {category}: {test_name}")
        if details:
            print(f"  {Colors.YELLOW}→ {details}{Colors.RESET}")

    def test_backend_health(self):
        """Test backend API health"""
        print(f"\n{Colors.BOLD}{Colors.BLUE}🔧 Backend Tests{Colors.RESET}")
        try:
            response = requests.get(f"{self.backend_url}/api/health", timeout=5)
            self.log("Backend", "Health Check", response.status_code == 200, 
                    f"Status: {response.status_code}")
            return response.status_code == 200
        except Exception as e:
            self.log("Backend", "Health Check", False, f"Error: {str(e)}")
            return False

    def test_backend_root(self):
        """Test backend root endpoint"""
        try:
            response = requests.get(f"{self.backend_url}/api/", timeout=5)
            self.log("Backend", "API Root", response.status_code == 200)
            return response.status_code == 200
        except Exception as e:
            self.log("Backend", "API Root", False, f"Error: {str(e)}")
            return False

    def test_tracks_endpoint(self):
        """Test tracks endpoint"""
        try:
            response = requests.get(f"{self.backend_url}/api/tracks", timeout=5)
            self.log("Backend", "Tracks List", response.status_code == 200,
                    f"Found {len(response.json() or [])} tracks")
            return response.status_code == 200
        except Exception as e:
            self.log("Backend", "Tracks List", False, f"Error: {str(e)}")
            return False

    def test_playlists_endpoint(self):
        """Test playlists endpoint"""
        try:
            response = requests.get(f"{self.backend_url}/api/playlists", timeout=5)
            self.log("Backend", "Playlists List", response.status_code == 200)
            return response.status_code == 200
        except Exception as e:
            self.log("Backend", "Playlists List", False, f"Error: {str(e)}")
            return False

    def test_search_endpoint(self):
        """Test search endpoint"""
        try:
            response = requests.get(f"{self.backend_url}/api/search?q=test", timeout=5)
            self.log("Backend", "Search", response.status_code == 200)
            return response.status_code == 200
        except Exception as e:
            self.log("Backend", "Search", False, f"Error: {str(e)}")
            return False

    def test_favorites_endpoint(self):
        """Test favorites endpoint"""
        try:
            response = requests.get(f"{self.backend_url}/api/favorites", timeout=5)
            self.log("Backend", "Favorites List", response.status_code == 200)
            return response.status_code == 200
        except Exception as e:
            self.log("Backend", "Favorites List", False, f"Error: {str(e)}")
            return False

    def test_recommendations_endpoint(self):
        """Test recommendations endpoint"""
        try:
            response = requests.get(f"{self.backend_url}/api/recommendations", timeout=5)
            self.log("Backend", "Recommendations", response.status_code == 200)
            return response.status_code == 200
        except Exception as e:
            self.log("Backend", "Recommendations", False, f"Error: {str(e)}")
            return False

    def test_frontend_connectivity(self):
        """Test frontend connectivity"""
        print(f"\n{Colors.BOLD}{Colors.BLUE}🎨 Frontend Tests{Colors.RESET}")
        try:
            response = requests.get(self.frontend_url, timeout=5)
            self.log("Frontend", "Connectivity", response.status_code == 200,
                    f"Frontend is running on port 3000")
            return response.status_code == 200
        except Exception as e:
            self.log("Frontend", "Connectivity", False, 
                    f"Frontend not accessible - make sure to run 'npm start'")
            return False

    def test_cors(self):
        """Test CORS configuration"""
        print(f"\n{Colors.BOLD}{Colors.BLUE}🔐 CORS Tests{Colors.RESET}")
        try:
            headers = {'Origin': 'http://localhost:3000'}
            response = requests.options(f"{self.backend_url}/api/tracks", 
                                       headers=headers, timeout=5)
            cors_origin = response.headers.get('access-control-allow-origin')
            has_cors = cors_origin is not None
            self.log("CORS", "Allow-Origin Header", has_cors, 
                    f"Origin: {cors_origin or 'Not set'}")
            return has_cors
        except Exception as e:
            self.log("CORS", "Allow-Origin Header", False, f"Error: {str(e)}")
            return False

    def print_summary(self):
        """Print test summary"""
        print(f"\n{Colors.BOLD}{Colors.BLUE}📊 Test Summary{Colors.RESET}")
        print("-" * 50)
        
        total = len(self.results)
        passed = sum(1 for r in self.results if r['success'])
        failed = total - passed
        
        for category in set(r['category'] for r in self.results):
            cat_results = [r for r in self.results if r['category'] == category]
            cat_passed = sum(1 for r in cat_results if r['success'])
            cat_total = len(cat_results)
            status = f"{Colors.GREEN}✓{Colors.RESET}" if cat_passed == cat_total else f"{Colors.RED}✗{Colors.RESET}"
            print(f"{status} {category}: {cat_passed}/{cat_total} passed")
        
        print("-" * 50)
        status_color = Colors.GREEN if failed == 0 else Colors.RED
        print(f"{status_color}{Colors.BOLD}Total: {passed}/{total} passed{Colors.RESET}")
        
        if failed > 0:
            print(f"\n{Colors.YELLOW}⚠️  Failed Tests:{Colors.RESET}")
            for result in self.results:
                if not result['success']:
                    print(f"  • {result['category']}: {result['test']}")
                    if result['details']:
                        print(f"    {result['details']}")
        
        return failed == 0

    def run_all_tests(self):
        """Run all health checks"""
        print(f"{Colors.BOLD}{Colors.BLUE}🎵 Resonance Health Check{Colors.RESET}")
        print(f"Time: {self.timestamp}")
        print("-" * 50)
        
        # Backend tests
        backend_ok = self.test_backend_health()
        if not backend_ok:
            print(f"\n{Colors.RED}❌ Backend is not responding!{Colors.RESET}")
            print("   Make sure to start the backend with: python backend/server.py")
            return False
        
        self.test_backend_root()
        self.test_tracks_endpoint()
        self.test_playlists_endpoint()
        self.test_search_endpoint()
        self.test_favorites_endpoint()
        self.test_recommendations_endpoint()
        
        # Frontend tests
        frontend_ok = self.test_frontend_connectivity()
        if not frontend_ok:
            print(f"\n{Colors.YELLOW}⚠️  Frontend is not running{Colors.RESET}")
            print("   Start frontend with: npm start (in frontend directory)")
        
        # CORS tests
        self.test_cors()
        
        # Print summary
        all_ok = self.print_summary()
        
        return all_ok

def main():
    """Main entry point"""
    checker = HealthChecker()
    success = checker.run_all_tests()
    
    if success:
        print(f"\n{Colors.GREEN}✅ All systems healthy!{Colors.RESET}")
        sys.exit(0)
    else:
        print(f"\n{Colors.RED}⚠️  Some tests failed. Check the output above.{Colors.RESET}")
        sys.exit(1)

if __name__ == "__main__":
    main()
