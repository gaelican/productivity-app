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
