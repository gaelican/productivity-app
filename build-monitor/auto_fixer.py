#!/usr/bin/env python3
"""
Automated Build Fix Application
Applies fixes for common Android build issues
"""

import os
import re
import json
import subprocess
from typing import Dict, List, Optional, Tuple
from datetime import datetime

class AutoFixer:
    def __init__(self, project_root: str = "."):
        self.project_root = os.path.abspath(project_root)
        self.fixes_applied = []
        self.fix_handlers = {
            'add_namespace': self.fix_namespace,
            'enable_buildconfig': self.fix_buildconfig,
            'update_kotlin_version': self.fix_kotlin_version,
            'add_dependency': self.fix_dependency,
            'add_repository': self.fix_repository,
            'update_gradle_plugin': self.fix_gradle_plugin
        }
        
    def apply_fixes(self, errors: List[Dict]) -> Dict:
        """Apply fixes for identified errors"""
        results = {
            'total_errors': len(errors),
            'fixes_attempted': 0,
            'fixes_successful': 0,
            'fixes_failed': 0,
            'details': []
        }
        
        for error in errors:
            if error.get('fix'):
                fix_info = error['fix']
                action = fix_info.get('action')
                
                if action in self.fix_handlers:
                    print(f"\nApplying fix: {action} for {error['summary']}")
                    success, message = self.fix_handlers[action](fix_info, error)
                    
                    results['fixes_attempted'] += 1
                    if success:
                        results['fixes_successful'] += 1
                        self.fixes_applied.append({
                            'error': error['summary'],
                            'fix': action,
                            'timestamp': datetime.now().isoformat()
                        })
                    else:
                        results['fixes_failed'] += 1
                        
                    results['details'].append({
                        'error': error['summary'],
                        'fix': action,
                        'success': success,
                        'message': message
                    })
                    
        return results
    
    def fix_namespace(self, fix_info: Dict, error: Dict) -> Tuple[bool, str]:
        """Add namespace declaration to build.gradle"""
        module = error.get('module', '')
        if not module:
            return False, "Could not determine module"
            
        # Find the module's build.gradle
        build_file = self.find_build_gradle(module)
        if not build_file:
            return False, f"Could not find build.gradle for module {module}"
            
        try:
            with open(build_file, 'r') as f:
                content = f.read()
                
            # Check if namespace already exists
            if 'namespace' in content:
                return True, "Namespace already defined"
                
            # Find android block
            android_match = re.search(r'android\s*{', content)
            if not android_match:
                return False, "Could not find android block"
                
            # Insert namespace after android {
            insert_pos = android_match.end()
            namespace = f"\n    namespace 'com.productivityapp.{module.replace(':', '.').replace('-', '_')}'"
            
            new_content = content[:insert_pos] + namespace + content[insert_pos:]
            
            with open(build_file, 'w') as f:
                f.write(new_content)
                
            return True, f"Added namespace to {build_file}"
            
        except Exception as e:
            return False, f"Error modifying file: {str(e)}"
    
    def fix_buildconfig(self, fix_info: Dict, error: Dict) -> Tuple[bool, str]:
        """Enable BuildConfig generation"""
        module = error.get('module', '')
        if not module:
            return False, "Could not determine module"
            
        build_file = self.find_build_gradle(module)
        if not build_file:
            return False, f"Could not find build.gradle for module {module}"
            
        try:
            with open(build_file, 'r') as f:
                content = f.read()
                
            # Check if buildFeatures exists
            if 'buildFeatures' in content:
                # Check if buildConfig is already enabled
                if re.search(r'buildConfig\s*=\s*true', content):
                    return True, "BuildConfig already enabled"
                    
                # Add buildConfig = true to existing buildFeatures
                features_match = re.search(r'buildFeatures\s*{([^}]*)}', content, re.DOTALL)
                if features_match:
                    features_content = features_match.group(1)
                    new_features = features_content.rstrip() + '\n        buildConfig = true\n    '
                    new_content = content.replace(features_match.group(0), f'buildFeatures {{{new_features}}}')
                else:
                    return False, "Could not parse buildFeatures block"
            else:
                # Add buildFeatures block
                android_match = re.search(r'android\s*{', content)
                if not android_match:
                    return False, "Could not find android block"
                    
                # Find a good place to insert (after defaultConfig if exists)
                default_config_match = re.search(r'defaultConfig\s*{[^}]*}', content, re.DOTALL)
                if default_config_match:
                    insert_pos = default_config_match.end()
                else:
                    insert_pos = android_match.end()
                    
                buildfeatures = '\n\n    buildFeatures {\n        buildConfig = true\n    }'
                new_content = content[:insert_pos] + buildfeatures + content[insert_pos:]
                
            with open(build_file, 'w') as f:
                f.write(new_content)
                
            return True, f"Enabled BuildConfig in {build_file}"
            
        except Exception as e:
            return False, f"Error modifying file: {str(e)}"
    
    def fix_kotlin_version(self, fix_info: Dict, error: Dict) -> Tuple[bool, str]:
        """Update Kotlin version in project"""
        target_version = fix_info.get('version', '1.9.0')
        
        # Check root build.gradle
        root_gradle = os.path.join(self.project_root, 'build.gradle')
        if not os.path.exists(root_gradle):
            return False, "Could not find root build.gradle"
            
        try:
            with open(root_gradle, 'r') as f:
                content = f.read()
                
            # Update kotlin version
            kotlin_pattern = r'(kotlin["\']?\s*:\s*["\'])([0-9.]+)(["\'])'
            if re.search(kotlin_pattern, content):
                new_content = re.sub(kotlin_pattern, f'\\g<1>{target_version}\\g<3>', content)
                
                with open(root_gradle, 'w') as f:
                    f.write(new_content)
                    
                return True, f"Updated Kotlin version to {target_version}"
            else:
                # Try to find kotlinVersion variable
                version_pattern = r'(kotlinVersion\s*=\s*["\'])([0-9.]+)(["\'])'
                if re.search(version_pattern, content):
                    new_content = re.sub(version_pattern, f'\\g<1>{target_version}\\g<3>', content)
                    
                    with open(root_gradle, 'w') as f:
                        f.write(new_content)
                        
                    return True, f"Updated kotlinVersion to {target_version}"
                    
            return False, "Could not find Kotlin version declaration"
            
        except Exception as e:
            return False, f"Error updating Kotlin version: {str(e)}"
    
    def fix_repository(self, fix_info: Dict, error: Dict) -> Tuple[bool, str]:
        """Add missing repository"""
        repository = fix_info.get('repository', error.get('repository', ''))
        
        # Common repository URLs
        repo_urls = {
            'jitpack': "maven { url 'https://jitpack.io' }",
            'google': "google()",
            'mavenCentral': "mavenCentral()",
            'maven': "maven { url 'https://repo1.maven.org/maven2' }"
        }
        
        # Check root build.gradle
        root_gradle = os.path.join(self.project_root, 'build.gradle')
        if not os.path.exists(root_gradle):
            return False, "Could not find root build.gradle"
            
        try:
            with open(root_gradle, 'r') as f:
                content = f.read()
                
            # Find allprojects repositories block
            allprojects_match = re.search(r'allprojects\s*{[^}]*repositories\s*{([^}]*)}', content, re.DOTALL)
            if allprojects_match:
                repos_content = allprojects_match.group(1)
                
                # Check if repository already exists
                if repository.lower() in repos_content.lower():
                    return True, f"Repository {repository} already configured"
                    
                # Add repository
                repo_line = repo_urls.get(repository.lower(), f"maven {{ url '{repository}' }}")
                new_repos = repos_content.rstrip() + f'\n        {repo_line}\n    '
                
                new_content = content.replace(allprojects_match.group(0), 
                    f'allprojects {{\n    repositories {{{new_repos}}}')
                    
                with open(root_gradle, 'w') as f:
                    f.write(new_content)
                    
                return True, f"Added repository: {repository}"
            else:
                return False, "Could not find allprojects repositories block"
                
        except Exception as e:
            return False, f"Error adding repository: {str(e)}"
    
    def fix_dependency(self, fix_info: Dict, error: Dict) -> Tuple[bool, str]:
        """Handle missing dependencies"""
        dependency = fix_info.get('dependency', '')
        suggestion = fix_info.get('suggestion', '')
        
        # For now, just report the suggestion
        # In a full implementation, we would:
        # 1. Parse the dependency coordinates
        # 2. Find the appropriate build.gradle
        # 3. Add the dependency to the correct configuration
        
        return False, f"Manual intervention needed: {suggestion}"
    
    def fix_gradle_plugin(self, fix_info: Dict, error: Dict) -> Tuple[bool, str]:
        """Update Android Gradle Plugin version"""
        target_version = fix_info.get('minimum', '8.1.0')
        
        root_gradle = os.path.join(self.project_root, 'build.gradle')
        if not os.path.exists(root_gradle):
            return False, "Could not find root build.gradle"
            
        try:
            with open(root_gradle, 'r') as f:
                content = f.read()
                
            # Update AGP version
            agp_pattern = r'(com\.android\.tools\.build:gradle:)([0-9.]+)'
            if re.search(agp_pattern, content):
                new_content = re.sub(agp_pattern, f'\\g<1>{target_version}', content)
                
                with open(root_gradle, 'w') as f:
                    f.write(new_content)
                    
                return True, f"Updated Android Gradle Plugin to {target_version}"
                
            return False, "Could not find Android Gradle Plugin declaration"
            
        except Exception as e:
            return False, f"Error updating AGP: {str(e)}"
    
    def find_build_gradle(self, module: str) -> Optional[str]:
        """Find build.gradle file for a module"""
        # Handle different module path formats
        module_path = module.replace(':', os.sep)
        
        # Try common locations
        candidates = [
            os.path.join(self.project_root, module_path, 'build.gradle'),
            os.path.join(self.project_root, 'node_modules', module_path, 'android', 'build.gradle'),
            os.path.join(self.project_root, module_path, 'android', 'build.gradle')
        ]
        
        for candidate in candidates:
            if os.path.exists(candidate):
                return candidate
                
        # Search for it
        for root, dirs, files in os.walk(self.project_root):
            if 'build.gradle' in files and module_path in root:
                return os.path.join(root, 'build.gradle')
                
        return None
    
    def commit_fixes(self, message: str = None) -> bool:
        """Commit the applied fixes"""
        if not self.fixes_applied:
            print("No fixes to commit")
            return False
            
        try:
            # Stage changes
            subprocess.run(['git', 'add', '-A'], cwd=self.project_root, check=True)
            
            # Create commit message
            if not message:
                message = "Fix Android build errors\n\n"
                for fix in self.fixes_applied[:5]:  # First 5 fixes
                    message += f"- {fix['error']}\n"
                if len(self.fixes_applied) > 5:
                    message += f"- And {len(self.fixes_applied) - 5} more fixes\n"
                    
            # Commit
            subprocess.run(['git', 'commit', '-m', message], cwd=self.project_root, check=True)
            
            print(f"Committed {len(self.fixes_applied)} fixes")
            return True
            
        except subprocess.CalledProcessError as e:
            print(f"Error committing fixes: {e}")
            return False
    
    def push_fixes(self, branch: str = None) -> bool:
        """Push fixes to remote"""
        try:
            if branch:
                subprocess.run(['git', 'push', 'origin', branch], cwd=self.project_root, check=True)
            else:
                subprocess.run(['git', 'push'], cwd=self.project_root, check=True)
                
            print("Pushed fixes to remote")
            return True
            
        except subprocess.CalledProcessError as e:
            print(f"Error pushing fixes: {e}")
            return False

def main():
    """Test the auto fixer"""
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python auto_fixer.py <analysis.json>")
        return
        
    with open(sys.argv[1], 'r') as f:
        analysis = json.load(f)
        
    fixer = AutoFixer()
    results = fixer.apply_fixes(analysis['errors'])
    
    print(f"\nFix Results:")
    print(f"  Total errors: {results['total_errors']}")
    print(f"  Fixes attempted: {results['fixes_attempted']}")
    print(f"  Successful: {results['fixes_successful']}")
    print(f"  Failed: {results['fixes_failed']}")
    
    if results['fixes_successful'] > 0:
        print("\nWould you like to commit and push these fixes? (y/n)")
        if input().lower() == 'y':
            fixer.commit_fixes()
            fixer.push_fixes()

if __name__ == "__main__":
    main()