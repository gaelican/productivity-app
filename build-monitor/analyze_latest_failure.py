#!/usr/bin/env python3
"""
Download and analyze the latest build failure
"""

import sys
import os
import json
sys.path.append(os.path.dirname(__file__))

from monitor import BuildMonitor
from log_analyzer import LogAnalyzer
from auto_fixer import AutoFixer

def main():
    # Setup
    owner = "gaelican"
    repo = "productivity-app"
    run_id = 16108097105  # The specific build mentioned
    
    print(f"Analyzing build failure for run #{run_id}")
    print("-" * 60)
    
    # Create instances
    monitor = BuildMonitor(owner, repo)
    analyzer = LogAnalyzer()
    fixer = AutoFixer("..")  # Project root is parent directory
    
    # Download logs
    print("\n1. Downloading build logs...")
    log_file = monitor.get_run_logs(run_id)
    
    if not log_file:
        print("   Failed to download logs. You may need to set GITHUB_TOKEN.")
        print("   Export it with: export GITHUB_TOKEN=your_token")
        return
    
    print(f"   Logs saved to: {log_file}")
    
    # Analyze logs
    print("\n2. Analyzing build logs...")
    errors = analyzer.analyze_zip_logs(log_file)
    
    if not errors:
        print("   No specific errors could be identified")
        return
    
    print(f"   Found {len(errors)} errors:\n")
    
    # Show all errors with fixes
    fixable_count = 0
    for i, error in enumerate(errors):
        print(f"{i+1}. {error['type'].upper()}: {error['summary']}")
        if error.get('module'):
            print(f"   Module: {error['module']}")
        if error.get('fix'):
            print(f"   Fix available: {error['fix']['action']}")
            fixable_count += 1
        else:
            print(f"   Fix: Manual intervention required")
        print()
    
    # Save analysis
    analysis_file = f"analysis/run_{run_id}.json"
    os.makedirs("analysis", exist_ok=True)
    with open(analysis_file, 'w') as f:
        json.dump({
            'run_id': run_id,
            'error_count': len(errors),
            'fixable_count': fixable_count,
            'errors': errors
        }, f, indent=2)
    
    print(f"\nAnalysis saved to: {analysis_file}")
    print(f"Fixable errors: {fixable_count} out of {len(errors)}")
    
    # Ask if user wants to apply fixes
    if fixable_count > 0:
        print("\nWould you like to apply the automatic fixes? (y/n)")
        response = input().strip().lower()
        
        if response == 'y':
            print("\n3. Applying fixes...")
            results = fixer.apply_fixes(errors)
            
            print(f"\nFix results:")
            print(f"  Attempted: {results['fixes_attempted']}")
            print(f"  Successful: {results['fixes_successful']}")
            print(f"  Failed: {results['fixes_failed']}")
            
            if results['fixes_successful'] > 0:
                print("\nWould you like to commit and push these fixes? (y/n)")
                response = input().strip().lower()
                
                if response == 'y':
                    # Create commit message
                    message = "Fix Android build errors\n\n"
                    for detail in results['details']:
                        if detail['success']:
                            message += f"- {detail['error']}\n"
                    
                    # Stage and commit
                    import subprocess
                    try:
                        subprocess.run(['git', 'add', '-A'], cwd='..', check=True)
                        subprocess.run(['git', 'commit', '-m', message], cwd='..', check=True)
                        subprocess.run(['git', 'push', 'origin', 'downgrade-to-rn-073'], cwd='..', check=True)
                        print("\nFixes committed and pushed!")
                        print("A new build should start automatically.")
                    except subprocess.CalledProcessError as e:
                        print(f"\nError during git operations: {e}")

if __name__ == "__main__":
    main()