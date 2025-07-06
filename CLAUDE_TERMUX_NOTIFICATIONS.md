# Persistent Notifications for Claude Code CLI in Termux

## Overview

This document analyzes how to implement persistent notifications for Claude Code CLI within Termux that actively show progress and what Claude is working on for each prompt.

## Architecture Analysis

### 1. Termux Notification Capabilities

Termux provides robust notification support through the `termux-api` package:

```bash
# Create a notification
termux-notification --title "Claude Code" --content "Processing your request..."

# Update notification with ID
termux-notification --id claude-progress --title "Claude Code" --content "Analyzing code structure..."

# Persistent notification with progress
termux-notification --id claude-progress \
  --title "Claude Code" \
  --content "Working on: Implementing user authentication" \
  --ongoing \
  --priority high

# Clear notification
termux-notification-remove claude-progress
```

Key features:
- **Persistent notifications**: Using `--ongoing` flag
- **Updatable content**: Using consistent `--id`
- **Priority levels**: low, default, high, max
- **Actions**: Can add buttons for user interaction
- **Progress bar**: Can show progress percentage

### 2. Claude Code CLI Integration Points

Based on the CLI structure, we need to intercept several key points:

1. **Request initiation**: When user sends a prompt
2. **Tool execution**: When Claude uses tools (read, write, bash, etc.)
3. **Thinking/processing**: During Claude's response generation
4. **Completion**: When response is ready

### 3. Implementation Approaches

#### Approach 1: Wrapper Script (Recommended)

Create a wrapper around the Claude CLI that manages notifications:

```bash
#!/data/data/com.termux/files/usr/bin/bash

# claude-notify.sh - Claude CLI with notification support

NOTIFICATION_ID="claude-progress"
START_TIME=$(date +%s)

# Function to update notification
update_notification() {
    local title="$1"
    local content="$2"
    local progress="${3:-}"
    
    local elapsed=$(($(date +%s) - START_TIME))
    local time_str=$(printf '%02d:%02d' $((elapsed/60)) $((elapsed%60)))
    
    if [[ -n "$progress" ]]; then
        termux-notification --id "$NOTIFICATION_ID" \
            --title "$title [$time_str]" \
            --content "$content" \
            --ongoing \
            --priority high \
            --progress-max 100 \
            --progress "$progress"
    else
        termux-notification --id "$NOTIFICATION_ID" \
            --title "$title [$time_str]" \
            --content "$content" \
            --ongoing \
            --priority high
    fi
}

# Function to parse Claude's output and extract status
parse_claude_output() {
    while IFS= read -r line; do
        echo "$line"  # Pass through output
        
        # Detect tool usage patterns
        if [[ "$line" =~ "Reading file:" ]]; then
            update_notification "Claude Code" "📖 Reading: ${line#*Reading file: }"
        elif [[ "$line" =~ "Writing to:" ]]; then
            update_notification "Claude Code" "✏️ Writing: ${line#*Writing to: }"
        elif [[ "$line" =~ "Executing:" ]]; then
            update_notification "Claude Code" "🔧 Executing: ${line#*Executing: }"
        elif [[ "$line" =~ "Analyzing" ]]; then
            update_notification "Claude Code" "🔍 Analyzing code..."
        elif [[ "$line" =~ "Thinking" ]]; then
            update_notification "Claude Code" "🤔 Thinking..."
        fi
    done
}

# Initial notification
update_notification "Claude Code" "🚀 Starting Claude..." 

# Capture the prompt
PROMPT="$*"
update_notification "Claude Code" "📝 Processing: ${PROMPT:0:50}..."

# Run Claude with output parsing
claude "$@" 2>&1 | parse_claude_output

# Clear notification on completion
termux-notification-remove "$NOTIFICATION_ID"

# Show completion notification
termux-notification --title "Claude Code Complete" \
    --content "Task finished: ${PROMPT:0:50}..." \
    --vibrate 200 \
    --action "VIEW,termux-open-url"
```

#### Approach 2: Node.js Middleware

Modify Claude CLI's Node.js code to emit progress events:

