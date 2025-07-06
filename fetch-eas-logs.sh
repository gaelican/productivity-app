#!/bin/bash
# Fetch EAS build logs directly

BUILD_ID="${1:-15d4147a-2db6-4d0d-bc80-3ce83812240f}"

echo "📥 Fetching logs for build: $BUILD_ID"

# Method 1: Use eas build:logs command
echo "Method 1: Using eas build:logs..."
eas build:logs $BUILD_ID > "eas_logs_${BUILD_ID}.txt" 2>&1

if [ -s "eas_logs_${BUILD_ID}.txt" ]; then
    echo "✅ Logs downloaded to: eas_logs_${BUILD_ID}.txt"
    echo ""
    echo "🔍 Error Analysis:"
    echo "=================="
    
    # Extract Gradle errors
    echo ""
    echo "Gradle Errors:"
    grep -A 5 -B 5 -i "FAILURE: Build failed" "eas_logs_${BUILD_ID}.txt" | tail -20
    
    # Extract other errors
    echo ""
    echo "Other Errors:"
    grep -E "(error:|ERROR:|Error:|failed|Failed|FAILED)" "eas_logs_${BUILD_ID}.txt" | grep -v "npm WARN" | tail -20
    
    # Look for specific patterns
    echo ""
    echo "Settings.gradle issues:"
    grep -A 5 -B 5 "settings.gradle" "eas_logs_${BUILD_ID}.txt" | tail -20
else
    echo "❌ Could not download logs with Method 1"
    
    # Method 2: Use web URL
    echo ""
    echo "Method 2: Trying web scraping..."
    LOGS_URL="https://expo.dev/accounts/gaelican/projects/productivity-app/builds/${BUILD_ID}"
    echo "Opening: $LOGS_URL"
    echo "Please check the logs manually at this URL"
fi