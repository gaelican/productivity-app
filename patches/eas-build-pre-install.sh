#!/bin/bash
# EAS Build pre-install hook to apply Android fixes

echo "Running pre-install hook to fix Android build issues..."

# Apply fixes after npm install
if [ -f "patches/apply-fixes.sh" ]; then
    ./patches/apply-fixes.sh
fi
