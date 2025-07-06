#!/usr/bin/env python3
"""
EAS Automated Build System
Handles build-fix-retry cycle automatically with error pattern recognition
"""

import json
import subprocess
import time
import re
import os
import sys
from datetime import datetime
from typing import Dict, List, Optional, Tuple
import logging
from pathlib import Path

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('build_automation.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class BuildError:
    """Represents a build error with pattern and fix"""
    def __init__(self, pattern: str, fix_action: str, description: str):
        self.pattern = re.compile(pattern)
        self.fix_action = fix_action
        self.description = description

class EASBuildAutomation:
    """Automated EAS build system with error detection and fixing"""
    
    def __init__(self, project_path: str, max_retries: int = 5):
        self.project_path = Path(project_path)
        self.max_retries = max_retries
        self.build_attempts = 0
        self.applied_fixes = []
        self.notification_script = self.project_path / "claude-notify.sh"
        
        # Define known error patterns and their fixes
        self.error_patterns = [
            BuildError(
                r"Could not find com\.facebook\.react:react-native-gradle-plugin:(\d+\.\d+\.\d+)",
                "fix_gradle_plugin_version",
                "React Native Gradle plugin version mismatch"
            ),
            BuildError(
                r"Could not read script.*node_modules.*autolinking\.gradle.*does not exist",
                "fix_autolinking_gradle",
                "Missing autolinking.gradle in EAS environment"
            ),
            BuildError(
                r"The pluginManagement \{\} block must appear before any other statements",
                "fix_gradle_plugin_management",
                "Gradle pluginManagement block position error"
            ),
            BuildError(
                r"Could not resolve all dependencies for configuration.*classpath",
                "fix_repository_configuration",
                "Missing or incorrect repository configuration"
            ),
            BuildError(
                r"Namespace not specified.*Please specify a namespace",
                "fix_namespace_configuration",
                "Missing namespace in build.gradle"
            ),
            BuildError(
                r"Package name mismatch",
                "fix_package_name_consistency",
                "Package name inconsistency across files"
            ),
            BuildError(
                r"gradle-(\d+\.\d+)-all\.zip.*not found",
                "fix_gradle_wrapper_version",
                "Gradle wrapper version issue"
            ),
            BuildError(
                r"expo-modules-autolinking.*not found",
                "fix_expo_modules_autolinking",
                "Expo modules autolinking issue"
            ),
            BuildError(
                r"Could not find.*expo.*gradle",
                "fix_expo_gradle_plugin",
                "Missing Expo Gradle plugin"
            ),
            BuildError(
                r"Execution failed for task.*mergeReleaseResources",
                "fix_resource_conflicts",
                "Resource merging conflicts"
            )
        ]
        
        # Track build history
        self.build_history = []
        
    def notify(self, title: str, message: str, phase: str = "🔧"):
        """Send notification using claude-notify.sh"""
        if self.notification_script.exists():
            try:
                subprocess.run([
                    str(self.notification_script),
                    "-q",
                    f"echo '{phase} {title}: {message}'"
                ], capture_output=True)
            except:
                pass  # Don't fail if notification fails
    
    def run_command(self, command: List[str], cwd: Optional[Path] = None) -> Tuple[int, str, str]:
        """Run a command and return exit code, stdout, stderr"""
        if cwd is None:
            cwd = self.project_path
            
        logger.info(f"Running command: {' '.join(command)}")
        
        process = subprocess.Popen(
            command,
            cwd=cwd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        stdout, stderr = process.communicate()
        return process.returncode, stdout, stderr
    
    def start_eas_build(self) -> Optional[str]:
        """Start an EAS build and return the build ID"""
        self.notify("Build System", "Starting new EAS build", "🚀")
        logger.info("Starting EAS build...")
        
        exit_code, stdout, stderr = self.run_command([
            "eas", "build", "-p", "android", 
            "--profile", "preview",
            "--non-interactive",
            "--json"
        ])
        
        if exit_code == 0:
            try:
                # Parse JSON output to get build ID
                build_data = json.loads(stdout)
                if isinstance(build_data, list) and len(build_data) > 0:
                    build_id = build_data[0].get('id')
                    logger.info(f"Build started successfully: {build_id}")
                    self.notify("Build Started", f"ID: {build_id}", "✅")
                    return build_id
            except json.JSONDecodeError:
                logger.error("Failed to parse build output")
        
        logger.error(f"Failed to start build: {stderr}")
        self.notify("Build Failed", "Failed to start", "❌")
        return None
    
    def get_build_status(self, build_id: str) -> Dict:
        """Get the current status of a build"""
        exit_code, stdout, stderr = self.run_command([
            "eas", "build:view", build_id, "--json"
        ])
        
        if exit_code == 0:
            try:
                return json.loads(stdout)
            except json.JSONDecodeError:
                logger.error("Failed to parse build status")
        
        return {"status": "error", "message": stderr}
    
    def wait_for_build(self, build_id: str, timeout: int = 1800) -> Dict:
        """Wait for a build to complete and return final status"""
        start_time = time.time()
        last_status = None
        
        while time.time() - start_time < timeout:
            status_data = self.get_build_status(build_id)
            current_status = status_data.get('status', 'unknown')
            
            if current_status != last_status:
                logger.info(f"Build status: {current_status}")
                self.notify("Build Progress", f"Status: {current_status}", "🔄")
                last_status = current_status
            
            if current_status in ['finished', 'errored', 'canceled']:
                return status_data
            
            time.sleep(30)  # Check every 30 seconds
        
        logger.error("Build timeout reached")
        return {"status": "timeout"}
    
    def download_build_logs(self, build_id: str) -> Optional[str]:
        """Download and return build logs"""
        logger.info(f"Downloading logs for build {build_id}")
        
        # Get build details to find log URL
        build_data = self.get_build_status(build_id)
        
        if 'logs' in build_data:
            log_url = build_data['logs']
            # Download logs using curl
            exit_code, stdout, stderr = self.run_command([
                "curl", "-s", log_url
            ])
            
            if exit_code == 0:
                # Save logs to file
                log_file = self.project_path / f"build_logs_{build_id}.txt"
                with open(log_file, 'w') as f:
                    f.write(stdout)
                logger.info(f"Logs saved to {log_file}")
                return stdout
        
        return None
    
    def analyze_build_error(self, logs: str) -> List[BuildError]:
        """Analyze build logs and identify errors"""
        identified_errors = []
        
        for error_pattern in self.error_patterns:
            if error_pattern.pattern.search(logs):
                logger.info(f"Identified error: {error_pattern.description}")
                identified_errors.append(error_pattern)
        
        return identified_errors
    
    def apply_fix(self, error: BuildError) -> bool:
        """Apply a fix for a specific error"""
        fix_method = getattr(self, error.fix_action, None)
        
        if fix_method:
            logger.info(f"Applying fix: {error.description}")
            self.notify("Applying Fix", error.description, "🔧")
            
            try:
                success = fix_method()
                if success:
                    self.applied_fixes.append(error.description)
                    logger.info(f"Fix applied successfully: {error.description}")
                return success
            except Exception as e:
                logger.error(f"Error applying fix: {e}")
                return False
        else:
            logger.warning(f"No fix method found for: {error.fix_action}")
            return False
    
    # Fix methods for various errors
    def fix_gradle_plugin_version(self) -> bool:
        """Fix React Native Gradle plugin version mismatch"""
        build_gradle = self.project_path / "android" / "build.gradle"
        package_json = self.project_path / "package.json"
        
        # Read package.json to get RN version
        with open(package_json, 'r') as f:
            package_data = json.load(f)
        
        rn_version = package_data.get('dependencies', {}).get('react-native', '')
        version_match = re.search(r'(\d+\.\d+\.\d+)', rn_version)
        
        if version_match:
            correct_version = version_match.group(1)
            
            # Update build.gradle
            if build_gradle.exists():
                content = build_gradle.read_text()
                content = re.sub(
                    r'react-native-gradle-plugin:\d+\.\d+\.\d+',
                    f'react-native-gradle-plugin:{correct_version}',
                    content
                )
                build_gradle.write_text(content)
                return True
        
        return False
    
    def fix_autolinking_gradle(self) -> bool:
        """Fix missing autolinking.gradle in EAS environment"""
        settings_gradle = self.project_path / "android" / "settings.gradle"
        
        # Create a minimal settings.gradle that doesn't depend on node_modules
        minimal_settings = """rootProject.name = 'ProductivityApp'
include ':app'
"""
        
        settings_gradle.write_text(minimal_settings)
        return True
    
    def fix_gradle_plugin_management(self) -> bool:
        """Fix Gradle pluginManagement block position"""
        settings_gradle = self.project_path / "android" / "settings.gradle"
        
        if settings_gradle.exists():
            content = settings_gradle.read_text()
            
            # Extract pluginManagement block if it exists
            plugin_mgmt_match = re.search(
                r'(pluginManagement\s*\{[^}]*\})',
                content,
                re.DOTALL
            )
            
            if plugin_mgmt_match:
                plugin_mgmt = plugin_mgmt_match.group(1)
                # Remove it from current position
                content = content.replace(plugin_mgmt, '')
                # Add it at the beginning
                content = plugin_mgmt + '\n\n' + content.strip()
                settings_gradle.write_text(content)
                return True
        
        return False
    
    def fix_repository_configuration(self) -> bool:
        """Fix missing or incorrect repository configuration"""
        build_gradle = self.project_path / "android" / "build.gradle"
        
        if build_gradle.exists():
            content = build_gradle.read_text()
            
            # Ensure all necessary repositories are present
            repositories_to_add = [
                'maven { url "https://www.jitpack.io" }',
                'maven { url "https://maven.google.com" }'
            ]
            
            for repo in repositories_to_add:
                if repo not in content:
                    # Add repository after mavenCentral()
                    content = re.sub(
                        r'(mavenCentral\(\))',
                        f'\\1\n        {repo}',
                        content
                    )
            
            build_gradle.write_text(content)
            return True
        
        return False
    
    def fix_namespace_configuration(self) -> bool:
        """Fix missing namespace in build.gradle"""
        app_gradle = self.project_path / "android" / "app" / "build.gradle"
        
        if app_gradle.exists():
            content = app_gradle.read_text()
            
            # Check if namespace is missing
            if 'namespace' not in content:
                # Add namespace after android {
                content = re.sub(
                    r'(android\s*\{)',
                    '\\1\n    namespace "com.productivityapp"',
                    content
                )
                app_gradle.write_text(content)
                return True
        
        return False
    
    def fix_package_name_consistency(self) -> bool:
        """Fix package name inconsistency across files"""
        app_json = self.project_path / "app.json"
        
        if app_json.exists():
            with open(app_json, 'r') as f:
                app_data = json.load(f)
            
            # Ensure consistent package name
            if 'expo' in app_data and 'android' in app_data['expo']:
                app_data['expo']['android']['package'] = 'com.productivityapp'
            
            with open(app_json, 'w') as f:
                json.dump(app_data, f, indent=2)
            
            return True
        
        return False
    
    def fix_gradle_wrapper_version(self) -> bool:
        """Fix Gradle wrapper version"""
        gradle_properties = self.project_path / "android" / "gradle" / "wrapper" / "gradle-wrapper.properties"
        
        if gradle_properties.exists():
            content = gradle_properties.read_text()
            # Use Gradle 8.6 for React Native 0.74.x
            content = re.sub(
                r'gradle-\d+\.\d+-all\.zip',
                'gradle-8.6-all.zip',
                content
            )
            gradle_properties.write_text(content)
            return True
        
        return False
    
    def fix_expo_modules_autolinking(self) -> bool:
        """Fix Expo modules autolinking issues"""
        # Create expo-module.config.json if missing
        expo_config = self.project_path / "expo-module.config.json"
        
        if not expo_config.exists():
            config_data = {
                "ios": {
                    "infoPlist": {}
                },
                "android": {}
            }
            
            with open(expo_config, 'w') as f:
                json.dump(config_data, f, indent=2)
            
            return True
        
        return False
    
    def fix_expo_gradle_plugin(self) -> bool:
        """Fix missing Expo Gradle plugin"""
        settings_gradle = self.project_path / "android" / "settings.gradle"
        
        # Use simplified settings.gradle for EAS
        minimal_settings = """rootProject.name = 'ProductivityApp'
include ':app'
"""
        
        settings_gradle.write_text(minimal_settings)
        return True
    
    def fix_resource_conflicts(self) -> bool:
        """Fix resource merging conflicts"""
        # Clean build directory
        build_dir = self.project_path / "android" / "app" / "build"
        
        if build_dir.exists():
            import shutil
            shutil.rmtree(build_dir)
            logger.info("Cleaned build directory")
        
        return True
    
    def run_automated_build(self) -> bool:
        """Run the complete automated build process"""
        logger.info("Starting automated build process")
        self.notify("Automated Build", "Starting build automation", "🤖")
        
        while self.build_attempts < self.max_retries:
            self.build_attempts += 1
            logger.info(f"Build attempt {self.build_attempts}/{self.max_retries}")
            
            # Start build
            build_id = self.start_eas_build()
            
            if not build_id:
                logger.error("Failed to start build")
                time.sleep(60)  # Wait before retry
                continue
            
            # Record build attempt
            build_record = {
                "attempt": self.build_attempts,
                "build_id": build_id,
                "timestamp": datetime.now().isoformat(),
                "applied_fixes": self.applied_fixes.copy()
            }
            
            # Wait for build to complete
            build_result = self.wait_for_build(build_id)
            build_status = build_result.get('status')
            
            build_record["status"] = build_status
            
            if build_status == 'finished':
                logger.info("Build completed successfully!")
                self.notify("Build Success", f"Completed after {self.build_attempts} attempts", "✅")
                build_record["success"] = True
                self.build_history.append(build_record)
                
                # Save build history
                self.save_build_history()
                
                return True
            
            elif build_status == 'errored':
                logger.warning("Build failed, analyzing errors...")
                self.notify("Build Failed", "Analyzing errors...", "🔍")
                
                # Download and analyze logs
                logs = self.download_build_logs(build_id)
                
                if logs:
                    errors = self.analyze_build_error(logs)
                    build_record["identified_errors"] = [e.description for e in errors]
                    
                    if errors:
                        # Apply fixes
                        fixes_applied = False
                        for error in errors:
                            if error.description not in self.applied_fixes:
                                if self.apply_fix(error):
                                    fixes_applied = True
                        
                        if not fixes_applied:
                            logger.error("No new fixes to apply")
                            build_record["success"] = False
                            self.build_history.append(build_record)
                            break
                    else:
                        logger.error("No recognized error patterns found")
                        build_record["success"] = False
                        self.build_history.append(build_record)
                        break
                else:
                    logger.error("Could not download build logs")
                    build_record["success"] = False
                    self.build_history.append(build_record)
            
            # Add delay before next attempt
            time.sleep(30)
        
        logger.error("Max retries reached without successful build")
        self.notify("Build Failed", f"Max retries ({self.max_retries}) reached", "❌")
        
        # Save build history
        self.save_build_history()
        
        return False
    
    def save_build_history(self):
        """Save build history to file"""
        history_file = self.project_path / "build_automation_history.json"
        
        with open(history_file, 'w') as f:
            json.dump({
                "total_attempts": self.build_attempts,
                "applied_fixes": self.applied_fixes,
                "builds": self.build_history
            }, f, indent=2)
        
        logger.info(f"Build history saved to {history_file}")
    
    def generate_report(self) -> str:
        """Generate a report of the build automation process"""
        report = f"""
# EAS Build Automation Report

## Summary
- Total Build Attempts: {self.build_attempts}
- Applied Fixes: {len(self.applied_fixes)}
- Final Status: {'Success' if self.build_history and self.build_history[-1].get('success') else 'Failed'}

## Applied Fixes
"""
        
        for fix in self.applied_fixes:
            report += f"- {fix}\n"
        
        report += "\n## Build History\n"
        
        for build in self.build_history:
            report += f"""
### Attempt {build['attempt']}
- Build ID: {build['build_id']}
- Status: {build['status']}
- Timestamp: {build['timestamp']}
- Fixes Applied Before This Build: {', '.join(build['applied_fixes']) if build['applied_fixes'] else 'None'}
"""
            
            if 'identified_errors' in build:
                report += f"- Identified Errors: {', '.join(build['identified_errors'])}\n"
        
        return report


def main():
    """Main entry point"""
    if len(sys.argv) < 2:
        print("Usage: python build_automation.py <project_path> [max_retries]")
        sys.exit(1)
    
    project_path = sys.argv[1]
    max_retries = int(sys.argv[2]) if len(sys.argv) > 2 else 5
    
    automation = EASBuildAutomation(project_path, max_retries)
    
    success = automation.run_automated_build()
    
    # Generate and save report
    report = automation.generate_report()
    report_file = Path(project_path) / "build_automation_report.md"
    
    with open(report_file, 'w') as f:
        f.write(report)
    
    print(f"\nReport saved to: {report_file}")
    
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()