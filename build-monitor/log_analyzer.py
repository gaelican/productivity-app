#!/usr/bin/env python3
"""
Build Log Analyzer
Analyzes GitHub Actions build logs to identify Android build errors
"""

import os
import re
import json
import zipfile
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass

@dataclass
class BuildError:
    type: str
    message: str
    file_path: Optional[str]
    line_number: Optional[int]
    module: Optional[str]
    suggested_fix: Optional[str]

class LogAnalyzer:
    def __init__(self):
        # Common error patterns for Android builds
        self.error_patterns = {
            'namespace_missing': {
                'pattern': r"Namespace not specified.*?module[:\s]+['\"]?([^'\"]+)['\"]?",
                'type': 'namespace',
                'extract': ['module']
            },
            'buildconfig_missing': {
                'pattern': r"Unresolved reference: BuildConfig|BuildConfig.*?cannot be resolved",
                'type': 'buildconfig',
                'module_pattern': r"project[:\s]+['\"]?:([^'\"]+)['\"]?"
            },
            'kotlin_version': {
                'pattern': r"Module was compiled with an incompatible version of Kotlin.*?version[:\s]+([0-9.]+).*?expected[:\s]+([0-9.]+)",
                'type': 'kotlin_version',
                'extract': ['compiled_version', 'expected_version']
            },
            'dependency_not_found': {
                'pattern': r"Could not find ([^.]+\.[^:]+:[^:]+:[^.\s]+)",
                'type': 'dependency',
                'extract': ['dependency']
            },
            'repository_missing': {
                'pattern': r"Could not resolve.*?repository[:\s]+([^\s]+)",
                'type': 'repository',
                'extract': ['repository']
            },
            'gradle_plugin': {
                'pattern': r"The Android Gradle plugin.*?version ([0-9.]+).*?minimum.*?([0-9.]+)",
                'type': 'gradle_plugin',
                'extract': ['current', 'minimum']
            },
            'react_native_autolinking': {
                'pattern': r"Error.*?autolinking.*?native.*?dependencies|ReactNativeHost.*?not found",
                'type': 'rn_autolinking'
            },
            'compile_error': {
                'pattern': r"([^:]+\.(?:java|kt|gradle))[:]\s*([0-9]+)[:]\s*error[:]\s*(.+)",
                'type': 'compile',
                'extract': ['file', 'line', 'message']
            }
        }
        
    def analyze_zip_logs(self, zip_path: str) -> List[Dict]:
        """Extract and analyze logs from GitHub Actions zip file"""
        errors = []
        
        try:
            with zipfile.ZipFile(zip_path, 'r') as zip_file:
                for file_name in zip_file.namelist():
                    if file_name.endswith('.txt'):
                        content = zip_file.read(file_name).decode('utf-8', errors='ignore')
                        file_errors = self.analyze_log_content(content)
                        errors.extend(file_errors)
        except Exception as e:
            print(f"Error reading zip file: {e}")
            
        return self.deduplicate_errors(errors)
    
    def analyze_log_content(self, content: str) -> List[Dict]:
        """Analyze log content for errors"""
        errors = []
        lines = content.split('\n')
        
        # Look for error patterns
        for i, line in enumerate(lines):
            for error_name, pattern_info in self.error_patterns.items():
                match = re.search(pattern_info['pattern'], line, re.IGNORECASE)
                if match:
                    error = {
                        'type': pattern_info['type'],
                        'line': i + 1,
                        'raw_message': line.strip(),
                        'context': self.get_context(lines, i)
                    }
                    
                    # Extract specific information
                    if 'extract' in pattern_info:
                        for j, field in enumerate(pattern_info['extract'], 1):
                            if j <= len(match.groups()):
                                error[field] = match.group(j)
                    
                    # Determine affected module/file
                    error['module'] = self.find_module(lines, i)
                    error['summary'] = self.summarize_error(error)
                    error['fix'] = self.suggest_fix(error)
                    
                    errors.append(error)
                    
        return errors
    
    def get_context(self, lines: List[str], error_line: int, context_size: int = 5) -> List[str]:
        """Get lines around the error for context"""
        start = max(0, error_line - context_size)
        end = min(len(lines), error_line + context_size + 1)
        return lines[start:end]
    
    def find_module(self, lines: List[str], error_line: int) -> Optional[str]:
        """Try to determine which module/project the error is in"""
        # Look backwards for project/module indicators
        for i in range(error_line, max(0, error_line - 20), -1):
            line = lines[i]
            
            # Common module indicators
            module_match = re.search(r"project[:\s]+['\"]?:([^'\"]+)['\"]?", line)
            if module_match:
                return module_match.group(1)
                
            task_match = re.search(r"> Task :([^:]+):", line)
            if task_match:
                return task_match.group(1)
                
        return None
    
    def summarize_error(self, error: Dict) -> str:
        """Create a human-readable summary of the error"""
        error_type = error['type']
        
        if error_type == 'namespace':
            module = error.get('module', 'unknown module')
            return f"Missing namespace declaration in {module}"
            
        elif error_type == 'buildconfig':
            module = error.get('module', 'unknown module')
            return f"BuildConfig not enabled in {module}"
            
        elif error_type == 'kotlin_version':
            return f"Kotlin version mismatch: compiled with {error.get('compiled_version', '?')} but needs {error.get('expected_version', '?')}"
            
        elif error_type == 'dependency':
            return f"Missing dependency: {error.get('dependency', 'unknown')}"
            
        elif error_type == 'repository':
            return f"Repository not configured: {error.get('repository', 'unknown')}"
            
        elif error_type == 'compile':
            return f"Compilation error in {error.get('file', 'unknown file')}: {error.get('message', 'unknown error')}"
            
        else:
            return error.get('raw_message', 'Unknown error')[:100]
    
    def suggest_fix(self, error: Dict) -> Optional[Dict]:
        """Suggest a fix for the error"""
        error_type = error['type']
        
        if error_type == 'namespace':
            module = error.get('module', '')
            return {
                'action': 'add_namespace',
                'file': f"{module}/build.gradle",
                'content': f"android {{\n    namespace 'com.productivityapp.{module.replace(':', '.').replace('-', '')}'\n}}"
            }
            
        elif error_type == 'buildconfig':
            module = error.get('module', '')
            return {
                'action': 'enable_buildconfig',
                'file': f"{module}/build.gradle",
                'content': "android {\n    buildFeatures {\n        buildConfig = true\n    }\n}"
            }
            
        elif error_type == 'kotlin_version':
            return {
                'action': 'update_kotlin_version',
                'file': 'build.gradle',
                'version': error.get('expected_version', '1.9.0')
            }
            
        elif error_type == 'dependency':
            dep = error.get('dependency', '')
            return {
                'action': 'add_dependency',
                'dependency': dep,
                'suggestion': f"Add to repositories: maven {{ url 'https://jitpack.io' }}"
            }
            
        return None
    
    def deduplicate_errors(self, errors: List[Dict]) -> List[Dict]:
        """Remove duplicate errors"""
        seen = set()
        unique_errors = []
        
        for error in errors:
            key = (error['type'], error.get('module', ''), error.get('summary', ''))
            if key not in seen:
                seen.add(key)
                unique_errors.append(error)
                
        return unique_errors
    
    def save_analysis(self, errors: List[Dict], output_file: str):
        """Save analysis results to JSON"""
        os.makedirs(os.path.dirname(output_file), exist_ok=True)
        with open(output_file, 'w') as f:
            json.dump({
                'timestamp': datetime.now().isoformat(),
                'error_count': len(errors),
                'errors': errors
            }, f, indent=2)

def main():
    """Test the analyzer with a log file"""
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python log_analyzer.py <log_file.zip>")
        return
        
    analyzer = LogAnalyzer()
    errors = analyzer.analyze_zip_logs(sys.argv[1])
    
    print(f"\nFound {len(errors)} errors:")
    for error in errors:
        print(f"\n{error['type'].upper()}: {error['summary']}")
        if error.get('fix'):
            print(f"  Suggested fix: {json.dumps(error['fix'], indent=2)}")

if __name__ == "__main__":
    from datetime import datetime
    main()