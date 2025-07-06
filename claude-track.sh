#!/data/data/com.termux/files/usr/bin/bash

# claude-track.sh - Advanced Claude CLI tracker with detailed progress notifications
# Features: Real-time progress, tool tracking, time estimation, interactive actions

# === Configuration ===
readonly NOTIFICATION_ID="claude-track"
readonly LOG_DIR="$HOME/.claude-track"
readonly SESSION_LOG="$LOG_DIR/session-$(date +%Y%m%d-%H%M%S).log"
readonly STATS_FILE="$LOG_DIR/stats.json"
readonly FIFO_PATH="/tmp/claude-track-$$"

# Ensure log directory exists
mkdir -p "$LOG_DIR"

# === State Variables ===
declare -A tool_stats=(
    [read_count]=0
    [write_count]=0
    [exec_count]=0
    [search_count]=0
    [total_operations]=0
)

START_TIME=$(date +%s)
CURRENT_PHASE="initializing"
PROMPT_TEXT=""

# === Cleanup Function ===
cleanup() {
    termux-notification-remove "$NOTIFICATION_ID" 2>/dev/null || true
    rm -f "$FIFO_PATH"
    
    # Save session stats
    save_stats
}
trap cleanup EXIT INT TERM

# === Helper Functions ===

# Calculate elapsed time string
get_elapsed_time() {
    local elapsed=$(($(date +%s) - START_TIME))
    printf '%02d:%02d' $((elapsed/60)) $((elapsed%60))
}

# Estimate completion percentage based on typical operation flow
estimate_progress() {
    local phase="$1"
    case "$phase" in
        "initializing") echo 5 ;;
        "planning") echo 15 ;;
        "reading") echo 25 ;;
        "analyzing") echo 40 ;;
        "implementing") echo 60 ;;
        "writing") echo 75 ;;
        "testing") echo 85 ;;
        "finalizing") echo 95 ;;
        "complete") echo 100 ;;
        *) echo 50 ;;
    esac
}

# Update notification with rich content
update_notification() {
    local title="$1"
    local content="$2"
    local progress="${3:-}"
    local priority="${4:-high}"
    local action_label="${5:-}"
    local action_cmd="${6:-}"
    
    local time_str=$(get_elapsed_time)
    
    # Build notification command
    local cmd=(termux-notification --id "$NOTIFICATION_ID")
    cmd+=(--title "$title [$time_str]")
    cmd+=(--content "$content")
    cmd+=(--ongoing)
    cmd+=(--priority "$priority")
    
    # Add progress bar if specified
    if [[ -n "$progress" ]]; then
        cmd+=(--progress-max 100)
        cmd+=(--progress "$progress")
    fi
    
    # Add action button if specified
    if [[ -n "$action_label" ]] && [[ -n "$action_cmd" ]]; then
        cmd+=(--button1 "$action_label")
        cmd+=(--button1-action "$action_cmd")
    fi
    
    # Execute notification
    "${cmd[@]}" 2>/dev/null || true
}

# Log with timestamp
log_event() {
    local event_type="$1"
    local details="$2"
    echo "$(date '+%Y-%m-%d %H:%M:%S') [$event_type] $details" >> "$SESSION_LOG"
}

# Save statistics
save_stats() {
    local duration=$(($(date +%s) - START_TIME))
    
    cat > "$STATS_FILE" << EOF
{
    "session": {
        "timestamp": "$(date -Iseconds)",
        "duration_seconds": $duration,
        "prompt": "$PROMPT_TEXT",
        "operations": {
            "files_read": ${tool_stats[read_count]},
            "files_written": ${tool_stats[write_count]},
            "commands_executed": ${tool_stats[exec_count]},
            "searches_performed": ${tool_stats[search_count]},
            "total": ${tool_stats[total_operations]}
        }
    }
}
EOF
}

# === Notification Processing Engine ===