```javascript
// notification-manager.js
const { exec } = require('child_process');

class TermuxNotificationManager {
    constructor() {
        this.notificationId = 'claude-progress';
        this.startTime = Date.now();
    }

    update(title, content, progress = null) {
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        const timeStr = `${Math.floor(elapsed/60).toString().padStart(2,'0')}:${(elapsed%60).toString().padStart(2,'0')}`;
        
        let cmd = `termux-notification --id "${this.notificationId}" `;
        cmd += `--title "${title} [${timeStr}]" `;
        cmd += `--content "${content}" `;
        cmd += `--ongoing --priority high`;
        
        if (progress !== null) {
            cmd += ` --progress-max 100 --progress ${progress}`;
        }
        
        exec(cmd, (error) => {
            if (error) console.error('Notification error:', error);
        });
    }

    updateToolUsage(toolName, details) {
        const icons = {
            'read': '📖',
            'write': '✏️',
            'bash': '🔧',
            'grep': '🔍',
            'edit': '📝'
        };
        
        const icon = icons[toolName] || '⚡';
        this.update('Claude Code', `${icon} ${toolName}: ${details}`);
    }

    clear() {
        exec(`termux-notification-remove ${this.notificationId}`);
    }
}

// Integration in Claude CLI
const notificationManager = new TermuxNotificationManager();

// Hook into tool execution
async function executeToolWithNotification(tool, args) {
    notificationManager.updateToolUsage(tool.name, args.summary || 'Processing...');
    const result = await tool.execute(args);
    return result;
}
```

#### Approach 3: MCP Server Integration

Enhance the zen-mcp-server to send notifications:

```python
# termux_notifications.py
import subprocess
import time
from typing import Optional

class TermuxNotificationManager:
    def __init__(self):
        self.notification_id = "claude-mcp"
        self.start_time = time.time()
        
    def update(self, title: str, content: str, progress: Optional[int] = None):
        """Update persistent notification"""
        elapsed = int(time.time() - self.start_time)
        time_str = f"{elapsed//60:02d}:{elapsed%60:02d}"
        
        cmd = [
            "termux-notification",
            "--id", self.notification_id,
            "--title", f"{title} [{time_str}]",
            "--content", content,
            "--ongoing",
            "--priority", "high"
        ]
        
        if progress is not None:
            cmd.extend(["--progress-max", "100", "--progress", str(progress)])
            
        try:
            subprocess.run(cmd, check=True)
        except subprocess.CalledProcessError:
            pass  # Fail silently if termux-notification not available
            
    def update_tool_status(self, tool_name: str, status: str):
        """Update notification for tool execution"""
        icons = {
            'analyze': '🔍',
            'chat': '💬',
            'codereview': '📋',
            'debug': '🐛',
            'thinkdeep': '🤔',
            'refactor': '🔧',
            'planner': '📅'
        }
        
        icon = icons.get(tool_name, '⚡')
        self.update("Zen MCP", f"{icon} {tool_name}: {status}")
        
    def clear(self):
        """Remove notification"""
        subprocess.run(["termux-notification-remove", self.notification_id])
```

### 4. Real-time Progress Tracking

To track progress in real-time, we need to monitor:

1. **Streaming responses**: Parse Claude's streaming output
2. **Tool execution stages**: Hook into tool lifecycle
3. **Token usage**: Estimate progress based on token consumption
4. **File operations**: Track file read/write progress

Example implementation:

```python
class ProgressTracker:
    def __init__(self, notification_manager):
        self.nm = notification_manager
        self.total_steps = 0
        self.current_step = 0
        
    def set_total_steps(self, steps: int):
        self.total_steps = steps
        
    def increment_step(self, description: str):
        self.current_step += 1
        progress = int((self.current_step / self.total_steps) * 100) if self.total_steps > 0 else None
        self.nm.update("Claude Progress", description, progress)
        
    def track_file_operation(self, operation: str, file_path: str, size: int):
        """Track file read/write operations"""
        self.nm.update("Claude File Op", f"{operation}: {file_path} ({size} bytes)")
```

### 5. Implementation Example

Complete working example that can be deployed immediately:

