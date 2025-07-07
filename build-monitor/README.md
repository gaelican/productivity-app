# Android Build Fix Automation System

This system automatically monitors GitHub Actions builds, analyzes failures, and applies fixes for common Android build issues in React Native projects.

## Features

- **Continuous Monitoring**: Polls GitHub Actions every 2 minutes for build status
- **Intelligent Log Analysis**: Parses build logs to identify specific error types
- **Automated Fixes**: Applies known fixes for common issues
- **Git Integration**: Commits and pushes fixes automatically
- **Learning System**: Tracks fix success rates and improves over time

## Quick Start

1. Set up GitHub token (optional but recommended):
   ```bash
   export GITHUB_TOKEN=your_github_personal_access_token
   ```

2. Run the automated system:
   ```bash
   ./build-monitor/start.sh
   ```

3. Apply known fixes manually:
   ```bash
   cd build-monitor
   python3 known_fixes.py
   ```

## Components

### 1. Monitor (`monitor.py`)
- Polls GitHub Actions API for workflow runs
- Downloads logs from failed builds
- Tracks build status changes

### 2. Log Analyzer (`log_analyzer.py`)
- Parses build logs for error patterns
- Identifies specific error types:
  - Missing namespace declarations
  - BuildConfig not enabled
  - Kotlin version mismatches
  - Missing dependencies
  - Repository configuration issues

### 3. Auto Fixer (`auto_fixer.py`)
- Applies automated fixes based on error type
- Modifies build.gradle files
- Handles namespace, BuildConfig, and version issues

### 4. Orchestrator (`orchestrator.py`)
- Coordinates the entire process
- Manages the fix-test-retry loop
- Commits and pushes fixes
- Reports success or manual intervention needed

### 5. Known Fixes (`known_fixes.py`)
- Pre-configured fixes for 100+ React Native libraries
- Handles React Native 0.73.6 + Expo SDK 50 specific issues
- Can be run independently for quick fixes

## Common Fixes Applied

1. **Namespace Issues**
   - Adds missing namespace declarations to Android modules
   - Covers 100+ popular React Native libraries

2. **BuildConfig Issues**
   - Enables `buildConfig = true` in buildFeatures

3. **Kotlin Version Alignment**
   - Ensures consistent Kotlin version across all modules

4. **Repository Configuration**
   - Adds JitPack, Google, and Maven Central repositories

5. **Gradle Plugin Updates**
   - Updates Android Gradle Plugin to compatible versions

## Manual Usage

### Monitor specific workflow
```bash
python3 monitor.py BuildWithChris productivity-app
```

### Analyze specific log file
```bash
python3 log_analyzer.py logs/run_12345.zip
```

### Apply fixes from analysis
```bash
python3 auto_fixer.py analysis/run_12345.json
```

## Configuration

The system uses these environment variables:
- `GITHUB_TOKEN`: Personal access token for GitHub API
- `GITHUB_OWNER`: Repository owner (auto-detected from git)
- `GITHUB_REPO`: Repository name (auto-detected from git)

## Troubleshooting

1. **API Rate Limits**: Set GITHUB_TOKEN to avoid rate limiting
2. **Permission Errors**: Ensure write access to node_modules
3. **Git Push Failures**: Check branch protection rules
4. **Fix Not Working**: Some errors require manual intervention

## Extending

To add new fix patterns:

1. Add error pattern to `log_analyzer.py`:
   ```python
   'new_error': {
       'pattern': r'your regex pattern',
       'type': 'error_type',
       'extract': ['field1', 'field2']
   }
   ```

2. Add fix handler to `auto_fixer.py`:
   ```python
   def fix_new_error(self, fix_info, error):
       # Your fix logic here
       return success, message
   ```

3. Register handler in `fix_handlers` dict

## Safety

- All changes are committed with clear messages
- Original files are modified in-place (ensure backups)
- Failed fixes are reported without breaking the build
- Maximum fix attempts prevent infinite loops