#!/bin/bash
# Monitor EAS build in real-time

BUILD_ID="${1:-15d4147a-2db6-4d0d-bc80-3ce83812240f}"

echo "📊 Monitoring build: $BUILD_ID"
echo "Press Ctrl+C to stop monitoring"
echo ""

while true; do
    # Clear screen
    clear
    
    echo "🔄 EAS Build Monitor - $(date '+%Y-%m-%d %H:%M:%S')"
    echo "========================================"
    
    # Get build status
    BUILD_INFO=$(eas build:view $BUILD_ID 2>&1)
    
    # Extract status
    STATUS=$(echo "$BUILD_INFO" | grep "Status" | awk '{print $2}')
    
    # Display build info
    echo "$BUILD_INFO" | grep -E "(Status|Started at|Platform|Profile|Version)"
    echo ""
    
    # Check if build is complete
    if [[ "$STATUS" == "finished" ]]; then
        echo "✅ Build completed successfully!"
        break
    elif [[ "$STATUS" == "errored" ]] || [[ "$STATUS" == "failed" ]]; then
        echo "❌ Build failed!"
        echo ""
        echo "Downloading logs..."
        eas build:view $BUILD_ID --json 2>/dev/null | jq -r '.logs' > "build_error_${BUILD_ID}.log"
        echo "Logs saved to: build_error_${BUILD_ID}.log"
        break
    else
        echo "⏳ Build in progress..."
    fi
    
    # Wait 10 seconds before next check
    sleep 10
done