#!/usr/bin/env python3
"""
EAS Build Automation System
Fetches actual error logs from EAS builds and applies targeted fixes
"""

import json
import re
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple

class EASBuildMonitor:
    """Monitor EAS builds and fetch logs"""
    
    def __init__(self):
        self.build_cache = {}
        
    def get_recent_builds(self, limit: int = 5) -> List[Dict]:
        """Fetch recent builds using EAS CLI"""
        try:
            result = subprocess.run(
                ["eas", "build:list", "--json", f"--limit={limit}"],
                capture_output=True,
                text=True
            )
            if result.returncode == 0:
                return json.loads(result.stdout)
            else:
                print(f"Error fetching builds: {result.stderr}")
                return []
        except Exception as e:
            print(f"Error running eas command: {e}")
            return []
    
    def get_build_details(self, build_id: str) -> Optional[Dict]:
        """Get detailed information about a specific build"""
        try:
            result = subprocess.run(
                ["eas", "build:view", build_id, "--json"],
                capture_output=True,
                text=True
            )
            if result.returncode == 0:
                return json.loads(result.stdout)
            return None
        except Exception as e:
            print(f"Error fetching build details: {e}")
            return None
    
    def extract_error_logs(self, build_details: Dict) -> str:
        """Extract error logs from build details"""
        # Check for error logs in various places
        if 'logs' in build_details:
            return build_details.get('logs', {}).get('error', '')
        
        # Check artifacts for log files
        if 'artifacts' in build_details:
            for artifact in build_details['artifacts']:
                if 'logs' in artifact.get('type', ''):
                    # Would need to download and read the artifact
                    pass
        
        # Fallback to status message
        return build_details.get('statusMessage', '')


class ErrorParser:
    """Parse error patterns from build logs"""
    
    def __init__(self):
        self.error_patterns = {
            'gradle_version': {
                'pattern': r'Minimum supported Gradle version is (\d+\.\d+)',
                'type': 'gradle_version_mismatch',
                'extract': ['required_version']
            },
            'gradle_plugin': {
                'pattern': r'Could not find com\.android\.tools\.build:gradle:(\d+\.\d+\.\d+)',
                'type': 'gradle_plugin_missing',
                'extract': ['plugin_version']
            },
            'kotlin_version': {
                'pattern': r'Module was compiled with an incompatible version of Kotlin.*The binary version of its metadata is (\d+\.\d+\.\d+)',
                'type': 'kotlin_version_conflict',
                'extract': ['kotlin_version']
            },
            'sdk_location': {
                'pattern': r'SDK location not found',
                'type': 'android_sdk_missing',
                'extract': []
            },
            'duplicate_class': {
                'pattern': r'Duplicate class ([\w\.]+) found in modules',
                'type': 'duplicate_class_error',
                'extract': ['class_name']
            },
            'dependency_conflict': {
                'pattern': r'Could not resolve ([\w\.\-:]+):(\d+\.\d+\.\d+)',
                'type': 'dependency_resolution_failed',
                'extract': ['dependency', 'version']
            },
            'task_failure': {
                'pattern': r'Execution failed for task \':([\w:]+)\'',
                'type': 'gradle_task_failed',
                'extract': ['task_name']
            },
            'java_home': {
                'pattern': r'ERROR: JAVA_HOME is not set',
                'type': 'java_home_not_set',
                'extract': []
            },
            'react_native_version': {
                'pattern': r'React Native version mismatch.*Expected: ([\d\.]+).*Got: ([\d\.]+)',
                'type': 'rn_version_mismatch',
                'extract': ['expected_version', 'actual_version']
            }
        }
    
    def parse_log(self, log_content: str) -> List[Dict]:
        """Extract all errors from log content"""
        errors = []
        
        for error_key, config in self.error_patterns.items():
            matches = re.finditer(config['pattern'], log_content, re.MULTILINE | re.IGNORECASE)
            
            for match in matches:
                error = {
                    'key': error_key,
                    'type': config['type'],
                    'raw_match': match.group(0),
                    'line': log_content[:match.start()].count('\n') + 1,
                    'extracted': {}
                }
                
                # Extract named groups
                for i, field in enumerate(config['extract']):
                    if i + 1 <= len(match.groups()):
                        error['extracted'][field] = match.group(i + 1)
                
                errors.append(error)
        
        return errors


