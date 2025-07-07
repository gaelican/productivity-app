#!/bin/bash
# Monitor current EAS build

BUILD_ID="d67ebd86-bb9d-4a48-aa68-926919e8c6cd"

echo "📊 Monitoring EAS Build: $BUILD_ID"
echo "=================================="
echo ""

while true; do
    STATUS=$(eas build:view $BUILD_ID --non-interactive 2>&1 | grep "Status" | awk '{print $2}')
    
    if [[ "$STATUS" == "finished" ]]; then
        echo "✅ Build completed successfully!"
        echo ""
        echo "Download APK with:"
        echo "eas build:download --id $BUILD_ID"
        break
    elif [[ "$STATUS" == "errored" ]] || [[ "$STATUS" == "failed" ]]; then
        echo "❌ Build failed!"
        echo ""
        echo "Check logs at:"
        echo "https://expo.dev/accounts/gaelican/projects/productivity-app/builds/$BUILD_ID"
        break
    else
        echo -ne "\r⏳ Build status: $STATUS... ($(date '+%H:%M:%S'))"
    fi
    
    sleep 5
done

echo ""
echo "Final status: $STATUS"