#!/bin/bash
BUILD_ID="${1:-$(eas build:list --limit 1 --non-interactive --json 2>/dev/null | jq -r '.[0].id')}"

if [ -z "$BUILD_ID" ] || [ "$BUILD_ID" = "null" ]; then
    echo "❌ No build ID provided and couldn't fetch latest build"
    echo "Usage: $0 [build-id]"
    exit 1
fi

echo "📥 Fetching logs for build: $BUILD_ID"
node fetch-eas-logs-puppeteer.js "$BUILD_ID"