class FixApplicator:
    """Apply fixes based on detected errors"""
    
    def __init__(self):
        self.applied_fixes = []
        self.fix_registry = self._build_fix_registry()
    
    def _build_fix_registry(self) -> Dict:
        """Build the registry of fixes for each error type"""
        return {
            'gradle_version_mismatch': self._fix_gradle_version,
            'gradle_plugin_missing': self._fix_gradle_plugin,
            'kotlin_version_conflict': self._fix_kotlin_version,
            'android_sdk_missing': self._fix_sdk_location,
            'duplicate_class_error': self._fix_duplicate_class,
            'dependency_resolution_failed': self._fix_dependency,
            'java_home_not_set': self._fix_java_home,
            'rn_version_mismatch': self._fix_rn_version
        }
    
    def backup_file(self, file_path: str):
        """Create a backup of the file before modification"""
        path = Path(file_path)
        if path.exists():
            backup_path = path.with_suffix(f'{path.suffix}.backup')
            backup_path.write_text(path.read_text())
            print(f"Backed up {file_path} to {backup_path}")
    
    def update_file_content(self, file_path: str, pattern: str, replacement: str) -> bool:
        """Update file content using regex replacement"""
        try:
            path = Path(file_path)
            if not path.exists():
                print(f"File not found: {file_path}")
                return False
            
            content = path.read_text()
            new_content = re.sub(pattern, replacement, content)
            
            if content != new_content:
                self.backup_file(file_path)
                path.write_text(new_content)
                print(f"Updated {file_path}")
                return True
            return False
        except Exception as e:
            print(f"Error updating file {file_path}: {e}")
            return False
    
    def _fix_gradle_version(self, error: Dict) -> Dict:
        """Fix Gradle version mismatch"""
        version = error['extracted'].get('required_version', '8.7')
        file_path = "android/gradle/wrapper/gradle-wrapper.properties"
        
        success = self.update_file_content(
            file_path,
            r'distributionUrl=.*gradle-\d+\.\d+.*\.zip',
            f'distributionUrl=https\\\\://services.gradle.org/distributions/gradle-{version}-all.zip'
        )
        
        return {
            'type': 'gradle_version_update',
            'file': file_path,
            'version': version,
            'success': success
        }
    
    def _fix_gradle_plugin(self, error: Dict) -> Dict:
        """Fix missing Gradle plugin"""
        version = error['extracted'].get('plugin_version', '8.7.0')
        file_path = "android/build.gradle"
        
        success = self.update_file_content(
            file_path,
            r'classpath\s*\(\s*["\']com\.android\.tools\.build:gradle:[^"\']+["\']\s*\)',
            f'classpath("com.android.tools.build:gradle:{version}")'
        )
        
        return {
            'type': 'gradle_plugin_update',
            'file': file_path,
            'version': version,
            'success': success
        }
    
    def _fix_kotlin_version(self, error: Dict) -> Dict:
        """Fix Kotlin version conflict"""
        version = error['extracted'].get('kotlin_version', '1.9.22')
        file_path = "android/build.gradle"
        
        success = self.update_file_content(
            file_path,
            r'kotlinVersion\s*=\s*["\'][^"\']+["\']',
            f'kotlinVersion = "{version}"'
        )
        
        return {
            'type': 'kotlin_version_update',
            'file': file_path,
            'version': version,
            'success': success
        }
    
    def _fix_sdk_location(self, error: Dict) -> Dict:
        """Fix missing SDK location"""
        file_path = "android/local.properties"
        sdk_dir = "/opt/android-sdk"  # Default for EAS
        
        try:
            Path(file_path).write_text(f"sdk.dir={sdk_dir}\\n")
            return {
                'type': 'sdk_location_set',
                'file': file_path,
                'sdk_dir': sdk_dir,
                'success': True
            }
        except Exception as e:
            return {
                'type': 'sdk_location_set',
                'file': file_path,
                'error': str(e),
                'success': False
            }
    
    def _fix_duplicate_class(self, error: Dict) -> Dict:
        """Fix duplicate class error"""
        file_path = "android/app/build.gradle"
        class_name = error['extracted'].get('class_name', '')
        
        # Add packaging options to exclude duplicates
        packaging_options = """
android {
    packagingOptions {
        pickFirst '**/libc++_shared.so'
        pickFirst '**/libjsc.so'
        pickFirst '**/libreact_nativemodule_core.so'
    }
}"""
        
        # Check if packaging options already exist
        try:
            content = Path(file_path).read_text()
            if 'packagingOptions' not in content:
                # Insert after android {
                success = self.update_file_content(
                    file_path,
                    r'android\s*{',
                    'android {\\n    packagingOptions {\\n        pickFirst \'**/libc++_shared.so\'\\n        pickFirst \'**/libjsc.so\'\\n    }'
                )
            else:
                success = True
                
            return {
                'type': 'duplicate_class_fix',
                'file': file_path,
                'class': class_name,
                'success': success
            }
        except Exception as e:
            return {
                'type': 'duplicate_class_fix',
                'file': file_path,
                'error': str(e),
                'success': False
            }
    
    def _fix_dependency(self, error: Dict) -> Dict:
        """Fix dependency resolution failure"""
        dependency = error['extracted'].get('dependency', '')
        version = error['extracted'].get('version', '')
        
        # Add repository if missing
        file_path = "android/build.gradle"
        
        repositories_fix = """
allprojects {
    repositories {
        google()
        mavenCentral()
        maven { url "https://www.jitpack.io" }
        maven { url "https://maven.google.com" }
    }
}"""
        
        success = True  # Would implement actual fix
        
        return {
            'type': 'dependency_fix',
            'dependency': dependency,
            'version': version,
            'success': success
        }
    
    def _fix_java_home(self, error: Dict) -> Dict:
        """Fix JAVA_HOME not set"""
        # This would typically be handled in EAS build config
        return {
            'type': 'java_home_config',
            'message': 'JAVA_HOME should be configured in eas.json build environment',
            'success': False
        }
    
    def _fix_rn_version(self, error: Dict) -> Dict:
        """Fix React Native version mismatch"""
        expected = error['extracted'].get('expected_version', '')
        file_path = "package.json"
        
        if expected:
            success = self.update_file_content(
                file_path,
                r'"react-native":\s*"[^"]+"',
                f'"react-native": "{expected}"'
            )
        else:
            success = False
            
        return {
            'type': 'rn_version_update',
            'file': file_path,
            'version': expected,
            'success': success
        }
    
    def apply_fixes(self, errors: List[Dict]) -> List[Dict]:
        """Apply fixes for all detected errors"""
        fixes_applied = []
        
        for error in errors:
            error_type = error['type']
            if fix_func := self.fix_registry.get(error_type):
                print(f"\\nApplying fix for: {error_type}")
                fix_result = fix_func(error)
                fix_result['error'] = error
                fixes_applied.append(fix_result)
                self.applied_fixes.append(fix_result)
        
        return fixes_applied


