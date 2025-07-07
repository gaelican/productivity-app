#!/usr/bin/env python3
"""
Build Fix Orchestrator
Coordinates monitoring, analysis, and fixing of GitHub Actions builds
"""

import os
import sys
import time
import json
import subprocess
from datetime import datetime
from typing import Dict, List, Optional

from monitor import BuildMonitor
from log_analyzer import LogAnalyzer
from auto_fixer import AutoFixer

class BuildFixOrchestrator:
    def __init__(self, owner: str, repo: str, branch: str = None):
        self.owner = owner
        self.repo = repo
        self.branch = branch or self.get_current_branch()
        
        self.monitor = BuildMonitor(owner, repo)
        self.analyzer = LogAnalyzer()
        self.fixer = AutoFixer(".")
        
        self.fix_history = []
        self.max_fix_attempts = 10
        self.successful_build_found = False
        
    def get_current_branch(self) -> str:
        """Get current git branch"""
        try:
            result = subprocess.run(['git', 'branch', '--show-current'], 
                                  capture_output=True, text=True, check=True)
            return result.stdout.strip()
        except:
            return "main"
    
    def run_continuous(self, check_interval: int = 120):
        """Run continuous monitoring and fixing loop"""
        print(f"Starting Build Fix Orchestrator")
        print(f"Repository: {self.owner}/{self.repo}")
        print(f"Branch: {self.branch}")
        print(f"Check interval: {check_interval} seconds")
        print("-" * 60)
        
        fix_attempts = 0
        last_run_id = None
        
        while not self.successful_build_found and fix_attempts < self.max_fix_attempts:
            try:
                # Get latest workflow runs
                runs = self.monitor.get_workflow_runs()
                
                if not runs:
                    print(f"[{self.timestamp()}] No workflow runs found")
                    time.sleep(check_interval)
                    continue
                
                # Find the most recent run for our branch
                current_run = None
                for run in runs:
                    if run.get('head_branch') == self.branch:
                        current_run = run
                        break
                
                if not current_run:
                    print(f"[{self.timestamp()}] No runs found for branch {self.branch}")
                    time.sleep(check_interval)
                    continue
                
                run_id = current_run['id']
                status = current_run['status']
                conclusion = current_run.get('conclusion', 'pending')
                
                # Skip if we're already processing this run
                if run_id == last_run_id and conclusion == 'failure':
                    print(f"[{self.timestamp()}] Already processed run #{run_id}")
                    time.sleep(check_interval)
                    continue
                
                print(f"\n[{self.timestamp()}] Run #{run_id}: {status} → {conclusion}")
                
                if status == 'completed':
                    if conclusion == 'success':
                        print("SUCCESS! Build passed!")
                        self.successful_build_found = True
                        self.report_success(current_run)
                        break
                        
                    elif conclusion == 'failure':
                        print("Build FAILED - Analyzing and fixing...")
                        
                        # Analyze the failure
                        analysis = self.analyze_failure(run_id)
                        
                        if analysis and analysis['errors']:
                            # Apply fixes
                            fix_results = self.apply_fixes(analysis['errors'])
                            
                            if fix_results['fixes_successful'] > 0:
                                # Commit and push fixes
                                self.commit_and_push_fixes(fix_results)
                                fix_attempts += 1
                                last_run_id = run_id
                                
                                # Wait for new build to start
                                print(f"\nFixes pushed. Waiting for new build...")
                                time.sleep(30)  # Give GitHub time to start new build
                            else:
                                print("No automatic fixes could be applied")
                                self.report_manual_intervention_needed(analysis['errors'])
                                break
                        else:
                            print("Could not analyze build failure")
                            break
                            
                elif status in ['queued', 'in_progress']:
                    print(f"Build is {status}. Waiting...")
                    
                time.sleep(check_interval)
                
            except KeyboardInterrupt:
                print("\nOrchestrator stopped by user")
                break
            except Exception as e:
                print(f"Error in orchestrator: {e}")
                time.sleep(check_interval)
        
        if fix_attempts >= self.max_fix_attempts:
            print(f"\nReached maximum fix attempts ({self.max_fix_attempts})")
            self.report_failure_summary()
    
    def analyze_failure(self, run_id: int) -> Optional[Dict]:
        """Download and analyze failed build logs"""
        print(f"  Downloading logs for run #{run_id}...")
        
        log_file = self.monitor.get_run_logs(run_id)
        if not log_file:
            print("  Could not download logs")
            return None
            
        print(f"  Analyzing logs...")
        errors = self.analyzer.analyze_zip_logs(log_file)
        
        if errors:
            print(f"  Found {len(errors)} errors:")
            for i, error in enumerate(errors[:5]):  # Show first 5
                print(f"    {i+1}. {error['summary']}")
            
            if len(errors) > 5:
                print(f"    ... and {len(errors) - 5} more")
                
            # Save analysis
            analysis_file = f"build-monitor/analysis/run_{run_id}.json"
            self.analyzer.save_analysis(errors, analysis_file)
            
            return {
                'run_id': run_id,
                'errors': errors,
                'analysis_file': analysis_file
            }
        else:
            print("  No specific errors identified")
            return None
    
    def apply_fixes(self, errors: List[Dict]) -> Dict:
        """Apply automatic fixes for errors"""
        print(f"\n  Applying fixes for {len(errors)} errors...")
        
        results = self.fixer.apply_fixes(errors)
        
        print(f"  Fix results:")
        print(f"    Attempted: {results['fixes_attempted']}")
        print(f"    Successful: {results['fixes_successful']}")
        print(f"    Failed: {results['fixes_failed']}")
        
        # Record in history
        self.fix_history.append({
            'timestamp': datetime.now().isoformat(),
            'results': results
        })
        
        return results
    
    def commit_and_push_fixes(self, fix_results: Dict):
        """Commit and push the applied fixes"""
        print("\n  Committing fixes...")
        
        # Create detailed commit message
        message = "Fix Android build errors (automated)\n\n"
        for detail in fix_results['details']:
            if detail['success']:
                message += f"- {detail['error']}\n"
        
        message += f"\nAutomated fix attempt #{len(self.fix_history)}"
        
        try:
            # Stage all changes
            subprocess.run(['git', 'add', '-A'], check=True)
            
            # Commit
            subprocess.run(['git', 'commit', '-m', message], check=True)
            
            # Push to branch
            print(f"  Pushing to {self.branch}...")
            subprocess.run(['git', 'push', 'origin', self.branch], check=True)
            
            print("  Fixes pushed successfully!")
            
        except subprocess.CalledProcessError as e:
            print(f"  Error during git operations: {e}")
    
    def report_success(self, run: Dict):
        """Report successful build"""
        print("\n" + "="*60)
        print("BUILD SUCCESS!")
        print("="*60)
        print(f"Run ID: {run['id']}")
        print(f"URL: {run['html_url']}")
        print(f"Duration: {run.get('run_started_at', 'N/A')} to {run.get('updated_at', 'N/A')}")
        print(f"\nTotal fix attempts: {len(self.fix_history)}")
        
        if self.fix_history:
            print("\nFixes applied:")
            for i, fix in enumerate(self.fix_history):
                print(f"  Attempt {i+1}: {fix['results']['fixes_successful']} fixes")
    
    def report_manual_intervention_needed(self, errors: List[Dict]):
        """Report errors that need manual intervention"""
        print("\n" + "="*60)
        print("MANUAL INTERVENTION REQUIRED")
        print("="*60)
        print(f"\nThe following errors could not be fixed automatically:")
        
        for i, error in enumerate(errors):
            if not error.get('fix') or error['fix'].get('action') not in self.fixer.fix_handlers:
                print(f"\n{i+1}. {error['summary']}")
                print(f"   Type: {error['type']}")
                if error.get('module'):
                    print(f"   Module: {error['module']}")
                print(f"   Raw: {error['raw_message'][:100]}...")
    
    def report_failure_summary(self):
        """Report summary after max attempts reached"""
        print("\n" + "="*60)
        print("FIX ATTEMPTS EXHAUSTED")
        print("="*60)
        print(f"\nTried {len(self.fix_history)} fix attempts")
        
        total_fixes = sum(h['results']['fixes_successful'] for h in self.fix_history)
        print(f"Total fixes applied: {total_fixes}")
        
        print("\nManual intervention required to resolve remaining issues")
    
    def timestamp(self) -> str:
        """Get current timestamp"""
        return datetime.now().strftime('%H:%M:%S')

def main():
    """Main entry point"""
    # Parse command line arguments
    if len(sys.argv) < 3:
        print("Usage: python orchestrator.py <owner> <repo> [branch]")
        print("Example: python orchestrator.py BuildWithChris productivity-app downgrade-to-rn-073")
        return
    
    owner = sys.argv[1]
    repo = sys.argv[2]
    branch = sys.argv[3] if len(sys.argv) > 3 else None
    
    # Check for GitHub token
    if not os.environ.get('GITHUB_TOKEN'):
        print("Warning: GITHUB_TOKEN not set. API rate limits will apply.")
        print("Set it with: export GITHUB_TOKEN=your_token")
    
    # Start orchestrator
    orchestrator = BuildFixOrchestrator(owner, repo, branch)
    orchestrator.run_continuous(check_interval=120)

if __name__ == "__main__":
    main()