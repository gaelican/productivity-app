# EAS Build Automation System Design

## Overview

This design document outlines an improved automated EAS build system that fetches actual error logs from EAS build URLs, parses error messages, and applies targeted fixes based on the specific errors found.

## System Architecture

### 1. Core Components

#### 1.1 Build Monitor
- **Purpose**: Monitor EAS build status and fetch build logs
- **Key Features**:
  - Poll EAS build status using `eas build:list` command
  - Extract build URLs and IDs
  - Detect failed builds automatically
  - Trigger log analysis pipeline

#### 1.2 Log Fetcher
- **Purpose**: Retrieve detailed build logs from EAS
- **Methods**:
  - Use EAS CLI: `eas build:view <build-id> --json`
  - Web scraping fallback for detailed logs
  - API integration for programmatic access
- **Output**: Structured log data with error sections identified

#### 1.3 Error Parser
- **Purpose**: Extract and categorize error messages from logs
- **Pattern Categories**:
  - Gradle errors (version mismatches, dependencies)
  - React Native errors (metro, bundling)
  - Android SDK errors (missing components)
  - Dependency conflicts
  - Configuration errors
- **Output**: Structured error objects with context

#### 1.4 Fix Registry
- **Purpose**: Map specific errors to targeted fixes
- **Structure**:
```python
fix_registry = {
    "gradle_version_mismatch": {
        "pattern": r"Minimum supported Gradle version is (\d+\.\d+)",
        "fix": update_gradle_version,
        "files": ["android/gradle/wrapper/gradle-wrapper.properties"]
    },
    "kotlin_version_conflict": {
        "pattern": r"Module was compiled with an incompatible version of Kotlin",
        "fix": update_kotlin_version,
        "files": ["android/build.gradle"]
    },
    # ... more error patterns and fixes
}
```

#### 1.5 Fix Applicator
- **Purpose**: Apply fixes to the codebase
- **Features**:
  - Backup files before modification
  - Apply atomic fixes
  - Validate changes
  - Commit fixes with descriptive messages

#### 1.6 Feedback Loop Manager
- **Purpose**: Learn from build outcomes
- **Features**:
  - Track which fixes resolved specific errors
  - Build success/failure database
  - Confidence scoring for fixes
  - Suggest manual intervention when confidence is low

### 2. Implementation Details

#### 2.1 EAS API Integration

```python
class EASBuildMonitor:
    def __init__(self, project_id):
        self.project_id = project_id
        self.api_base = "https://api.expo.dev"
        
    async def get_recent_builds(self, limit=10):
        """Fetch recent builds for the project"""
        cmd = f"eas build:list --json --limit={limit}"
        result = await run_command(cmd)
        return json.loads(result)
    
    async def get_build_logs(self, build_id):
        """Fetch detailed logs for a specific build"""
        # Method 1: CLI
        cmd = f"eas build:view {build_id} --json"
        build_data = json.loads(await run_command(cmd))
        
        # Method 2: Direct log URL if available
        if log_url := build_data.get('logs', {}).get('url'):
            return await fetch_url(log_url)
        
        # Method 3: Web scraping as fallback
        build_url = f"https://expo.dev/accounts/{self.project_id}/builds/{build_id}"
        return await scrape_build_page(build_url)
```

#### 2.2 Error Pattern Matching

```python
class ErrorParser:
    def __init__(self):
        self.error_patterns = {
            'gradle': [
                {
                    'regex': r'Could not find com\.android\.tools\.build:gradle:(\d+\.\d+\.\d+)',
                    'type': 'missing_gradle_plugin',
                    'extract': ['version']
                },
                {
                    'regex': r'Execution failed for task \':([\w:]+)\'',
                    'type': 'task_failure',
                    'extract': ['task_name']
                }
            ],
            'kotlin': [
                {
                    'regex': r'e: .+\.kt: \((\d+), (\d+)\): (.+)',
                    'type': 'kotlin_compilation_error',
                    'extract': ['line', 'column', 'message']
                }
            ],
            'dependency': [
                {
                    'regex': r'Could not resolve ([\w\.\-:]+)',
                    'type': 'dependency_resolution',
                    'extract': ['dependency']
                }
            ]
        }
    
    def parse_log(self, log_content):
        """Extract all errors from log content"""
        errors = []
        for category, patterns in self.error_patterns.items():
            for pattern in patterns:
                matches = re.finditer(pattern['regex'], log_content, re.MULTILINE)
                for match in matches:
                    error = {
                        'category': category,
                        'type': pattern['type'],
                        'raw_match': match.group(0),
                        'extracted': {}
                    }
                    for i, field in enumerate(pattern['extract']):
                        error['extracted'][field] = match.group(i + 1)
                    errors.append(error)
        return errors
```

#### 2.3 Automated Fix Application

```python
class FixApplicator:
    def __init__(self, fix_registry):
        self.fix_registry = fix_registry
        self.applied_fixes = []
        
    async def apply_fixes_for_errors(self, errors):
        """Apply fixes for detected errors"""
        for error in errors:
            fix_key = f"{error['category']}_{error['type']}"
            if fix_config := self.fix_registry.get(fix_key):
                try:
                    # Backup files
                    for file_path in fix_config['files']:
                        self.backup_file(file_path)
                    
                    # Apply fix
                    fix_result = await fix_config['fix'](error['extracted'])
                    
                    # Log the fix
                    self.applied_fixes.append({
                        'error': error,
                        'fix': fix_key,
                        'result': fix_result,
                        'timestamp': datetime.now()
                    })
                    
                except Exception as e:
                    logger.error(f"Failed to apply fix {fix_key}: {e}")
```

