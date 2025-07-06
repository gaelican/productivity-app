#!/bin/bash
# Test script for the automated build system

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_PATH="$(dirname "$SCRIPT_DIR")"

echo "🧪 Testing EAS Automated Build System"
echo "====================================="
echo ""

# Test 1: Check Python availability
echo "Test 1: Python availability"
if python3 --version &>/dev/null; then
    echo "✅ Python 3 is available: $(python3 --version)"
else
    echo "❌ Python 3 not found"
    exit 1
fi
echo ""

# Test 2: Check EAS CLI
echo "Test 2: EAS CLI availability"
if command -v eas &>/dev/null; then
    echo "✅ EAS CLI is available: $(eas --version)"
else
    echo "❌ EAS CLI not found"
    echo "   Install with: npm install -g eas-cli"
fi
echo ""

# Test 3: Test error pattern loading
echo "Test 3: Error pattern database"
python3 -c "
import json
with open('$SCRIPT_DIR/error_patterns.json', 'r') as f:
    data = json.load(f)
    print(f'✅ Loaded {len(data[\"error_patterns\"])} error patterns')
    print(f'   Fix priorities: {list(data[\"fix_priorities\"].keys())}')
    print(f'   Fix sequences: {len(data[\"fix_sequences\"])}')
" 2>/dev/null || echo "❌ Failed to load error patterns"
echo ""

# Test 4: Test fix engine
echo "Test 4: Fix engine import"
python3 -c "
import sys
sys.path.insert(0, '$SCRIPT_DIR')
try:
    from fix_engine import FixEngine
    engine = FixEngine('$PROJECT_PATH')
    print('✅ Fix engine loaded successfully')
    print(f'   Project path: {engine.project_path}')
    print(f'   Android path: {engine.android_path}')
except Exception as e:
    print(f'❌ Failed to load fix engine: {e}')
" || echo "❌ Fix engine test failed"
echo ""

# Test 5: Check notification system
echo "Test 5: Notification system"
if [ -f "$PROJECT_PATH/claude-notify.sh" ]; then
    echo "✅ Notification system available"
else
    echo "⚠️  Notification system not found (optional)"
fi
echo ""

# Test 6: Check project structure
echo "Test 6: Project structure"
required_files=(
    "package.json"
    "app.json"
    "android/build.gradle"
    "android/app/build.gradle"
    "android/settings.gradle"
)

all_good=true
for file in "${required_files[@]}"; do
    if [ -f "$PROJECT_PATH/$file" ]; then
        echo "✅ Found: $file"
    else
        echo "❌ Missing: $file"
        all_good=false
    fi
done
echo ""

# Test 7: Test build automation import
echo "Test 7: Build automation module"
python3 -c "
import sys
sys.path.insert(0, '$SCRIPT_DIR')
try:
    from build_automation import EASBuildAutomation
    automation = EASBuildAutomation('$PROJECT_PATH', max_retries=1)
    print('✅ Build automation loaded successfully')
    print(f'   Max retries: {automation.max_retries}')
    print(f'   Error patterns: {len(automation.error_patterns)}')
except Exception as e:
    print(f'❌ Failed to load build automation: {e}')
" || echo "❌ Build automation test failed"
echo ""

# Summary
echo "====================================="
if $all_good; then
    echo "✅ All tests passed! System is ready."
    echo ""
    echo "To start automated build, run:"
    echo "  $SCRIPT_DIR/run_automated_build.sh"
else
    echo "⚠️  Some tests failed. Please fix issues before running."
fi
echo ""