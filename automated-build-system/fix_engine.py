#!/usr/bin/env python3
"""
Intelligent Fix Engine for EAS Build Errors
Applies sophisticated fixes based on error patterns
"""

import json
import re
import os
import shutil
from pathlib import Path
from typing import Dict, List, Optional, Any
import logging
import xml.etree.ElementTree as ET

logger = logging.getLogger(__name__)

class FixEngine:
    """Intelligent fix engine for build errors"""
    
    def __init__(self, project_path: str):
        self.project_path = Path(project_path)
        self.android_path = self.project_path / "android"
        self.app_path = self.android_path / "app"
        
        # Load error patterns
        pattern_file = Path(__file__).parent / "error_patterns.json"
        with open(pattern_file, 'r') as f:
            self.error_data = json.load(f)
        
        self.applied_fixes = []
        
    def apply_fix(self, error_id: str, context: Dict[str, Any] = None) -> bool:
        """Apply a fix for a specific error ID"""
        error_config = self._get_error_config(error_id)
        
        if not error_config:
            logger.warning(f"No configuration found for error: {error_id}")
            return False
        
        fix_strategy = error_config.get('fix_strategy')
        fix_method = getattr(self, f"fix_{fix_strategy}", None)
        
        if not fix_method:
            logger.warning(f"No fix method for strategy: {fix_strategy}")
            return False
        
        try:
            logger.info(f"Applying fix: {error_config['description']}")
            success = fix_method(error_config.get('fix_details', {}), context)
            
            if success:
                self.applied_fixes.append(error_id)
                logger.info(f"Successfully applied fix: {error_id}")
            
            return success
        except Exception as e:
            logger.error(f"Error applying fix {error_id}: {e}")
            return False
    
    def _get_error_config(self, error_id: str) -> Optional[Dict]:
        """Get error configuration by ID"""
        for pattern in self.error_data['error_patterns']:
            if pattern['id'] == error_id:
                return pattern
        return None
    
    def fix_version_alignment(self, details: Dict, context: Dict = None) -> bool:
        """Align React Native and Gradle plugin versions"""
        package_json = self.project_path / "package.json"
        build_gradle = self.android_path / "build.gradle"
        
        # Read package.json to get RN version
        with open(package_json, 'r') as f:
            package_data = json.load(f)
        
        # Extract React Native version
        rn_version = package_data.get('dependencies', {}).get('react-native', '')
        version_match = re.search(r'(\d+\.\d+\.\d+)', rn_version)
        
        if not version_match:
            logger.error("Could not extract React Native version")
            return False
        
        correct_version = version_match.group(1)
        logger.info(f"Aligning to React Native version: {correct_version}")
        
        # Update build.gradle
        if build_gradle.exists():
            content = build_gradle.read_text()
            
            # Update React Native Gradle plugin version
            content = re.sub(
                r'("com\.facebook\.react:react-native-gradle-plugin:)[^"]+(")',
                f'\\g<1>{correct_version}\\g<2>',
                content
            )
            
            build_gradle.write_text(content)
        
        # Update package.json gradle plugin if exists
        if '@react-native/gradle-plugin' in package_data.get('devDependencies', {}):
            package_data['devDependencies']['@react-native/gradle-plugin'] = f"^{correct_version}"
            
            with open(package_json, 'w') as f:
                json.dump(package_data, f, indent=2)
        
        return True
    
    def fix_simplify_settings(self, details: Dict, context: Dict = None) -> bool:
        """Create minimal settings.gradle that works in EAS"""
        settings_gradle = self.android_path / "settings.gradle"
        
        # Backup existing file
        if settings_gradle.exists():
            shutil.copy(settings_gradle, settings_gradle.with_suffix('.gradle.backup'))
        
        # Create minimal settings
        minimal_content = """rootProject.name = 'ProductivityApp'
include ':app'

// Minimal plugin management for EAS compatibility
pluginManagement {
    repositories {
        gradlePluginPortal()
        google()
        mavenCentral()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.PREFER_SETTINGS)
    repositories {
        google()
        mavenCentral()
        maven { url "https://www.jitpack.io" }
    }
}
"""
        
        settings_gradle.write_text(minimal_content)
        logger.info("Created minimal settings.gradle")
        return True
    
    def fix_reorder_blocks(self, details: Dict, context: Dict = None) -> bool:
        """Reorder Gradle blocks to fix plugin management position"""
        settings_gradle = self.android_path / "settings.gradle"
        
        if not settings_gradle.exists():
            return False
        
        content = settings_gradle.read_text()
        
        # Extract pluginManagement block
        plugin_pattern = r'(pluginManagement\s*\{(?:[^{}]|\{[^}]*\})*\})'
        plugin_match = re.search(plugin_pattern, content, re.DOTALL)
        
        if plugin_match:
            plugin_block = plugin_match.group(1)
            # Remove from current position
            content = content.replace(plugin_block, '')
            # Add at the beginning
            content = plugin_block + '\n\n' + content.strip()
            
            settings_gradle.write_text(content)
            return True
        
        return False
    
    def fix_add_repositories(self, details: Dict, context: Dict = None) -> bool:
        """Add missing repositories to build.gradle"""
        build_gradle = self.android_path / "build.gradle"
        
        if not build_gradle.exists():
            return False
        
        content = build_gradle.read_text()
        repositories = details.get('repositories', [])
        
        # Find allprojects block
        allprojects_pattern = r'(allprojects\s*\{[^}]*repositories\s*\{)([^}]*)(})'
        match = re.search(allprojects_pattern, content, re.DOTALL)
        
        if match:
            repos_content = match.group(2)
            
            for repo in repositories:
                if repo not in repos_content:
                    # Add after existing repositories
                    repos_content = repos_content.rstrip() + f'\n        {repo}\n'
            
            # Replace repositories block
            new_content = match.group(1) + repos_content + match.group(3)
            content = content[:match.start()] + new_content + content[match.end():]
            
            build_gradle.write_text(content)
            return True
        
        return False
    
    def fix_add_namespace(self, details: Dict, context: Dict = None) -> bool:
        """Add namespace to app/build.gradle"""
        app_gradle = self.app_path / "build.gradle"
        
        if not app_gradle.exists():
            return False
        
        content = app_gradle.read_text()
        namespace = details.get('namespace', 'com.productivityapp')
        
        # Check if namespace already exists
        if 'namespace' in content:
            # Update existing namespace
            content = re.sub(
                r'namespace\s+["\'].*?["\']',
                f'namespace "{namespace}"',
                content
            )
        else:
            # Add namespace after android {
            content = re.sub(
                r'(android\s*\{)',
                f'\\1\n    namespace "{namespace}"',
                content
            )
        
        app_gradle.write_text(content)
        return True
    
    def fix_unify_package_name(self, details: Dict, context: Dict = None) -> bool:
        """Ensure consistent package name across all files"""
        package_name = details.get('package', 'com.productivityapp')
        
        # Update app.json
        app_json = self.project_path / "app.json"
        if app_json.exists():
            with open(app_json, 'r') as f:
                data = json.load(f)
            
            # Update package in expo config
            if 'expo' in data:
                if 'android' not in data['expo']:
                    data['expo']['android'] = {}
                data['expo']['android']['package'] = package_name
            
            with open(app_json, 'w') as f:
                json.dump(data, f, indent=2)
        
        # Update build.gradle applicationId
        app_gradle = self.app_path / "build.gradle"
        if app_gradle.exists():
            content = app_gradle.read_text()
            content = re.sub(
                r'applicationId\s+["\'].*?["\']',
                f'applicationId "{package_name}"',
                content
            )
            app_gradle.write_text(content)
        
        # Update AndroidManifest.xml
        manifest_path = self.app_path / "src" / "main" / "AndroidManifest.xml"
        if manifest_path.exists():
            tree = ET.parse(manifest_path)
            root = tree.getroot()
            root.set('package', package_name)
            tree.write(manifest_path, encoding='utf-8', xml_declaration=True)
        
        return True
    
    def fix_set_gradle_version(self, details: Dict, context: Dict = None) -> bool:
        """Set correct Gradle wrapper version"""
        gradle_wrapper = self.android_path / "gradle" / "wrapper" / "gradle-wrapper.properties"
        
        if not gradle_wrapper.exists():
            return False
        
        version = details.get('version', '8.6')
        content = gradle_wrapper.read_text()
        
        content = re.sub(
            r'distributionUrl=.*gradle-.*-all\.zip',
            f'distributionUrl=https\\://services.gradle.org/distributions/gradle-{version}-all.zip',
            content
        )
        
        gradle_wrapper.write_text(content)
        return True
    
    def fix_fix_expo_config(self, details: Dict, context: Dict = None) -> bool:
        """Fix Expo configuration issues"""
        
        # Create expo-module.config.json if needed
        if details.get('create_config'):
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
        
        # Simplify settings.gradle if needed
        if details.get('simplify_gradle'):
            return self.fix_simplify_settings({}, context)
        
        return True
    
    def fix_define_kotlin_version(self, details: Dict, context: Dict = None) -> bool:
        """Define Kotlin version in build.gradle"""
        build_gradle = self.android_path / "build.gradle"
        
        if not build_gradle.exists():
            return False
        
        content = build_gradle.read_text()
        version = details.get('version', '1.8.10')
        
        # Check if kotlinVersion is defined in ext block
        if 'kotlinVersion' not in content:
            # Add to buildscript.ext block
            content = re.sub(
                r'(buildscript\s*\{[^}]*ext\s*\{)([^}]*)(})',
                lambda m: m.group(1) + m.group(2).rstrip() + f'\n        kotlinVersion = "{version}"\n' + m.group(3),
                content,
                flags=re.DOTALL
            )
        
        build_gradle.write_text(content)
        return True
    
    def fix_increase_memory(self, details: Dict, context: Dict = None) -> bool:
        """Increase Gradle memory allocation"""
        gradle_props = self.android_path / "gradle.properties"
        
        heap_size = details.get('heap_size', '4096m')
        
        if gradle_props.exists():
            content = gradle_props.read_text()
        else:
            content = ""
        
        # Update or add memory settings
        memory_settings = {
            'org.gradle.jvmargs': f'-Xmx{heap_size} -XX:MaxMetaspaceSize=512m',
            'org.gradle.daemon': 'true',
            'org.gradle.parallel': 'true',
            'org.gradle.configureondemand': 'false'
        }
        
        for key, value in memory_settings.items():
            if key in content:
                content = re.sub(f'{key}=.*', f'{key}={value}', content)
            else:
                content += f'\n{key}={value}'
        
        gradle_props.write_text(content.strip() + '\n')
        return True
    
    def fix_enable_multidex(self, details: Dict, context: Dict = None) -> bool:
        """Enable multidex support"""
        app_gradle = self.app_path / "build.gradle"
        
        if not app_gradle.exists():
            return False
        
        content = app_gradle.read_text()
        
        # Add multidex dependency
        if 'multidex' not in content:
            content = re.sub(
                r'(dependencies\s*\{)',
                '\\1\n    implementation "androidx.multidex:multidex:2.0.1"',
                content
            )
        
        # Enable multidex in defaultConfig
        content = re.sub(
            r'(defaultConfig\s*\{[^}]*)(})',
            lambda m: m.group(1).rstrip() + '\n        multiDexEnabled true\n' + m.group(2),
            content,
            flags=re.DOTALL
        )
        
        app_gradle.write_text(content)
        return True
    
    def fix_clean_resources(self, details: Dict, context: Dict = None) -> bool:
        """Clean build and remove duplicate resources"""
        
        # Clean build directory
        if details.get('clean_build'):
            build_dir = self.app_path / "build"
            if build_dir.exists():
                shutil.rmtree(build_dir)
                logger.info("Cleaned build directory")
        
        # Clean gradle caches
        gradle_cache = self.android_path / ".gradle"
        if gradle_cache.exists():
            shutil.rmtree(gradle_cache)
            logger.info("Cleaned gradle cache")
        
        return True
    
    def apply_fix_sequence(self, sequence_name: str) -> List[str]:
        """Apply a predefined sequence of fixes"""
        sequences = self.error_data.get('fix_sequences', [])
        
        for sequence in sequences:
            if sequence['name'] == sequence_name:
                logger.info(f"Applying fix sequence: {sequence['description']}")
                applied = []
                
                for fix_id in sequence['fixes']:
                    if self.apply_fix(fix_id):
                        applied.append(fix_id)
                
                return applied
        
        return []
    
    def detect_and_fix_errors(self, log_content: str) -> List[str]:
        """Detect errors in logs and apply appropriate fixes"""
        applied_fixes = []
        
        for pattern_config in self.error_data['error_patterns']:
            pattern = re.compile(pattern_config['pattern'])
            
            if pattern.search(log_content):
                logger.info(f"Detected error: {pattern_config['description']}")
                
                # Skip if already applied
                if pattern_config['id'] in self.applied_fixes:
                    logger.info(f"Fix already applied: {pattern_config['id']}")
                    continue
                
                # Apply fix
                if self.apply_fix(pattern_config['id']):
                    applied_fixes.append(pattern_config['id'])
        
        return applied_fixes


def main():
    """Test the fix engine"""
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python fix_engine.py <project_path> [error_id]")
        sys.exit(1)
    
    project_path = sys.argv[1]
    engine = FixEngine(project_path)
    
    if len(sys.argv) > 2:
        # Apply specific fix
        error_id = sys.argv[2]
        success = engine.apply_fix(error_id)
        print(f"Fix {error_id}: {'Success' if success else 'Failed'}")
    else:
        # Apply initial setup sequence
        fixes = engine.apply_fix_sequence('initial_setup')
        print(f"Applied fixes: {fixes}")


if __name__ == "__main__":
    main()