#### 2.4 Learning System

```python
class BuildLearningSystem:
    def __init__(self, db_path="build_history.db"):
        self.db = BuildHistoryDB(db_path)
        
    def record_build_outcome(self, build_id, errors, fixes_applied, success):
        """Record build outcome for learning"""
        self.db.insert_build_record({
            'build_id': build_id,
            'errors': errors,
            'fixes_applied': fixes_applied,
            'success': success,
            'timestamp': datetime.now()
        })
        
    def get_fix_confidence(self, error_type):
        """Calculate confidence score for a fix based on history"""
        records = self.db.get_records_by_error_type(error_type)
        if not records:
            return 0.5  # Default confidence
        
        success_count = sum(1 for r in records if r['success'])
        return success_count / len(records)
    
    def suggest_fixes(self, errors, min_confidence=0.7):
        """Suggest fixes based on historical success rates"""
        suggestions = []
        for error in errors:
            confidence = self.get_fix_confidence(error['type'])
            if confidence >= min_confidence:
                suggestions.append({
                    'error': error,
                    'confidence': confidence,
                    'auto_apply': confidence >= 0.9
                })
        return suggestions
```

### 3. Workflow

1. **Continuous Monitoring**
   ```bash
   while true; do
     # Check for new builds
     builds=$(eas build:list --json --limit=5)
     
     # Process failed builds
     for build in $(echo $builds | jq -r '.[] | select(.status == "errored") | .id'); do
       ./process-failed-build.sh $build
     done
     
     sleep 300  # Check every 5 minutes
   done
   ```

2. **Error Analysis Pipeline**
   ```python
   async def process_failed_build(build_id):
       # Fetch logs
       logs = await build_monitor.get_build_logs(build_id)
       
       # Parse errors
       errors = error_parser.parse_log(logs)
       
       # Get fix suggestions
       suggestions = learning_system.suggest_fixes(errors)
       
       # Apply high-confidence fixes automatically
       auto_fixes = [s for s in suggestions if s['auto_apply']]
       await fix_applicator.apply_fixes_for_errors(auto_fixes)
       
       # Commit changes
       if auto_fixes:
           commit_message = generate_fix_commit_message(auto_fixes)
           await git_commit(commit_message)
           
       # Trigger new build
       new_build_id = await trigger_eas_build()
       
       # Record outcome
       await monitor_and_record_outcome(new_build_id, errors, auto_fixes)
   ```

### 4. Error-to-Fix Mapping Examples

```python
FIX_REGISTRY = {
    "gradle_plugin_not_found": {
        "pattern": r"Could not find com\.android\.tools\.build:gradle:(\d+\.\d+\.\d+)",
        "fix": lambda m: update_file(
            "android/build.gradle",
            r'classpath\("com\.android\.tools\.build:gradle:[^"]+"\)',
            f'classpath("com.android.tools.build:gradle:{m["version"]}")'
        )
    },
    
    "kotlin_version_mismatch": {
        "pattern": r"Module was compiled with an incompatible version of Kotlin.*expecting (\d+\.\d+\.\d+)",
        "fix": lambda m: update_file(
            "android/build.gradle",
            r'kotlinVersion = "[^"]+"',
            f'kotlinVersion = "{m["version"]}"'
        )
    },
    
    "sdk_location_not_found": {
        "pattern": r"SDK location not found",
        "fix": lambda m: create_file(
            "android/local.properties",
            f"sdk.dir={os.environ.get('ANDROID_SDK_ROOT', '/opt/android-sdk')}"
        )
    },
    
    "duplicate_class": {
        "pattern": r"Duplicate class ([\w\.]+) found",
        "fix": lambda m: add_to_file(
            "android/app/build.gradle",
            "android {\n    packagingOptions {\n        pickFirst '**/lib*.so'\n    }\n}"
        )
    }
}
```

### 5. Monitoring and Reporting

```python
class BuildAutomationDashboard:
    def generate_report(self, time_period="24h"):
        """Generate automation effectiveness report"""
        stats = {
            'total_builds': 0,
            'failed_builds': 0,
            'auto_fixed': 0,
            'manual_intervention': 0,
            'error_categories': {},
            'fix_success_rates': {}
        }
        
        # Collect statistics
        builds = self.db.get_builds_in_period(time_period)
        for build in builds:
            stats['total_builds'] += 1
            if not build['success']:
                stats['failed_builds'] += 1
                if build['fixes_applied']:
                    stats['auto_fixed'] += 1
                else:
                    stats['manual_intervention'] += 1
        
        return stats
```

## Benefits

1. **Targeted Fixes**: No more guessing - fixes are based on actual error messages
2. **Learning System**: Improves over time by tracking fix effectiveness
3. **Automation**: Reduces manual intervention for common errors
4. **Transparency**: Clear logging of what was changed and why
5. **Rollback Safety**: File backups before modifications
6. **Confidence Scoring**: Only applies fixes with high success rates

## Implementation Steps

1. Set up EAS API access and authentication
2. Implement log fetching and parsing
3. Build initial error pattern library
4. Create fix registry with common solutions
5. Implement learning database
6. Add monitoring and reporting
7. Deploy as continuous service

## Future Enhancements

1. **Machine Learning**: Use ML to identify new error patterns
2. **Community Sharing**: Share successful fixes with other developers
3. **Preview Fixes**: Show proposed changes before applying
4. **Parallel Builds**: Test multiple fix combinations simultaneously
5. **Integration with CI/CD**: Automatic PR creation for fixes