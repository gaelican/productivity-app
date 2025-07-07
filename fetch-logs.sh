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
