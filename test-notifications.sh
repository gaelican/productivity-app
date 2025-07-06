#!/data/data/com.termux/files/usr/bin/bash

# Test script for Termux notifications with Claude

echo "Testing Termux notification capabilities..."

# Test 1: Basic notification
echo "1. Testing basic notification..."
termux-notification \
    --title "Test 1: Basic" \
    --content "This is a basic notification"
sleep 2

# Test 2: Persistent notification with ID
echo "2. Testing persistent notification..."
termux-notification \
    --id test-persistent \
    --title "Test 2: Persistent" \
    --content "This notification will be updated..." \
    --ongoing
sleep 2

# Test 3: Update the persistent notification
echo "3. Updating persistent notification..."
termux-notification \
    --id test-persistent \
    --title "Test 2: Updated" \
    --content "Content has been updated!" \
    --ongoing
sleep 2

# Test 4: Progress notification
echo "4. Testing progress notification..."
for i in {0..100..20}; do
    termux-notification \
        --id test-progress \
        --title "Test 4: Progress" \
        --content "Processing... $i%" \
        --ongoing \
        --progress-max 100 \
        --progress $i
    sleep 1
done

# Test 5: Notification with actions
echo "5. Testing notification with actions..."
termux-notification \
    --id test-actions \
    --title "Test 5: Actions" \
    --content "Click a button to test actions" \
    --button1 "Open Settings" \
    --button1-action "am start -a android.settings.SETTINGS" \
    --button2 "Vibrate" \
    --button2-action "termux-vibrate -d 500"
sleep 3

# Test 6: Priority levels
echo "6. Testing priority levels..."
for priority in low default high max; do
    termux-notification \
        --title "Priority: $priority" \
        --content "Testing $priority priority" \
        --priority $priority
    sleep 1
done

# Cleanup
echo "7. Cleaning up notifications..."
termux-notification-remove test-persistent
termux-notification-remove test-progress
termux-notification-remove test-actions

# Final notification
termux-notification \
    --title "Tests Complete ✅" \
    --content "All notification tests completed successfully!" \
    --vibrate 200 \
    --sound

echo "All tests completed!"