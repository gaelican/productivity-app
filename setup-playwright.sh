#!/bin/bash
# Setup Playwright for Claude Code CLI in Termux (Alternative to Puppeteer)

echo "🚀 Setting up Web Scraping for Claude Code CLI in Termux"
echo "========================================================"

# Step 1: Install Python dependencies (Playwright works better in Termux via Python)
echo "📦 Installing Python and dependencies..."
pkg install python python-pip -y

# Step 2: Install Playwright
echo ""
echo "📦 Installing Playwright..."
pip install playwright requests beautifulsoup4 lxml

# Step 3: Try to install browsers (may fail on Termux)
echo ""
echo "🌐 Attempting to install browsers..."
python -m playwright install chromium 2>/dev/null || {
    echo "⚠️ Browser installation failed (expected on Termux)"
    echo "   Will use alternative methods..."
}

# Step 4: Create alternative web scraper using requests
echo ""
echo "📝 Creating web scraper for EAS logs..."
cat > fetch-eas-logs-web.py << 'EOF'
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
EOF
chmod +x fetch-eas-logs-web.py

# Step 5: Create curl-based fetcher as backup
echo ""
echo "📝 Creating curl-based fetcher..."
cat > fetch-eas-logs-curl.sh << 'EOF'
#!/bin/bash
# Fetch EAS logs using curl

BUILD_ID="${1}"
if [ -z "$BUILD_ID" ]; then
    echo "Usage: $0 <build-id>"
    exit 1
fi

echo "📥 Fetching logs for build: $BUILD_ID"

# Try different approaches
echo ""
echo "Method 1: Direct API call..."
curl -s -H "User-Agent: Mozilla/5.0" \
     "https://expo.dev/api/v2/projects/productivity-app/builds/${BUILD_ID}/logs" \
     -o "eas_logs_${BUILD_ID}_api.txt" 2>/dev/null

if [ -s "eas_logs_${BUILD_ID}_api.txt" ]; then
    echo "✅ Logs saved to: eas_logs_${BUILD_ID}_api.txt"
    echo ""
    echo "🔍 Error preview:"
    grep -E "(error|Error|ERROR|failed|Failed|FAILED)" "eas_logs_${BUILD_ID}_api.txt" | head -10
else
    echo "❌ API method failed"
    
    echo ""
    echo "Method 2: Web page scraping..."
    curl -s -H "User-Agent: Mozilla/5.0" \
         "https://expo.dev/accounts/gaelican/projects/productivity-app/builds/${BUILD_ID}" \
         -o "eas_page_${BUILD_ID}.html" 2>/dev/null
    
    if [ -s "eas_page_${BUILD_ID}.html" ]; then
        echo "✅ Page saved to: eas_page_${BUILD_ID}.html"
        echo "   Extracting text content..."
        
        # Extract text between pre tags or any readable content
        sed -n '/<pre>/,/<\/pre>/p' "eas_page_${BUILD_ID}.html" > "eas_logs_${BUILD_ID}_extracted.txt"
        
        if [ -s "eas_logs_${BUILD_ID}_extracted.txt" ]; then
            echo "✅ Extracted logs to: eas_logs_${BUILD_ID}_extracted.txt"
        else
            echo "⚠️ No <pre> tags found, saving all text..."
            # Extract all text content
            lynx -dump "eas_page_${BUILD_ID}.html" > "eas_logs_${BUILD_ID}_text.txt" 2>/dev/null || \
            w3m -dump "eas_page_${BUILD_ID}.html" > "eas_logs_${BUILD_ID}_text.txt" 2>/dev/null || \
            sed 's/<[^>]*>//g' "eas_page_${BUILD_ID}.html" | sed '/^$/d' > "eas_logs_${BUILD_ID}_text.txt"
        fi
    fi
fi

echo ""
echo "📋 Build URL: https://expo.dev/accounts/gaelican/projects/productivity-app/builds/${BUILD_ID}"
EOF
chmod +x fetch-eas-logs-curl.sh

# Step 6: Create Claude integration
echo ""
echo "🔗 Creating Claude integration..."
cat > claude-web-fetch.sh << 'EOF'
#!/bin/bash
# Fetch web content and pass to Claude

if [ $# -lt 2 ]; then
    echo "Usage: $0 <prompt> <url> [url2] ..."
    exit 1
fi

PROMPT="$1"
shift

echo "🌐 Fetching web content..."
CONTENT=""

for URL in "$@"; do
    echo "   Fetching: $URL"
    
    # Fetch with curl
    PAGE_CONTENT=$(curl -s -L -H "User-Agent: Mozilla/5.0" "$URL" | head -c 10000)
    
    if [ ! -z "$PAGE_CONTENT" ]; then
        # Extract text (remove HTML tags)
        TEXT_CONTENT=$(echo "$PAGE_CONTENT" | sed 's/<[^>]*>//g' | sed '/^$/d' | head -c 5000)
        CONTENT="${CONTENT}\n\n=== Content from $URL ===\n${TEXT_CONTENT}"
    fi
done

# Create enhanced prompt
ENHANCED_PROMPT="${PROMPT}

Web Content:
${CONTENT}"

# Run Claude
echo ""
echo "🤖 Running Claude..."
echo "$ENHANCED_PROMPT" | claude
EOF
chmod +x claude-web-fetch.sh

# Step 7: Test the setup
echo ""
echo "🧪 Testing web fetch capabilities..."
python fetch-eas-logs-web.py --version 2>/dev/null || echo "   Python script ready"
./fetch-eas-logs-curl.sh --help 2>/dev/null || echo "   Curl script ready"

# Step 8: Create convenience wrapper
cat > fetch-logs.sh << 'EOF'
#!/bin/bash
# Wrapper to fetch EAS logs using best available method

BUILD_ID="${1:-5487f401-cc5f-41f2-95c9-190b2fc4fdcb}"

echo "🔍 Fetching logs for build: $BUILD_ID"
echo "=================================="

# Try Python method first
if command -v python3 >/dev/null 2>&1; then
    echo "Using Python web scraper..."
    python3 fetch-eas-logs-web.py "$BUILD_ID"
else
    echo "Using curl method..."
    ./fetch-eas-logs-curl.sh "$BUILD_ID"
fi
EOF
chmod +x fetch-logs.sh

echo ""
echo "✅ Web scraping setup complete!"
echo ""
echo "📋 Usage:"
echo "1. Fetch EAS logs: ./fetch-logs.sh [build-id]"
echo "2. With Python: python fetch-eas-logs-web.py <build-id>"
echo "3. With curl: ./fetch-eas-logs-curl.sh <build-id>"
echo "4. Claude + web: ./claude-web-fetch.sh 'analyze this' https://example.com"
echo ""
echo "🔧 Note: Full browser automation (Puppeteer/Playwright) is not supported"
echo "   in Termux. Using alternative web scraping methods instead."