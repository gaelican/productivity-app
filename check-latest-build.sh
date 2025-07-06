#!/bin/bash
# Check latest EAS build status and logs

echo "🔍 Checking latest EAS build..."

# Get latest build info
BUILD_INFO=$(eas build:list --platform android --limit 1 --json 2>/dev/null | jq -r '.[0]')

if [ -z "$BUILD_INFO" ]; then
    echo "❌ No builds found"
    exit 1
fi

BUILD_ID=$(echo "$BUILD_INFO" | jq -r '.id')
BUILD_STATUS=$(echo "$BUILD_INFO" | jq -r '.status')
BUILD_URL=$(echo "$BUILD_INFO" | jq -r '.buildDetailsPageUrl')

echo ""
echo "📊 Latest Build Info:"
echo "   ID: $BUILD_ID"
echo "   Status: $BUILD_STATUS"
echo "   URL: $BUILD_URL"
echo ""

# If build failed, download logs
if [ "$BUILD_STATUS" = "ERRORED" ] || [ "$BUILD_STATUS" = "FAILED" ]; then
    echo "❌ Build failed. Downloading logs..."
    LOG_FILE="build_logs_${BUILD_ID}.txt"
    
    # Download build logs
    eas build:view $BUILD_ID --json | jq -r '.logs' > "$LOG_FILE" 2>/dev/null
    
    if [ -s "$LOG_FILE" ]; then
        echo "📄 Logs saved to: $LOG_FILE"
        echo ""
        echo "🔍 Error Summary:"
        echo "===================="
        
        # Extract key errors
        grep -E "(error|Error|ERROR|failed|Failed|FAILED)" "$LOG_FILE" | grep -v "npm WARN" | tail -20
    else
        echo "⚠️  Could not download logs. Trying alternative method..."
        # Try to get logs URL and fetch with curl
        LOGS_URL=$(eas build:view $BUILD_ID --json 2>/dev/null | jq -r '.artifacts.logs')
        if [ ! -z "$LOGS_URL" ] && [ "$LOGS_URL" != "null" ]; then
            curl -s "$LOGS_URL" > "$LOG_FILE"
            echo "📄 Logs saved to: $LOG_FILE"
        fi
    fi
fi