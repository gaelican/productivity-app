#!/bin/bash
set -e

echo "✅ EAS Build completed successfully!"

# Clean gradle cache to prevent stale references
echo "🧹 Cleaning gradle cache..."
cd android
./gradlew clean
rm -rf .gradle
rm -rf app/build
cd ..

echo "✅ Post-build cleanup complete"