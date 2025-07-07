#!/usr/bin/env python3
"""
Quick check of current build status
"""

import sys
import os
sys.path.append(os.path.dirname(__file__))

from monitor import BuildMonitor
from datetime import datetime

def main():
    # Repository info
    owner = "gaelican"
    repo = "productivity-app"
    
    print(f"Checking builds for {owner}/{repo}...")
    print(f"Current time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("-" * 60)
    
    # Create monitor
    monitor = BuildMonitor(owner, repo)
    
    # Get recent runs
    runs = monitor.get_workflow_runs()
    
    if not runs:
        print("No workflow runs found")
        print("\nNote: This might be because:")
        print("1. The repository doesn't use GitHub Actions")
        print("2. You need to set GITHUB_TOKEN for private repos")
        print("3. There are no recent workflow runs")
        return
    
    print(f"\nFound {len(runs)} recent workflow runs:\n")
    
    # Show details for each run
    for i, run in enumerate(runs[:5]):  # Show first 5
        run_id = run['id']
        name = run.get('name', 'Unknown')
        branch = run.get('head_branch', 'Unknown')
        status = run.get('status', 'Unknown')
        conclusion = run.get('conclusion', 'pending')
        created = run.get('created_at', 'Unknown')
        
        print(f"{i+1}. Run #{run_id} - {name}")
        print(f"   Branch: {branch}")
        print(f"   Status: {status} → {conclusion}")
        print(f"   Created: {created}")
        print(f"   URL: {run['html_url']}")
        
        # Check if this might be the EAS build mentioned
        if str(run_id) == "16108097105" or "16108097105" in str(run_id):
            print("   ⭐ This matches the build ID mentioned by the user!")
            
        print()
    
    # Look for builds on the current branch
    current_branch = "downgrade-to-rn-073"
    print(f"\nLooking for builds on branch '{current_branch}':")
    
    branch_runs = [r for r in runs if r.get('head_branch') == current_branch]
    if branch_runs:
        latest = branch_runs[0]
        print(f"Latest build on {current_branch}:")
        print(f"  Run #{latest['id']}")
        print(f"  Status: {latest['status']} → {latest.get('conclusion', 'pending')}")
        print(f"  URL: {latest['html_url']}")
    else:
        print(f"No recent builds found on branch '{current_branch}'")

if __name__ == "__main__":
    main()