# Background notification processor
start_notification_processor() {
    (
        while true; do
            if read -r cmd < "$FIFO_PATH"; then
                case "$cmd" in
                    "EXIT") break ;;
                    "PHASE:"*)
                        local phase="${cmd#PHASE:}"
                        CURRENT_PHASE="$phase"
                        local progress=$(estimate_progress "$phase")
                        
                        case "$phase" in
                            "planning")
                                update_notification "Claude Planning" "📋 Analyzing your request..." "$progress"
                                ;;
                            "reading")
                                update_notification "Claude Reading" "📖 Examining files..." "$progress"
                                ;;
                            "analyzing")
                                update_notification "Claude Analyzing" "🔬 Understanding code structure..." "$progress"
                                ;;
                            "implementing")
                                update_notification "Claude Coding" "💻 Writing implementation..." "$progress"
                                ;;
                            "testing")
                                update_notification "Claude Testing" "🧪 Verifying changes..." "$progress"
                                ;;
                            "complete")
                                update_notification "Claude Done" "✅ Task completed!" 100 "default" "View Log" "termux-open $SESSION_LOG"
                                ;;
                        esac
                        ;;
                    "TOOL:"*)
                        IFS='|' read -r tool details <<< "${cmd#TOOL:}"
                        tool_stats[total_operations]=$((tool_stats[total_operations] + 1))
                        
                        case "$tool" in
                            "read")
                                tool_stats[read_count]=$((tool_stats[read_count] + 1))
                                update_notification "Claude Reading" "📖 File ${tool_stats[read_count]}: $details" 
                                ;;
                            "write")
                                tool_stats[write_count]=$((tool_stats[write_count] + 1))
                                update_notification "Claude Writing" "✏️ Creating: $details"
                                ;;
                            "exec")
                                tool_stats[exec_count]=$((tool_stats[exec_count] + 1))
                                update_notification "Claude Executing" "🔧 Command ${tool_stats[exec_count]}: $details"
                                ;;
                            "search")
                                tool_stats[search_count]=$((tool_stats[search_count] + 1))
                                update_notification "Claude Searching" "🔍 Pattern: $details"
                                ;;
                        esac
                        ;;
                    "ERROR:"*)
                        local error="${cmd#ERROR:}"
                        update_notification "Claude Error" "⚠️ $error" "" "max"
                        ;;
                    "INFO:"*)
                        local info="${cmd#INFO:}"
                        update_notification "Claude Info" "ℹ️ $info"
                        ;;
                esac
            fi
        done
    ) &
    PROCESSOR_PID=$!
}

# === Output Parser ===

