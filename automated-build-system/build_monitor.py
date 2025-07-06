#!/usr/bin/env python3
"""
EAS Build Monitor Dashboard
Real-time monitoring of automated build process
"""

import json
import time
import os
import sys
from datetime import datetime
from pathlib import Path
import subprocess
import curses
from typing import Dict, List, Optional

class BuildMonitor:
    """Real-time build monitoring dashboard"""
    
    def __init__(self, project_path: str):
        self.project_path = Path(project_path)
        self.history_file = self.project_path / "build_automation_history.json"
        self.log_file = self.project_path / "build_automation.log"
        self.current_build_id = None
        self.refresh_interval = 5  # seconds
        
    def load_build_history(self) -> Dict:
        """Load build history from file"""
        if self.history_file.exists():
            with open(self.history_file, 'r') as f:
                return json.load(f)
        return {"total_attempts": 0, "applied_fixes": [], "builds": []}
    
    def get_latest_build_status(self) -> Optional[Dict]:
        """Get status of the latest EAS build"""
        try:
            result = subprocess.run(
                ["eas", "build:list", "--platform", "android", "--limit", "1", "--json"],
                cwd=self.project_path,
                capture_output=True,
                text=True
            )
            
            if result.returncode == 0:
                builds = json.loads(result.stdout)
                if builds and len(builds) > 0:
                    return builds[0]
        except Exception as e:
            pass
        
        return None
    
    def get_log_tail(self, lines: int = 10) -> List[str]:
        """Get last N lines from automation log"""
        if self.log_file.exists():
            try:
                result = subprocess.run(
                    ["tail", f"-{lines}", str(self.log_file)],
                    capture_output=True,
                    text=True
                )
                return result.stdout.strip().split('\n')
            except:
                pass
        return []
    
    def format_duration(self, seconds: int) -> str:
        """Format duration in human-readable format"""
        hours = seconds // 3600
        minutes = (seconds % 3600) // 60
        secs = seconds % 60
        
        if hours > 0:
            return f"{hours}h {minutes}m {secs}s"
        elif minutes > 0:
            return f"{minutes}m {secs}s"
        else:
            return f"{secs}s"
    
    def draw_dashboard(self, stdscr):
        """Draw the monitoring dashboard"""
        curses.curs_set(0)  # Hide cursor
        stdscr.nodelay(1)   # Non-blocking input
        
        # Colors
        curses.init_pair(1, curses.COLOR_GREEN, curses.COLOR_BLACK)
        curses.init_pair(2, curses.COLOR_RED, curses.COLOR_BLACK)
        curses.init_pair(3, curses.COLOR_YELLOW, curses.COLOR_BLACK)
        curses.init_pair(4, curses.COLOR_CYAN, curses.COLOR_BLACK)
        
        while True:
            try:
                stdscr.clear()
                height, width = stdscr.getmaxyx()
                
                # Header
                header = "🤖 EAS BUILD AUTOMATION MONITOR 🤖"
                stdscr.addstr(0, (width - len(header)) // 2, header, curses.A_BOLD)
                stdscr.addstr(1, 0, "=" * width)
                
                # Load data
                history = self.load_build_history()
                latest_build = self.get_latest_build_status()
                log_lines = self.get_log_tail(height - 20)
                
                row = 3
                
                # Build Statistics
                stdscr.addstr(row, 2, "BUILD STATISTICS", curses.A_BOLD | curses.color_pair(4))
                row += 1
                stdscr.addstr(row, 4, f"Total Attempts: {history['total_attempts']}")
                row += 1
                stdscr.addstr(row, 4, f"Fixes Applied: {len(history['applied_fixes'])}")
                row += 2
                
                # Current Build Status
                if latest_build:
                    stdscr.addstr(row, 2, "CURRENT BUILD", curses.A_BOLD | curses.color_pair(4))
                    row += 1
                    
                    status = latest_build.get('status', 'unknown')
                    status_color = curses.color_pair(1) if status == 'finished' else \
                                  curses.color_pair(2) if status == 'errored' else \
                                  curses.color_pair(3)
                    
                    stdscr.addstr(row, 4, f"ID: {latest_build.get('id', 'N/A')}")
                    row += 1
                    stdscr.addstr(row, 4, f"Status: ", curses.A_NORMAL)
                    stdscr.addstr(row, 12, status.upper(), status_color | curses.A_BOLD)
                    row += 1
                    
                    # Build time
                    created_at = latest_build.get('createdAt')
                    if created_at:
                        created_time = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                        duration = (datetime.now(created_time.tzinfo) - created_time).total_seconds()
                        stdscr.addstr(row, 4, f"Duration: {self.format_duration(int(duration))}")
                        row += 1
                    
                    # Platform and profile
                    stdscr.addstr(row, 4, f"Platform: {latest_build.get('platform', 'N/A')}")
                    row += 1
                    stdscr.addstr(row, 4, f"Profile: {latest_build.get('buildProfile', 'N/A')}")
                    row += 2
                
                # Applied Fixes
                if history['applied_fixes']:
                    stdscr.addstr(row, 2, "APPLIED FIXES", curses.A_BOLD | curses.color_pair(4))
                    row += 1
                    for i, fix in enumerate(history['applied_fixes'][-5:]):  # Show last 5
                        stdscr.addstr(row, 4, f"✓ {fix}", curses.color_pair(1))
                        row += 1
                    row += 1
                
                # Recent Log Activity
                if row < height - 5:
                    stdscr.addstr(row, 2, "RECENT ACTIVITY", curses.A_BOLD | curses.color_pair(4))
                    row += 1
                    
                    for line in log_lines[-(height - row - 2):]:
                        if row < height - 2:
                            # Color code log lines
                            color = curses.A_NORMAL
                            if "ERROR" in line:
                                color = curses.color_pair(2)
                            elif "WARNING" in line:
                                color = curses.color_pair(3)
                            elif "INFO" in line:
                                color = curses.color_pair(4)
                            elif "Fix applied" in line:
                                color = curses.color_pair(1)
                            
                            # Truncate line if too long
                            if len(line) > width - 5:
                                line = line[:width - 8] + "..."
                            
                            stdscr.addstr(row, 4, line, color)
                            row += 1
                
                # Footer
                footer = f"Last Update: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} | Press 'q' to quit | Refresh: {self.refresh_interval}s"
                stdscr.addstr(height - 1, 2, footer, curses.A_DIM)
                
                stdscr.refresh()
                
                # Check for quit
                key = stdscr.getch()
                if key == ord('q') or key == ord('Q'):
                    break
                
                time.sleep(self.refresh_interval)
                
            except KeyboardInterrupt:
                break
            except Exception as e:
                # Handle resize and other errors gracefully
                time.sleep(1)
    
    def run(self):
        """Run the monitoring dashboard"""
        try:
            curses.wrapper(self.draw_dashboard)
        except KeyboardInterrupt:
            print("\nMonitoring stopped.")


def main():
    """Main entry point"""
    if len(sys.argv) < 2:
        print("Usage: python build_monitor.py <project_path>")
        sys.exit(1)
    
    project_path = sys.argv[1]
    monitor = BuildMonitor(project_path)
    monitor.run()


if __name__ == "__main__":
    main()