```bash
#!/data/data/com.termux/files/usr/bin/bash

# claude-track.sh - Claude CLI with advanced progress tracking

NOTIFICATION_ID="claude-track"
LOG_FILE="$HOME/.claude-track.log"
FIFO_PATH="/tmp/claude-track-$$"

# Create named pipe for IPC
mkfifo "$FIFO_PATH"

# Cleanup function
cleanup() {
    termux-notification-remove "$NOTIFICATION_ID" 2>/dev/null
    rm -f "$FIFO_PATH"
}
trap cleanup EXIT

# Background notification updater
(
    while true; do
        if read -r line < "$FIFO_PATH"; then
            case "$line" in
                "EXIT") break ;;
                "INIT:"*) 
                    termux-notification --id "$NOTIFICATION_ID" \
                        --title "Claude Starting" \
                        --content "${line#INIT:}" \
                        --ongoing --priority high
                    ;;
                "TOOL:"*)
                    termux-notification --id "$NOTIFICATION_ID" \
                        --title "Claude Working" \
                        --content "${line#TOOL:}" \
                        --ongoing --priority high
                    ;;
                "PROGRESS:"*)
                    IFS='|' read -r title content progress <<< "${line#PROGRESS:}"
                    termux-notification --id "$NOTIFICATION_ID" \
                        --title "$title" \
                        --content "$content" \
                        --ongoing --priority high \
                        --progress-max 100 --progress "$progress"
                    ;;
                "DONE:"*)
                    termux-notification --id "$NOTIFICATION_ID" \
                        --title "Claude Complete" \
                        --content "${line#DONE:}" \
                        --priority default
                    sleep 3
                    termux-notification-remove "$NOTIFICATION_ID"
                    ;;
            esac
        fi
    done
) &
NOTIFIER_PID=$!

# Send initial notification
echo "INIT:Processing your request..." > "$FIFO_PATH"

# Run Claude and parse output
claude "$@" 2>&1 | while IFS= read -r line; do
    echo "$line"  # Pass through
    
    # Log for debugging
    echo "$(date '+%Y-%m-%d %H:%M:%S') $line" >> "$LOG_FILE"
    
    # Pattern matching for tool usage
    case "$line" in
        *"Reading"*|*"Opening"*)
            echo "TOOL:📖 Reading files..." > "$FIFO_PATH"
            ;;
        *"Writing"*|*"Saving"*)
            echo "TOOL:✏️ Writing files..." > "$FIFO_PATH"
            ;;
        *"Executing"*|*"Running"*)
            echo "TOOL:🔧 Executing commands..." > "$FIFO_PATH"
            ;;
        *"Analyzing"*)
            echo "TOOL:🔍 Analyzing code..." > "$FIFO_PATH"
            ;;
        *"Thinking"*)
            echo "TOOL:🤔 Deep thinking..." > "$FIFO_PATH"
            ;;
        *"Complete"*|*"Done"*|*"Finished"*)
            echo "DONE:Task completed successfully" > "$FIFO_PATH"
            ;;
    esac
done

# Signal completion
echo "EXIT" > "$FIFO_PATH"
wait $NOTIFIER_PID
```

### 6. Advanced Features

#### Interactive Actions

Add buttons to notifications for quick actions:

```bash
termux-notification --id "$NOTIFICATION_ID" \
    --title "Claude Code" \
    --content "Task complete. View output?" \
    --button1 "View" \
    --button1-action "termux-open $OUTPUT_FILE" \
    --button2 "Share" \
    --button2-action "termux-share -a send $OUTPUT_FILE"
```

#### Progress Estimation

Estimate progress based on typical operation times:

```python
class ProgressEstimator:
    def __init__(self):
        self.operation_weights = {
            'file_read': 0.1,
            'file_write': 0.15,
            'code_analysis': 0.3,
            'response_generation': 0.35,
            'formatting': 0.1
        }
        self.completed = set()
        
    def estimate_progress(self, completed_operations):
        total_weight = sum(self.operation_weights.values())
        completed_weight = sum(
            self.operation_weights.get(op, 0) 
            for op in completed_operations
        )
        return int((completed_weight / total_weight) * 100)
```

### 7. Installation & Usage

1. **Install dependencies**:
```bash
pkg install termux-api
```

2. **Create wrapper script**:
```bash
cat > ~/bin/claude-notify << 'EOF'
#!/data/data/com.termux/files/usr/bin/bash
# ... (paste the implementation above)
EOF

chmod +x ~/bin/claude-notify
```

3. **Usage**:
```bash
# Instead of: claude "implement user auth"
claude-notify "implement user auth"

# Alias for convenience
alias claude='claude-notify'
```

### 8. Testing

Test notification functionality:

```bash
# Test basic notification
termux-notification --title "Test" --content "Testing notifications"

# Test persistent notification with progress
termux-notification --id test \
    --title "Progress Test" \
    --content "Testing progress..." \
    --ongoing \
    --progress-max 100 \
    --progress 50

# Clean up
termux-notification-remove test
```

## Conclusion

The wrapper script approach (Approach 1) provides the best balance of:
- Easy implementation
- No modification of Claude CLI required  
- Full control over notification behavior
- Minimal performance impact
- Easy to customize and extend

This solution provides real-time, persistent notifications that keep users informed about Claude's progress throughout task execution in Termux.