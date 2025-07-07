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
