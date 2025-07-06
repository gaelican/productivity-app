#!/usr/bin/env python3
"""
Fetch and analyze EAS build errors directly
"""

import subprocess
import json
import re
import sys

def get_build_logs(build_id):
    """Get build logs using eas build:view"""
    print(f"📥 Fetching build details for: {build_id}")
    
    try:
        # Get build details
        result = subprocess.run(
            ['eas', 'build:view', build_id],
            capture_output=True,
            text=True
        )
        
        output = result.stdout
        
        # Save full output
        with open(f'build_output_{build_id}.txt', 'w') as f:
            f.write(output)
        
        # Extract error patterns
        print("\n🔍 Analyzing build output...")
        
        # Common error patterns
        error_patterns = [
            r'FAILURE: Build failed with an exception\.',
            r'Could not read script.*as it does not exist',
            r'A problem occurred evaluating.*',
            r'What went wrong:.*',
            r'> .*',
            r'BUILD FAILED in \d+s',
            r'Error: .*',
            r'error .*',
            r'Could not find.*',
            r'Unable to resolve.*',
            r'settings\.gradle.*line.*\d+',
            r'build\.gradle.*line.*\d+',
        ]
        
        errors_found = []
        
        # Search for errors in output
        for line in output.split('\n'):
            for pattern in error_patterns:
                if re.search(pattern, line, re.IGNORECASE):
                    errors_found.append(line.strip())
        
        # Print errors
        if errors_found:
            print("\n❌ Errors found:")
            for error in errors_found:
                print(f"   • {error}")
            
            # Analyze specific error types
            analyze_errors(errors_found)
        else:
            print("⚠️  No specific errors found in output")
            print("   Check build_output_{build_id}.txt for full details")
        
        # Try to get logs URL
        if "Logs" in output:
            logs_line = [l for l in output.split('\n') if 'Logs' in l and 'https://' in l]
            if logs_line:
                print(f"\n📋 Logs URL: {logs_line[0].split()[-1]}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def analyze_errors(errors):
    """Analyze errors and suggest fixes"""
    print("\n🔧 Suggested fixes based on errors:")
    
    fixes = []
    
    for error in errors:
        # Settings.gradle errors
        if 'settings.gradle' in error and 'autolinking.gradle' in error:
            fixes.append({
                'error': 'autolinking.gradle not found',
                'fix': 'Update settings.gradle to use conditional loading',
                'command': './fix-eas-settings-gradle.sh'
            })
        
        # Gradle plugin version errors
        if 'react-native-gradle-plugin' in error:
            fixes.append({
                'error': 'Gradle plugin version mismatch',
                'fix': 'Align gradle plugin version with React Native version',
                'command': 'sed -i "s/react-native-gradle-plugin:[0-9.]*/react-native-gradle-plugin:0.74.5/g" android/build.gradle'
            })
        
        # Could not find errors
        if 'Could not find' in error:
            module = error.split('Could not find')[-1].strip()
            fixes.append({
                'error': f'Missing module: {module}',
                'fix': f'Add {module} to dependencies',
                'command': f'npm install {module}'
            })
    
    # Print unique fixes
    seen = set()
    for fix in fixes:
        key = fix['error']
        if key not in seen:
            seen.add(key)
            print(f"\n   Error: {fix['error']}")
            print(f"   Fix: {fix['fix']}")
            print(f"   Command: {fix['command']}")

if __name__ == "__main__":
    build_id = sys.argv[1] if len(sys.argv) > 1 else "15d4147a-2db6-4d0d-bc80-3ce83812240f"
    get_build_logs(build_id)