parse_claude_output() {
    local in_code_block=false
    local context_buffer=()
    local max_buffer_size=5
    
    while IFS= read -r line; do
        # Pass through output
        echo "$line"
        
        # Log the line
        log_event "OUTPUT" "$line"
        
        # Maintain context buffer
        context_buffer+=("$line")
        if [[ ${#context_buffer[@]} -gt $max_buffer_size ]]; then
            context_buffer=("${context_buffer[@]:1}")
        fi
        
        # Detect code blocks
        if [[ "$line" =~ ^\`\`\` ]]; then
            in_code_block=$((1 - in_code_block))
            continue
        fi
        
        # Skip parsing inside code blocks
        if [[ $in_code_block -eq 1 ]]; then
            continue
        fi
        
        # Phase detection based on Claude's language patterns
        if [[ "$line" =~ "I'll "|"Let me "|"I will "|"First, "|"I need to " ]]; then
            echo "PHASE:planning" > "$FIFO_PATH"
        elif [[ "$line" =~ "understand"|"analyze"|"examine"|"look at"|"check" ]]; then
            echo "PHASE:analyzing" > "$FIFO_PATH"
        elif [[ "$line" =~ "implement"|"create"|"add"|"write"|"modify" ]]; then
            echo "PHASE:implementing" > "$FIFO_PATH"
        elif [[ "$line" =~ "test"|"verify"|"ensure"|"confirm" ]]; then
            echo "PHASE:testing" > "$FIFO_PATH"
        fi
        
        # Tool usage detection with enhanced patterns
        if [[ "$line" =~ "Reading file:"|"Opening:"|"Viewing:"|"Checking:" ]]; then
            local file_path="${line#*: }"
            file_path="${file_path// /}"
            file_path="${file_path##*/}"  # Get just filename
            echo "TOOL:read|$file_path" > "$FIFO_PATH"
            echo "PHASE:reading" > "$FIFO_PATH"
            
        elif [[ "$line" =~ "Writing to:"|"Creating:"|"Saving:"|"Updating:" ]]; then
            local file_path="${line#*: }"
            file_path="${file_path// /}"
            file_path="${file_path##*/}"
            echo "TOOL:write|$file_path" > "$FIFO_PATH"
            echo "PHASE:writing" > "$FIFO_PATH"
            
        elif [[ "$line" =~ "Executing:"|"Running:"|"$>" ]]; then
            local cmd="${line#*: }"
            cmd="${cmd#*> }"
            cmd="${cmd:0:30}..."  # Truncate long commands
            echo "TOOL:exec|$cmd" > "$FIFO_PATH"
            
        elif [[ "$line" =~ "Searching for:"|"Looking for:"|"Finding:" ]]; then
            local pattern="${line#*: }"
            pattern="${pattern:0:20}..."
            echo "TOOL:search|$pattern" > "$FIFO_PATH"
            
        elif [[ "$line" =~ "Error:"|"Failed:"|"failure"|"cannot" ]]; then
            echo "ERROR:Issue detected - check output" > "$FIFO_PATH"
            
        elif [[ "$line" =~ "Success"|"Complete"|"Done"|"Finished" ]]; then
            echo "PHASE:complete" > "$FIFO_PATH"
        fi
        
        # Detect specific file types being processed
        if [[ "$line" =~ \.(js|ts|jsx|tsx) ]]; then
            echo "INFO:Working with JavaScript/TypeScript" > "$FIFO_PATH"
        elif [[ "$line" =~ \.(py|python) ]]; then
            echo "INFO:Working with Python" > "$FIFO_PATH"
        elif [[ "$line" =~ \.(java|kt|kotlin) ]]; then
            echo "INFO:Working with Java/Kotlin" > "$FIFO_PATH"
        fi
    done
}

# === Main Script ===

# Show help
if [[ "$1" == "-h" ]] || [[ "$1" == "--help" ]]; then
    echo "claude-track - Advanced Claude CLI progress tracker"
    echo ""
    echo "Usage: claude-track [options] <prompt>"
    echo ""
    echo "Options:"
    echo "  -h, --help       Show this help"
    echo "  -s, --stats      Show statistics from last session"
    echo "  -l, --logs       Open logs directory"
    echo "  --clear-logs     Clear all logs"
    echo ""
    echo "Features:"
    echo "  • Real-time progress notifications"
    echo "  • Tool usage tracking"
    echo "  • Session statistics"
    echo "  • Interactive notification actions"
    echo ""
    exit 0
fi

# Handle special commands
case "$1" in
    -s|--stats)
        if [[ -f "$STATS_FILE" ]]; then
            cat "$STATS_FILE" | jq '.' 2>/dev/null || cat "$STATS_FILE"
        else
            echo "No statistics available"
        fi
        exit 0
        ;;
    -l|--logs)
        termux-open "$LOG_DIR"
        exit 0
        ;;
    --clear-logs)
        rm -rf "$LOG_DIR"/*
        echo "Logs cleared"
        exit 0
        ;;
esac

# Check if claude is installed
if ! command -v claude &> /dev/null; then
    echo "Error: Claude CLI is not installed" >&2
    echo "Visit: https://docs.anthropic.com/en/docs/claude-code/cli-usage" >&2
    exit 1
fi

# Capture prompt
PROMPT_TEXT="$*"
if [[ -z "$PROMPT_TEXT" ]]; then
    echo "Error: No prompt provided" >&2
    echo "Usage: claude-track <prompt>" >&2
    exit 1
fi

# Initialize
mkfifo "$FIFO_PATH"
start_notification_processor

# Log session start
log_event "SESSION" "Started with prompt: $PROMPT_TEXT"

# Initial notification
echo "PHASE:initializing" > "$FIFO_PATH"
update_notification "Claude Starting" "🚀 ${PROMPT_TEXT:0:40}..." 5

# Run Claude with output parsing
claude "$@" 2>&1 | parse_claude_output
exit_code=${PIPESTATUS[0]}

# Signal completion
echo "PHASE:complete" > "$FIFO_PATH"
sleep 1
echo "EXIT" > "$FIFO_PATH"
wait $PROCESSOR_PID 2>/dev/null || true

# Show final notification
if [[ $exit_code -eq 0 ]]; then
    termux-notification \
        --title "Claude Complete ✅" \
        --content "Task finished: ${PROMPT_TEXT:0:40}..." \
        --vibrate 200 \
        --button1 "View Stats" \
        --button1-action "termux-open $STATS_FILE" \
        --button2 "View Log" \
        --button2-action "termux-open $SESSION_LOG"
else
    termux-notification \
        --title "Claude Error ❌" \
        --content "Task failed: ${PROMPT_TEXT:0:40}..." \
        --vibrate 500 \
        --priority max \
        --button1 "View Log" \
        --button1-action "termux-open $SESSION_LOG"
fi

# Log session end
log_event "SESSION" "Ended with exit code: $exit_code"

exit $exit_code