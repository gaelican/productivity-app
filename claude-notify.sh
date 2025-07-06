#!/bin/bash
# Claude Code CLI Notification Wrapper for Termux
# Provides real-time progress notifications

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NOTIFICATION_ID=42424
LOG_FILE="$HOME/.claude-notify.log"
QUIET_MODE=false

# Parse arguments
if [[ "$1" == "-q" ]] || [[ "$1" == "--quiet" ]]; then
    QUIET_MODE=true
    shift
fi

# Function to update notification
update_notification() {
    local title="$1"
    local content="$2"
    local ongoing="${3:-true}"
    
    if [[ "$ongoing" == "true" ]]; then
        termux-notification \
            --id "$NOTIFICATION_ID" \
            --title "$title" \
            --content "$content" \
            --priority high \
            --ongoing \
            --vibrate 0 \
            --action "view-log,View Log,termux-open $LOG_FILE"
    else
        termux-notification \
            --id "$NOTIFICATION_ID" \
            --title "$title" \
            --content "$content" \
            --priority default \
            --vibrate 200,100,200 \
            --sound
    fi
}

# Initialize
START_TIME=$(date +%s)
echo "[$(date)] Starting Claude session: $*" >> "$LOG_FILE"

# Initial notification
update_notification "Claude Code CLI" "🚀 Starting: $*" true

# Track statistics
FILES_READ=0
FILES_WRITTEN=0
COMMANDS_EXECUTED=0
CURRENT_PHASE="Initializing"

# Function to detect tool usage
detect_tool() {
    local line="$1"
    
    # Detect reading files
    if [[ "$line" =~ "Reading file:" ]] || [[ "$line" =~ "Read" ]]; then
        ((FILES_READ++))
        CURRENT_PHASE="📖 Reading files"
        return 0
    fi
    
    # Detect writing files
    if [[ "$line" =~ "Writing to:" ]] || [[ "$line" =~ "Created file:" ]] || [[ "$line" =~ "Edit" ]]; then
        ((FILES_WRITTEN++))
        CURRENT_PHASE="✏️ Writing files"
        return 0
    fi
    
    # Detect command execution
    if [[ "$line" =~ "Executing:" ]] || [[ "$line" =~ "Running:" ]] || [[ "$line" =~ "Bash" ]]; then
        ((COMMANDS_EXECUTED++))
        CURRENT_PHASE="🔧 Executing commands"
        return 0
    fi
    
    # Detect search operations
    if [[ "$line" =~ "Searching" ]] || [[ "$line" =~ "Grep" ]] || [[ "$line" =~ "Glob" ]]; then
        CURRENT_PHASE="🔍 Searching"
        return 0
    fi
    
    # Detect analysis
    if [[ "$line" =~ "Analyzing" ]] || [[ "$line" =~ "Task" ]]; then
        CURRENT_PHASE="🔬 Analyzing"
        return 0
    fi
    
    # Detect implementation
    if [[ "$line" =~ "Implementing" ]] || [[ "$line" =~ "Creating" ]]; then
        CURRENT_PHASE="💻 Implementing"
        return 0
    fi
    
    # Detect testing
    if [[ "$line" =~ "Testing" ]] || [[ "$line" =~ "Verifying" ]]; then
        CURRENT_PHASE="🧪 Testing"
        return 0
    fi
}

# Function to format elapsed time
format_time() {
    local seconds=$1
    local mins=$((seconds / 60))
    local secs=$((seconds % 60))
    printf "%02d:%02d" $mins $secs
}

# Run Claude and process output
claude "$@" 2>&1 | while IFS= read -r line; do
    # Log the line
    echo "$line" >> "$LOG_FILE"
    
    # Output to terminal if not in quiet mode
    if [[ "$QUIET_MODE" != "true" ]]; then
        echo "$line"
    fi
    
    # Detect tool usage
    detect_tool "$line"
    
    # Calculate elapsed time
    CURRENT_TIME=$(date +%s)
    ELAPSED=$((CURRENT_TIME - START_TIME))
    TIME_STR=$(format_time $ELAPSED)
    
    # Update notification with progress
    STATS="📊 R:$FILES_READ W:$FILES_WRITTEN C:$COMMANDS_EXECUTED"
    update_notification \
        "Claude: $CURRENT_PHASE" \
        "⏱️ $TIME_STR | $STATS" \
        true
done

# Capture exit status
EXIT_STATUS=$?

# Final statistics
END_TIME=$(date +%s)
TOTAL_TIME=$((END_TIME - START_TIME))
TOTAL_TIME_STR=$(format_time $TOTAL_TIME)

# Final notification
if [[ $EXIT_STATUS -eq 0 ]]; then
    FINAL_MSG="✅ Completed in $TOTAL_TIME_STR\n📊 Files: R:$FILES_READ W:$FILES_WRITTEN\n🔧 Commands: $COMMANDS_EXECUTED"
    update_notification "Claude Completed" "$FINAL_MSG" false
else
    FINAL_MSG="❌ Failed after $TOTAL_TIME_STR\n📊 Files: R:$FILES_READ W:$FILES_WRITTEN\n🔧 Commands: $COMMANDS_EXECUTED"
    update_notification "Claude Failed" "$FINAL_MSG" false
fi

# Log completion
echo "[$(date)] Completed with status $EXIT_STATUS" >> "$LOG_FILE"
echo "Total time: $TOTAL_TIME_STR" >> "$LOG_FILE"
echo "Files read: $FILES_READ, written: $FILES_WRITTEN" >> "$LOG_FILE"
echo "Commands executed: $COMMANDS_EXECUTED" >> "$LOG_FILE"
echo "----------------------------------------" >> "$LOG_FILE"

exit $EXIT_STATUS