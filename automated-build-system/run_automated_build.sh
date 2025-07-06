#!/bin/bash
# EAS Automated Build System - Main Entry Point
# Handles the complete build-fix-retry cycle automatically

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_PATH="$(dirname "$SCRIPT_DIR")"
MAX_RETRIES=${1:-5}
PYTHON_BIN="python3"

# Ensure Python is available
if ! command -v $PYTHON_BIN &> /dev/null; then
    echo -e "${RED}Python 3 is required but not found${NC}"
    exit 1
fi

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to check dependencies
check_dependencies() {
    print_status "$BLUE" "🔍 Checking dependencies..."
    
    # Check for EAS CLI
    if ! command -v eas &> /dev/null; then
        print_status "$RED" "❌ EAS CLI not found. Please install it with: npm install -g eas-cli"
        exit 1
    fi
    
    # Check for required Python packages
    $PYTHON_BIN -c "import json, subprocess, time, re, os, sys, logging, pathlib" 2>/dev/null
    if [ $? -ne 0 ]; then
        print_status "$RED" "❌ Required Python modules not found"
        exit 1
    fi
    
    # Check for notification script
    if [ -f "$PROJECT_PATH/claude-notify.sh" ]; then
        print_status "$GREEN" "✓ Notification system found"
    else
        print_status "$YELLOW" "⚠ Notification system not found (optional)"
    fi
    
    print_status "$GREEN" "✓ All dependencies satisfied"
}

# Function to setup environment
setup_environment() {
    print_status "$BLUE" "🔧 Setting up environment..."
    
    # Create logs directory
    mkdir -p "$SCRIPT_DIR/logs"
    
    # Make Python scripts executable
    chmod +x "$SCRIPT_DIR"/*.py
    
    # Check EAS authentication
    eas whoami &>/dev/null
    if [ $? -ne 0 ]; then
        print_status "$YELLOW" "⚠ Not logged in to EAS. Running 'eas login'..."
        eas login
    fi
    
    print_status "$GREEN" "✓ Environment ready"
}

# Function to run build monitor in background
start_monitor() {
    if [ -f "$SCRIPT_DIR/build_monitor.py" ]; then
        print_status "$BLUE" "📊 Starting build monitor in new terminal..."
        
        # Try to open in new terminal based on environment
        if [ -n "$TERMUX_VERSION" ]; then
            # Termux environment
            termux-open-url "termux://com.termux/execute?command=$PYTHON_BIN%20$SCRIPT_DIR/build_monitor.py%20$PROJECT_PATH"
        elif command -v gnome-terminal &> /dev/null; then
            # GNOME Terminal
            gnome-terminal -- $PYTHON_BIN "$SCRIPT_DIR/build_monitor.py" "$PROJECT_PATH"
        elif command -v xterm &> /dev/null; then
            # XTerm
            xterm -e "$PYTHON_BIN '$SCRIPT_DIR/build_monitor.py' '$PROJECT_PATH'" &
        else
            print_status "$YELLOW" "⚠ Could not open monitor in new terminal"
            print_status "$YELLOW" "  Run manually: $PYTHON_BIN $SCRIPT_DIR/build_monitor.py $PROJECT_PATH"
        fi
    fi
}

# Function to send notification
notify() {
    local title="$1"
    local message="$2"
    
    if [ -f "$PROJECT_PATH/claude-notify.sh" ]; then
        "$PROJECT_PATH/claude-notify.sh" -q "echo '🤖 $title: $message'" &>/dev/null
    fi
}

# Main execution
main() {
    clear
    print_status "$BLUE" "╔══════════════════════════════════════════╗"
    print_status "$BLUE" "║    EAS AUTOMATED BUILD SYSTEM v1.0       ║"
    print_status "$BLUE" "╚══════════════════════════════════════════╝"
    echo ""
    
    print_status "$YELLOW" "Project: $PROJECT_PATH"
    print_status "$YELLOW" "Max Retries: $MAX_RETRIES"
    echo ""
    
    # Check dependencies
    check_dependencies
    echo ""
    
    # Setup environment
    setup_environment
    echo ""
    
    # Offer to start monitor
    read -p "Start build monitor in new terminal? (y/N) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        start_monitor
        sleep 2  # Give monitor time to start
    fi
    
    # Run pre-build verification
    if [ -f "$PROJECT_PATH/verify-build-config.sh" ]; then
        print_status "$BLUE" "🔍 Running pre-build verification..."
        "$PROJECT_PATH/verify-build-config.sh"
        echo ""
    fi
    
    # Confirm before starting
    print_status "$YELLOW" "⚠️  This will start an automated build process that may:"
    print_status "$YELLOW" "   - Start multiple EAS builds"
    print_status "$YELLOW" "   - Automatically modify project files"
    print_status "$YELLOW" "   - Apply fixes based on error patterns"
    echo ""
    read -p "Continue with automated build? (y/N) " -n 1 -r
    echo ""
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "$RED" "❌ Build cancelled by user"
        exit 0
    fi
    
    # Start automation
    print_status "$GREEN" "🚀 Starting automated build process..."
    notify "Build Automation" "Starting automated build process"
    
    # Run the Python automation script
    $PYTHON_BIN "$SCRIPT_DIR/build_automation.py" "$PROJECT_PATH" "$MAX_RETRIES"
    EXIT_CODE=$?
    
    # Handle results
    if [ $EXIT_CODE -eq 0 ]; then
        print_status "$GREEN" "✅ BUILD SUCCESSFUL!"
        notify "Build Success" "Automated build completed successfully"
        
        # Show report location
        if [ -f "$PROJECT_PATH/build_automation_report.md" ]; then
            print_status "$BLUE" "📄 Report saved to: build_automation_report.md"
            echo ""
            
            # Offer to view report
            read -p "View build report? (Y/n) " -n 1 -r
            echo ""
            if [[ ! $REPLY =~ ^[Nn]$ ]]; then
                cat "$PROJECT_PATH/build_automation_report.md"
            fi
        fi
    else
        print_status "$RED" "❌ BUILD FAILED"
        notify "Build Failed" "Automated build failed after retries"
        
        # Show report if exists
        if [ -f "$PROJECT_PATH/build_automation_report.md" ]; then
            print_status "$YELLOW" "📄 Check build_automation_report.md for details"
        fi
    fi
    
    echo ""
    print_status "$BLUE" "📊 Check build_automation.log for detailed logs"
}

# Run main function
main