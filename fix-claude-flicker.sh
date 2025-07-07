#!/bin/bash
# Fix Claude Code CLI scrolling/flicker in Termux

echo "🔧 Fixing Claude Code CLI Scrolling/Flicker in Termux"
echo "===================================================="
echo ""

# Solution 1: Terminal Settings
echo "📱 Solution 1: Adjust Termux Settings"
echo "------------------------------------"
echo "1. Long press on Termux screen"
echo "2. Select 'More' → 'Style' → 'Font'"
echo "3. Try a different font or size"
echo "4. Disable 'Terminal toolbar' if enabled"
echo ""

# Solution 2: Environment Variables
echo "🔧 Solution 2: Set Environment Variables"
echo "---------------------------------------"
echo "Add these to ~/.bashrc or ~/.profile:"
echo ""
echo "# Disable terminal capabilities that cause flicker"
echo "export TERM=xterm-256color"
echo "export COLUMNS=80"
echo "export LINES=24"
echo "export CLAUDE_NO_ANIMATIONS=1"
echo "export NO_COLOR=1"
echo ""

# Solution 3: Use tmux
echo "📦 Solution 3: Use tmux (Recommended)"
echo "------------------------------------"
echo "pkg install tmux"
echo ""
echo "# Create tmux config to prevent resize issues"
cat << 'EOF' > ~/.tmux.conf.claude
# Prevent automatic window renaming
set-option -g allow-rename off

# Set fixed window size
set -g aggressive-resize off

# Disable status bar updates
set -g status-interval 0

# Fix escape time
set -sg escape-time 0

# Better scrolling
set -g mouse on
EOF
echo ""
echo "# Start Claude in tmux:"
echo "tmux -f ~/.tmux.conf.claude new-session -s claude 'claude'"
echo ""

# Solution 4: Wrapper Script
echo "📜 Solution 4: Create a Wrapper Script"
echo "-------------------------------------"
cat << 'EOF' > ~/claude-stable
#!/bin/bash
# Claude wrapper with stable display

# Set fixed terminal size
stty rows 24 cols 80 2>/dev/null

# Disable dynamic resizing
export COLUMNS=80
export LINES=24

# Reduce flicker
export TERM=xterm
export NO_COLOR=1

# Clear screen before starting
clear

# Run Claude with output buffering
claude "$@" 2>&1 | less -R +F
EOF

chmod +x ~/claude-stable
echo "Created ~/claude-stable wrapper"
echo "Use: ~/claude-stable instead of claude"
echo ""

# Solution 5: Alternative Interfaces
echo "🌐 Solution 5: Alternative Interfaces"
echo "------------------------------------"
echo "1. Use Claude.ai in Termux browser:"
echo "   pkg install firefox"
echo "   firefox https://claude.ai"
echo ""
echo "2. Use Termux:Widget for quick access:"
echo "   - Install Termux:Widget from F-Droid"
echo "   - Create shortcuts for common commands"
echo ""

# Solution 6: Report Issue
echo "🐛 Solution 6: Report the Issue"
echo "------------------------------"
echo "Report to: https://github.com/anthropics/claude-code/issues"
echo ""
echo "Include:"
echo "- Termux version: $(termux-info | grep VERSION)"
echo "- Terminal: $TERM"
echo "- Screen size: ${COLUMNS}x${LINES}"
echo "- Claude version: $(claude --version 2>/dev/null || echo 'unknown')"
echo ""

# Apply Quick Fix
echo "⚡ Quick Fix (Apply Now)"
echo "----------------------"
echo "Running quick fixes..."
echo ""

# Create enhanced wrapper
cat << 'EOF' > ~/bin/claude-termux
#!/bin/bash
# Enhanced Claude wrapper for Termux

# Prevent terminal resizing
trap '' SIGWINCH

# Set stable environment
export TERM=xterm
export COLUMNS=80
export LINES=24
export NO_COLOR=1

# Buffer output to prevent flicker
BUFFER_FILE=$(mktemp)
trap "rm -f $BUFFER_FILE" EXIT

# Run Claude with output capture
if [ -t 1 ]; then
    # Interactive mode
    script -q -c "claude $*" $BUFFER_FILE
    less -R $BUFFER_FILE
else
    # Non-interactive mode
    claude "$@"
fi
EOF

# Make it executable
mkdir -p ~/bin
chmod +x ~/bin/claude-termux

echo "✅ Created ~/bin/claude-termux"
echo ""
echo "🎯 Recommended Setup:"
echo "-------------------"
echo "1. Add to ~/.bashrc:"
echo "   alias claude='~/bin/claude-termux'"
echo "   export PATH=~/bin:$PATH"
echo ""
echo "2. Reload shell:"
echo "   source ~/.bashrc"
echo ""
echo "3. Use tmux for best results:"
echo "   tmux new -s claude"
echo "   claude"
echo ""