#!/usr/bin/env python3
"""
GitHub Actions Build Monitor
Monitors GitHub Actions builds and analyzes failures
"""

import os
import sys
import time
import json
import requests
from datetime import datetime
from typing import Dict, List, Optional, Tuple

class BuildMonitor:
    def __init__(self, owner: str, repo: str, token: Optional[str] = None):
        self.owner = owner
        self.repo = repo
        self.token = token or os.environ.get('GITHUB_TOKEN')
        self.headers = {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'BuildMonitor/1.0'
        }
        if self.token:
            self.headers['Authorization'] = f'token {self.token}'
        
        self.base_url = f"https://api.github.com/repos/{owner}/{repo}"
        self.monitored_runs = {}
        
    def get_workflow_runs(self, workflow_name: Optional[str] = None) -> List[Dict]:
        """Get recent workflow runs"""
        url = f"{self.base_url}/actions/runs"
        params = {'per_page': 10}
        if workflow_name:
            params['workflow_id'] = workflow_name
            
        response = requests.get(url, headers=self.headers, params=params)
        if response.status_code == 200:
            return response.json().get('workflow_runs', [])
        else:
            print(f"Error fetching runs: {response.status_code}")
            return []
    
    def get_run_logs(self, run_id: int) -> Optional[str]:
        """Download logs for a specific run"""
        url = f"{self.base_url}/actions/runs/{run_id}/logs"
        response = requests.get(url, headers=self.headers, allow_redirects=True)
        
        if response.status_code == 200:
            # Save logs to file
            log_file = f"build-monitor/logs/run_{run_id}.zip"
            os.makedirs(os.path.dirname(log_file), exist_ok=True)
            with open(log_file, 'wb') as f:
                f.write(response.content)
            return log_file
        return None
    
    def analyze_run(self, run: Dict) -> Dict:
        """Analyze a workflow run"""
        run_id = run['id']
        status = run['status']
        conclusion = run.get('conclusion', 'pending')
        
        analysis = {
            'run_id': run_id,
            'status': status,
            'conclusion': conclusion,
            'created_at': run['created_at'],
            'updated_at': run['updated_at'],
            'url': run['html_url'],
            'errors': []
        }
        
        if conclusion == 'failure':
            # Get logs for failed runs
            log_file = self.get_run_logs(run_id)
            if log_file:
                analysis['log_file'] = log_file
                # Analyze logs will be implemented by LogAnalyzer
                
        return analysis
    
    def monitor_continuous(self, interval: int = 120):
        """Continuously monitor builds"""
        print(f"Starting continuous monitoring (checking every {interval} seconds)...")
        
        while True:
            try:
                runs = self.get_workflow_runs()
                
                for run in runs:
                    run_id = run['id']
                    
                    # Check if this is a new or updated run
                    if run_id not in self.monitored_runs or \
                       self.monitored_runs[run_id]['status'] != run['status']:
                        
                        analysis = self.analyze_run(run)
                        self.monitored_runs[run_id] = analysis
                        
                        # Report status
                        print(f"\n[{datetime.now().strftime('%H:%M:%S')}] Run #{run_id}")
                        print(f"  Status: {analysis['status']} → {analysis['conclusion']}")
                        print(f"  URL: {analysis['url']}")
                        
                        if analysis['conclusion'] == 'failure':
                            print("  ⚠️  Build FAILED - Analyzing logs...")
                            # Trigger log analysis
                            from log_analyzer import LogAnalyzer
                            analyzer = LogAnalyzer()
                            if 'log_file' in analysis:
                                errors = analyzer.analyze_zip_logs(analysis['log_file'])
                                if errors:
                                    print("  Found errors:")
                                    for error in errors[:3]:  # Show first 3 errors
                                        print(f"    - {error['type']}: {error['summary']}")
                
                time.sleep(interval)
                
            except KeyboardInterrupt:
                print("\nMonitoring stopped.")
                break
            except Exception as e:
                print(f"Error during monitoring: {e}")
                time.sleep(interval)

def main():
    # Default to current repo
    owner = "BuildWithChris"  # You'll need to update this
    repo = "productivity-app"
    
    # Check for command line args
    if len(sys.argv) > 2:
        owner = sys.argv[1]
        repo = sys.argv[2]
    
    monitor = BuildMonitor(owner, repo)
    
    # Check current status first
    print("Checking current builds...")
    runs = monitor.get_workflow_runs()
    
    if runs:
        print(f"\nFound {len(runs)} recent workflow runs:")
        for run in runs[:5]:
            analysis = monitor.analyze_run(run)
            print(f"\nRun #{run['id']}:")
            print(f"  Status: {analysis['status']} → {analysis['conclusion']}")
            print(f"  Created: {analysis['created_at']}")
            print(f"  URL: {analysis['url']}")
    
    # Start continuous monitoring
    monitor.monitor_continuous()

if __name__ == "__main__":
    main()