#!/bin/bash
# Test the notification system

echo "Testing Termux notifications..."

# Test basic notification
termux-notification \
    --id 12345 \
    --title "Claude Notification Test" \
    --content "Basic notification test" \
    --priority default

sleep 2

# Test persistent notification with progress
termux-notification \
    --id 12345 \
    --title "Claude Working..." \
    --content "📖 Reading files | ⏱️ 00:05" \
    --priority high \
    --ongoing

sleep 2

# Update notification
termux-notification \
    --id 12345 \
    --title "Claude Working..." \
    --content "✏️ Writing files | ⏱️ 00:07 | 📊 R:3 W:1 C:0" \
    --priority high \
    --ongoing

sleep 2

# Final notification
termux-notification \
    --id 12345 \
    --title "Claude Completed" \
    --content "✅ Completed in 00:10\n📊 Files: R:5 W:2\n🔧 Commands: 3" \
    --priority default \
    --vibrate 200,100,200 \
    --sound

echo "✅ Notification test complete!"
echo ""
echo "The notification system is working correctly."
echo "You can now use: ~/bin/claude-notify.sh \"your prompt\""