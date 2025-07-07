#!/usr/bin/env python3
"""
Fetch EAS build logs using web scraping
Works in Termux environment without full browser
"""

import sys
import requests
from bs4 import BeautifulSoup
import json
import re
from datetime import datetime

def fetch_eas_logs_api(build_id):
    """Try to fetch logs using EAS API endpoints"""
    print(f"📥 Fetching logs for build: {build_id}")
    
    # Try different API endpoints
    endpoints = [
        f"https://expo.dev/api/v2/projects/productivity-app/builds/{build_id}/logs",
        f"https://api.expo.dev/v2/projects/productivity-app/builds/{build_id}/logs",
        f"https://expo.dev/accounts/gaelican/projects/productivity-app/builds/{build_id}/logs.txt",
    ]
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/plain,application/json,*/*',
    }
    
    for endpoint in endpoints:
        try:
            print(f"   Trying: {endpoint}")
            response = requests.get(endpoint, headers=headers, timeout=30)
            if response.status_code == 200:
                print("   ✅ Success!")
                return response.text
        except Exception as e:
            print(f"   ❌ Failed: {e}")
    
    return None

def fetch_eas_logs_scrape(build_id):
    """Scrape build page for logs"""
    url = f"https://expo.dev/accounts/gaelican/projects/productivity-app/builds/{build_id}"
    print(f"🌐 Scraping: {url}")
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=30)
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Look for log content in various places
        log_selectors = [
            'pre',
            'code',
            'div.logs',
            'div[class*="log"]',
            'div[class*="Log"]',
            'textarea',
        ]
        
        for selector in log_selectors:
            elements = soup.select(selector)
            for elem in elements:
                text = elem.get_text()
                if len(text) > 100 and ('error' in text.lower() or 'build' in text.lower()):
                    print(f"   ✅ Found logs in {selector}")
                    return text
        
        # Try to find JSON data
        scripts = soup.find_all('script')
        for script in scripts:
            if script.string and 'buildLogs' in script.string:
                print("   ✅ Found logs in script tag")
                # Extract JSON data
                match = re.search(r'buildLogs["\']?\s*:\s*["\']([^"\']+)', script.string)
                if match:
                    return match.group(1)
        
    except Exception as e:
        print(f"❌ Scraping failed: {e}")
    
    return None

def analyze_logs(logs):
    """Analyze logs for errors"""
    if not logs:
        return
    
    print("\n🔍 Error Analysis:")
    print("==================")
    
    error_patterns = [
        (r'FAILURE: Build failed.*', 'Build Failure'),
        (r'Could not read script.*', 'Script Not Found'),
        (r'Could not find.*', 'Missing Dependency'),
        (r'settings\.gradle.*line \d+', 'Settings.gradle Error'),
        (r'build\.gradle.*line \d+', 'Build.gradle Error'),
        (r'> .*', 'Gradle Error Detail'),
        (r'Error: .*', 'General Error'),
        (r'BUILD FAILED in \d+s', 'Build Failed'),
    ]
    
    found_errors = []
    for pattern, error_type in error_patterns:
        matches = re.findall(pattern, logs, re.MULTILINE | re.IGNORECASE)
        for match in matches:
            found_errors.append((error_type, match.strip()))
    
    if found_errors:
        for error_type, error in found_errors[:10]:  # Show first 10 errors
            print(f"\n{error_type}:")
            print(f"   {error}")
    else:
        print("   No specific errors found")
    
    # Save logs
    filename = f"eas_logs_{build_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
    with open(filename, 'w') as f:
        f.write(logs)
    print(f"\n✅ Logs saved to: {filename}")

def main():
    if len(sys.argv) < 2:
        print("Usage: python fetch-eas-logs-web.py <build-id>")
        sys.exit(1)
    
    build_id = sys.argv[1]
    
    # Try API first
    logs = fetch_eas_logs_api(build_id)
    
    # If API fails, try scraping
    if not logs:
        print("\n⚠️ API fetch failed, trying web scraping...")
        logs = fetch_eas_logs_scrape(build_id)
    
    if logs:
        analyze_logs(logs)
    else:
        print("\n❌ Could not fetch logs")
        print("   Please check the build URL manually")
        print(f"   https://expo.dev/accounts/gaelican/projects/productivity-app/builds/{build_id}")

if __name__ == "__main__":
    main()
