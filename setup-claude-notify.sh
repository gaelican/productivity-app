#!/bin/bash
# Setup script for Claude Code CLI notifications in Termux

echo "🚀 Setting up Claude Code CLI Notifications for Termux"
echo "======================================================"

# Check if termux-api is installed
echo -n "Checking for termux-api... "
if ! command -v termux-notification &> /dev/null; then
    echo "❌ Not found"
    echo "Installing termux-api..."
    pkg update && pkg install termux-api -y
    
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install termux-api"
        echo "Please run: pkg install termux-api"
        exit 1
    fi
else
    echo "✅ Found"
fi

# Test notification permissions
echo -n "Testing notification permissions... "
termux-notification --id 99999 --title "Test" --content "Testing permissions" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ Working"
    sleep 1
    termux-notification-remove 99999 2>/dev/null
else
    echo "❌ Failed"
    echo "Please ensure Termux:API app is installed from F-Droid/Play Store"
    echo "and grant notification permissions to Termux:API"
    exit 1
fi

# Check if claude is installed
echo -n "Checking for Claude Code CLI... "
if ! command -v claude &> /dev/null; then
    echo "❌ Not found"
    echo "Please install Claude Code CLI first"
    exit 1
else
    echo "✅ Found"
fi

# Create bin directory if it doesn't exist
mkdir -p ~/bin

# Make scripts executable
echo "Making scripts executable..."
chmod +x claude-notify.sh

# Copy to bin directory
echo "Installing scripts to ~/bin..."
cp claude-notify.sh ~/bin/

# Add aliases to .bashrc
echo "Adding aliases..."
if ! grep -q "alias cn=" ~/.bashrc 2>/dev/null; then
    echo "" >> ~/.bashrc
    echo "# Claude notification aliases" >> ~/.bashrc
    echo "alias cn='~/bin/claude-notify.sh'" >> ~/.bashrc
    echo "Aliases added to ~/.bashrc"
else
    echo "Aliases already exist"
fi

# Create example usage file
cat > claude-notify-usage.txt << 'EOF'
Claude Code CLI Notification System - Usage Guide
================================================

Basic Usage:
-----------
# With notifications
~/bin/claude-notify.sh "implement user authentication"

# Using alias (after sourcing .bashrc)
cn "fix the bug in main.py"

# Quiet mode (no terminal output, only notifications)
cn -q "refactor the database layer"

Features:
---------
- Real-time progress tracking
- Persistent notifications showing current phase
- Statistics tracking (files read/written, commands executed)
- Time elapsed display
- Completion notifications with sound/vibration
- Log file at ~/.claude-notify.log

Notification Phases:
-------------------
🚀 Starting - Initial phase
📖 Reading files - Claude is reading files
✏️ Writing files - Claude is creating/editing files
🔧 Executing commands - Claude is running commands
🔍 Searching - Claude is searching for files/content
🔬 Analyzing - Claude is analyzing code
💻 Implementing - Claude is implementing features
🧪 Testing - Claude is running tests

Statistics:
-----------
R: Files read
W: Files written
C: Commands executed

Logs:
-----
View session logs: cat ~/.claude-notify.log
Clear logs: > ~/.claude-notify.log

Tips:
-----
1. The notification stays persistent during execution
2. Tap the notification to view the log file
3. Final notification includes total time and statistics
4. Exit status is preserved from Claude's execution
EOF

echo ""
echo "✅ Setup complete!"
echo ""
echo "To use the notification system:"
echo "1. Source your .bashrc: source ~/.bashrc"
echo "2. Run: cn \"your prompt here\""
echo ""
echo "Example: cn \"write a hello world program\""
echo ""
echo "See claude-notify-usage.txt for detailed usage"