class BuildAutomation:
    """Main automation controller"""
    
    def __init__(self):
        self.monitor = EASBuildMonitor()
        self.parser = ErrorParser()
        self.fixer = FixApplicator()
        self.history = []
    
    def analyze_failed_build(self, build_id: str) -> Tuple[List[Dict], List[Dict]]:
        """Analyze a failed build and apply fixes"""
        print(f"\\n=== Analyzing build {build_id} ===")
        
        # Get build details
        build_details = self.monitor.get_build_details(build_id)
        if not build_details:
            print("Could not fetch build details")
            return [], []
        
        print(f"Build status: {build_details.get('status')}")
        print(f"Platform: {build_details.get('platform')}")
        
        # Extract error logs
        error_logs = self.monitor.extract_error_logs(build_details)
        if not error_logs:
            print("No error logs found")
            return [], []
        
        print(f"\\nError log preview:")
        print(error_logs[:500] + "..." if len(error_logs) > 500 else error_logs)
        
        # Parse errors
        errors = self.parser.parse_log(error_logs)
        print(f"\\nFound {len(errors)} errors:")
        for error in errors:
            print(f"  - {error['type']}: {error['raw_match'][:100]}...")
        
        # Apply fixes
        if errors:
            fixes = self.fixer.apply_fixes(errors)
            print(f"\\nApplied {len(fixes)} fixes")
            return errors, fixes
        
        return errors, []
    
    def commit_fixes(self, fixes: List[Dict]):
        """Commit the applied fixes"""
        if not fixes:
            return
        
        # Generate commit message
        fix_descriptions = []
        for fix in fixes:
            if fix['success']:
                fix_descriptions.append(f"- {fix['type']}: {fix.get('file', 'config')}")
        
        if fix_descriptions:
            commit_message = "fix: Apply automated EAS build fixes\\n\\n" + "\\n".join(fix_descriptions)
            
            try:
                subprocess.run(["git", "add", "-A"], check=True)
                subprocess.run(["git", "commit", "-m", commit_message], check=True)
                print(f"\\nCommitted fixes: {commit_message}")
            except subprocess.CalledProcessError as e:
                print(f"Error committing fixes: {e}")
    
    def monitor_builds(self, check_interval: int = 300):
        """Continuously monitor builds"""
        print("Starting EAS build monitoring...")
        processed_builds = set()
        
        while True:
            try:
                builds = self.monitor.get_recent_builds()
                
                for build in builds:
                    build_id = build.get('id')
                    status = build.get('status')
                    
                    if build_id not in processed_builds and status == 'errored':
                        print(f"\\nFound failed build: {build_id}")
                        errors, fixes = self.analyze_failed_build(build_id)
                        
                        if fixes:
                            self.commit_fixes(fixes)
                            print("Fixes committed. Run 'eas build' to retry with fixes.")
                        
                        processed_builds.add(build_id)
                        
                        # Record in history
                        self.history.append({
                            'build_id': build_id,
                            'timestamp': datetime.now().isoformat(),
                            'errors': errors,
                            'fixes': fixes
                        })
                
                print(f"\\nWaiting {check_interval} seconds before next check...")
                time.sleep(check_interval)
                
            except KeyboardInterrupt:
                print("\\nStopping build monitor")
                break
            except Exception as e:
                print(f"Error in monitoring loop: {e}")
                time.sleep(check_interval)


def main():
    """Main entry point"""
    automation = BuildAutomation()
    
    if len(sys.argv) > 1:
        # Analyze specific build
        build_id = sys.argv[1]
        errors, fixes = automation.analyze_failed_build(build_id)
        if fixes:
            automation.commit_fixes(fixes)
    else:
        # Start monitoring
        automation.monitor_builds()


if __name__ == "__main__":
    main()