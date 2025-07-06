# EAS Automated Build System

A comprehensive automated build system for EAS (Expo Application Services) that handles the complete build-fix-retry cycle without manual intervention.

## 🚀 Features

- **Automatic Build Submission**: Starts EAS builds programmatically
- **Real-time Monitoring**: Live dashboard showing build progress and statistics
- **Error Pattern Recognition**: Identifies common build errors from logs
- **Intelligent Fix Application**: Applies appropriate fixes based on error patterns
- **Retry Logic**: Automatically retries builds after applying fixes
- **Build History Tracking**: Maintains history of all build attempts and fixes
- **Notification Integration**: Sends real-time notifications via claude-notify.sh
- **Comprehensive Reporting**: Generates detailed reports of the build process

## 📋 Prerequisites

- Python 3.7+
- EAS CLI installed and authenticated (`npm install -g eas-cli`)
- An Expo/React Native project configured for EAS Build
- (Optional) claude-notify.sh for notifications

## 🛠️ Installation

1. Navigate to your project directory:
```bash
cd /path/to/your/project
```

2. The automated build system should be in the `automated-build-system` directory

3. Make the main script executable:
```bash
chmod +x automated-build-system/run_automated_build.sh
```

## 🎯 Usage

### Basic Usage

Run the automated build system with default settings (max 5 retries):
```bash
./automated-build-system/run_automated_build.sh
```

### Custom Retry Limit

Specify a custom maximum number of retries:
```bash
./automated-build-system/run_automated_build.sh 10
```

### Manual Fix Application

Apply a specific fix manually:
```bash
python3 automated-build-system/fix_engine.py /path/to/project gradle_plugin_version
```

### Build Monitoring

Run the build monitor separately:
```bash
python3 automated-build-system/build_monitor.py /path/to/project
```

## 🔧 Components

### 1. build_automation.py
Main automation engine that:
- Submits EAS builds
- Monitors build status
- Downloads and analyzes logs
- Applies fixes
- Manages retry logic

### 2. fix_engine.py
Intelligent fix application system that:
- Implements sophisticated fixes for various error patterns
- Maintains fix history to avoid duplicate applications
- Supports fix sequences for complex issues

### 3. build_monitor.py
Real-time monitoring dashboard that displays:
- Current build status
- Applied fixes
- Build statistics
- Recent log activity

### 4. error_patterns.json
Database of known error patterns including:
- Error detection regex patterns
- Fix strategies
- Severity levels
- Fix sequences

## 📊 Error Patterns Supported

The system can automatically fix:

1. **Version Mismatches**
   - React Native Gradle plugin version
   - Gradle wrapper version
   - Kotlin version
   - SDK versions

2. **Configuration Issues**
   - Missing namespace
   - Package name inconsistencies
   - Repository configuration
   - Plugin management order

3. **Build Environment**
   - Missing autolinking.gradle
   - Expo modules configuration
   - Memory allocation
   - Multidex support

4. **Resource Conflicts**
   - Duplicate resources
   - Manifest merger conflicts
   - Build cache issues

## 📈 Build Process Flow

1. **Pre-flight Checks**
   - Verify EAS authentication
   - Check project configuration
   - Validate dependencies

2. **Build Submission**
   - Start EAS build
   - Capture build ID
   - Begin monitoring

3. **Monitor & Wait**
   - Poll build status
   - Update dashboard
   - Send notifications

4. **Error Analysis** (if build fails)
   - Download build logs
   - Match against error patterns
   - Identify applicable fixes

5. **Fix Application**
   - Apply fixes in priority order
   - Modify project files
   - Track applied fixes

6. **Retry or Complete**
   - Retry if fixes were applied
   - Complete if successful
   - Fail if max retries reached

## 📝 Output Files

- `build_automation.log` - Detailed execution logs
- `build_automation_history.json` - Complete build history
- `build_automation_report.md` - Human-readable summary report
- `build_logs_[build-id].txt` - Individual build logs

## 🔍 Troubleshooting

### Build monitor won't start
- Ensure Python 3 is installed
- Check terminal compatibility
- Run monitor manually in separate terminal

### Fixes not being applied
- Check file permissions
- Verify project structure matches expected layout
- Review build_automation.log for errors

### Authentication issues
- Run `eas login` manually
- Ensure EAS account has proper permissions
- Check network connectivity

## 🤝 Integration with CI/CD

The system can be integrated into CI/CD pipelines:

```bash
# Non-interactive mode
python3 automated-build-system/build_automation.py /project/path 5
```

Exit codes:
- 0: Build successful
- 1: Build failed after retries

## 🔐 Safety Features

- Creates backups before modifying files
- Tracks all applied fixes to prevent duplicates
- Limits retry attempts to prevent infinite loops
- Comprehensive logging for debugging
- Non-destructive fixes only

## 📚 Advanced Usage

### Custom Error Patterns

Add new patterns to `error_patterns.json`:
```json
{
  "id": "custom_error",
  "pattern": "Your error regex here",
  "description": "Description of the error",
  "severity": "high",
  "fix_strategy": "your_fix_method",
  "fix_details": {
    "custom_param": "value"
  }
}
```

### Fix Sequences

Define multi-step fix sequences:
```json
{
  "name": "complex_fix",
  "description": "Fixes multiple related issues",
  "fixes": ["fix1_id", "fix2_id", "fix3_id"]
}
```

## 🚦 Status Indicators

Dashboard uses color coding:
- 🟢 Green: Success/Completed
- 🔴 Red: Error/Failed
- 🟡 Yellow: Warning/In Progress
- 🔵 Blue: Information

## 📞 Support

For issues specific to:
- EAS Build: Check [Expo documentation](https://docs.expo.dev/build/introduction/)
- React Native: See [React Native docs](https://reactnative.dev/)
- This automation system: Review logs and error patterns

## 🎉 Tips for Success

1. **Run verification first**: Use `verify-build-config.sh` before automation
2. **Monitor actively**: Keep the dashboard open to track progress
3. **Review fixes**: Check what fixes were applied after completion
4. **Save reports**: Keep build reports for future reference
5. **Update patterns**: Add new error patterns as you encounter them

Remember: This system automates the tedious parts of debugging build errors, but complex issues may still require manual intervention!