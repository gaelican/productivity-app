#!/bin/bash

# Script to check EAS build status and fetch logs automatically
# Usage: ./check-eas-build.sh [build-id]

if [ -z "$1" ]; then
    echo "Checking latest build..."
    eas build:list --platform android --limit 1 --json | jq -r '.[0] | "Build ID: \(.id)\nStatus: \(.status)\nURL: https://expo.dev\(.buildDetailsPageUrl)"'
else
    echo "Checking build $1..."
    eas build:view $1 --json | jq -r '"Build ID: \(.id)\nStatus: \(.status)\nURL: https://expo.dev\(.buildDetailsPageUrl)"'
fi

echo ""
echo "To view full logs, run:"
echo "eas build:view [build-id]"