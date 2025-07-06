# EAS Build Automation Usage Guide

## Quick Start

### 1. Basic Usage

```bash
# Start automated monitoring and fixing
./eas-auto-fix.sh monitor

# Analyze a specific failed build
./eas-auto-fix.sh analyze <build-id>

# Run Python automation directly
python3 eas-build-automation.py <build-id>
```

### 2. Continuous Monitoring

```bash
# Run in background with logging
nohup python3 eas-build-automation.py > eas-automation.log 2>&1 &

# Check status
tail -f eas-automation.log
```

## How It Works

### 1. Error Detection Flow

```
EAS Build Fails
    ↓
Fetch Build Logs (via CLI/API)
    ↓
Parse Error Messages
    ↓
Match Against Known Patterns
    ↓
Apply Targeted Fixes
    ↓
Commit Changes
    ↓
Retry Build
```

### 2. Example Error Detection

When a build fails with:
```
* What went wrong:
Minimum supported Gradle version is 8.7. Current version is 7.5.
```

The system:
1. Detects the Gradle version mismatch
2. Extracts required version (8.7)
3. Updates `gradle-wrapper.properties`
4. Commits the fix
5. Can automatically retry the build

### 3. Supported Error Types

- **Gradle Errors**
  - Version mismatches
  - Plugin not found
  - Build script errors

- **Kotlin Errors**
  - Version conflicts
  - Compilation failures
  - Metadata version issues

- **Dependency Errors**
  - Resolution failures
  - Duplicate classes
  - Version conflicts

- **Configuration Errors**
  - Missing SDK location
  - JAVA_HOME not set
  - Missing local.properties

- **React Native Errors**
  - Metro bundler issues
  - Native module conflicts
  - Version mismatches

## Advanced Features

### 1. Learning System

The automation tracks fix success rates:

```python
# Check fix confidence
confidence = learning_system.get_fix_confidence('gradle_version_mismatch')
# Returns: 0.95 (95% success rate)
```

### 2. Custom Error Patterns

Add new patterns to `eas-build-automation.py`:

```python
self.error_patterns['custom_error'] = {
    'pattern': r'Your custom regex here',
    'type': 'custom_error_type',
    'extract': ['field1', 'field2']
}
```

### 3. Custom Fixes

Add fix functions:

```python
def _fix_custom_error(self, error: Dict) -> Dict:
    # Your fix logic here
    return {
        'type': 'custom_fix',
        'success': True
    }
```

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: EAS Build with Auto-Fix

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup EAS
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      
      - name: Run EAS Build with Auto-Fix
        run: |
          ./eas-auto-fix.sh monitor
```

### GitLab CI Example

```yaml
eas-build:
  stage: build
  script:
    - npm install -g eas-cli
    - ./eas-auto-fix.sh monitor
  retry:
    max: 3
    when:
      - script_failure
```

## Monitoring Dashboard

### View Build History

```bash
# Show recent fixes
python3 -c "
from eas_build_automation import BuildAutomation
automation = BuildAutomation()
for build in automation.history[-10:]:
    print(f\"Build {build['build_id']}: {len(build['fixes'])} fixes applied\")
"
```

### Generate Report

```bash
# Create build report
cat > generate-report.py << 'EOF'
import json
from datetime import datetime, timedelta

# Load error database
with open('eas-error-database.json', 'r') as f:
    db = json.load(f)

# Generate report
print("EAS Build Automation Report")
print("=" * 50)
print(f"Total builds analyzed: {db['statistics']['total_builds_analyzed']}")
print(f"Successful auto-fixes: {db['statistics']['successful_auto_fixes']}")
print(f"Success rate: {db['statistics']['successful_auto_fixes'] / db['statistics']['total_builds_analyzed'] * 100:.1f}%")
print("\nMost common errors:")
for error in db['statistics']['most_common_errors'][:5]:
    print(f"  - {error['error_id']}: {error['occurrences']} times (fix rate: {error['fix_success_rate']*100:.0f}%)")
EOF

python3 generate-report.py
```

## Best Practices

### 1. Pre-Build Checks

Before starting automated builds:

```bash
# Run pre-flight checks
./verify-build-config.sh

# Test fixes locally
npm run android # or iOS
```

### 2. Fix Validation

Always validate fixes before committing:

```bash
# Check syntax
npx prettier --check .
npx eslint .

# Validate Android files
cd android && ./gradlew tasks
```

### 3. Backup Strategy

The automation creates backups, but also:

```bash
# Create manual backup
git add . && git commit -m "backup: before automated fixes"

# Create branch for fixes
git checkout -b auto-fix-$(date +%Y%m%d-%H%M%S)
```

## Troubleshooting

### Common Issues

1. **Can't fetch build logs**
   - Ensure you're logged in: `eas login`
   - Check build ID is correct
   - Try manual fetch: `eas build:view <id>`

2. **Fixes not working**
   - Check file permissions
   - Verify file paths are correct
   - Look for syntax errors in modified files

3. **Learning system not improving**
   - Check database file is writable
   - Ensure fixes are being recorded
   - Manual intervention may be needed for complex errors

### Debug Mode

```bash
# Enable debug logging
export DEBUG=1
./eas-auto-fix.sh monitor

# Python script debug
python3 -u eas-build-automation.py 2>&1 | tee debug.log
```

## Future Enhancements

1. **Web UI Dashboard**
   - Real-time build monitoring
   - Fix history visualization
   - Manual fix approval interface

2. **AI-Powered Analysis**
   - GPT integration for unknown errors
   - Pattern learning from community fixes
   - Predictive failure detection

3. **Multi-Platform Support**
   - iOS build error handling
   - Web build optimization
   - Cross-platform fix correlation

4. **Collaborative Learning**
   - Share successful fixes
   - Community error database
   - Crowd-sourced solutions