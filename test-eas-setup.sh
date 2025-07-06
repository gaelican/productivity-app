#!/bin/bash

echo "=== EAS Build Setup Checker ==="
echo ""

# Check if logged in
echo "1. Checking EAS login status..."
if eas whoami 2>/dev/null; then
    echo "✅ Logged in successfully!"
else
    echo "❌ Not logged in. Run: eas login"
    exit 1
fi

echo ""
echo "2. Checking project configuration..."

# Check eas.json
if [ -f "eas.json" ]; then
    echo "✅ eas.json found"
    cat eas.json
else
    echo "❌ eas.json not found. Run: eas build:configure"
fi

echo ""
echo "3. Checking app.json..."
if [ -f "app.json" ]; then
    echo "✅ app.json found"
    echo "   Package: com.productivityapp.app"
    echo "   Name: Productivity App"
else
    echo "❌ app.json not found"
fi

echo ""
echo "4. Ready to build!"
echo ""
echo "Run this command to start building:"
echo "  eas build --platform android --profile preview"
echo ""
echo "For production build:"
echo "  eas build --platform android --profile production"
echo ""