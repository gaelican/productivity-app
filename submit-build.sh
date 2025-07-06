#!/bin/bash

echo "=== Submitting EAS Build ==="
echo ""

# Run verification first
echo "Running build verification..."
./verify-build-config.sh

echo ""
echo "Press Enter to continue with build submission, or Ctrl+C to cancel..."
read

# Submit the build
echo "Submitting build..."
eas build -p android --profile preview --non-interactive

# Get the build ID from the output
echo ""
echo "Build submitted! Use './check-eas-build.sh' to monitor progress."