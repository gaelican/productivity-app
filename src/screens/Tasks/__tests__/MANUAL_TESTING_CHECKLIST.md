# Task Creation and Editing - Manual Testing Checklist

## Overview
This document provides a comprehensive checklist for manually testing the task creation and editing workflows in the mobile application. Each section includes specific test scenarios, expected behaviors, and edge cases to verify.

## Test Environment Setup
- [ ] Ensure test database is clean or use test user account
- [ ] Have sample goals created for testing goal selection
- [ ] Clear app cache/data if testing fresh install experience
- [ ] Test on both iOS and Android devices/simulators
- [ ] Test in both portrait and landscape orientations

## 1. Task Creation Screen - Natural Language Mode

### Basic Functionality
- [ ] **Navigate to Create Screen**
  - Tap "+" or "Create Task" button
  - Screen loads with Natural Language mode selected by default
  - Keyboard appears automatically

- [ ] **Natural Language Input**
  - Type: "Call mom tomorrow at 3pm"
  - Preview updates in real-time showing:
    - Task title: "Call mom"
    - Due date: Tomorrow's date
    - Time: 3:00 PM
  - Icon suggestion appears (📞)

- [ ] **Complex Natural Language**
  - Type: "Finish project report by Friday high priority #work #urgent @ProjectX"
  - Verify parsing:
    - Title: "Finish project report"
    - Due date: Next Friday
    - Priority: High
    - Tags: work, urgent
    - Goal association (if ProjectX goal exists)

### Edge Cases
- [ ] **Empty Input**
  - Clear all text
  - Create button should be disabled
  - No preview shown

- [ ] **Very Long Input**
  - Type 500+ character description
  - Verify text wraps properly
  - Performance remains smooth

- [ ] **Special Characters**
  - Input: "Review Q4 report @ 10:30am $$$important!!! #finance"
  - Verify proper parsing and character handling

## 2. Task Creation Screen - Form Mode

### Field Validation
- [ ] **Task Name (Required)**
  - Leave empty → Error message appears on blur
  - Enter only spaces → Treated as empty
  - Enter valid name → Error clears
  - Maximum length (test 200+ characters)

- [ ] **Description (Optional)**
  - Multiline input works
  - Can be left empty
  - Copy/paste large text works
  - Emoji support ✅

- [ ] **Notes (Optional)**
  - Similar to description
  - Private notes indicator visible
  - Saved separately from description

### Interactive Components
- [ ] **Icon Picker**
  - Tap to open picker
  - Select different icon
  - Icon updates in real-time
  - Can scroll through all options

- [ ] **Priority Selector**
  - Default: Medium
  - Tap each priority level
  - Visual feedback on selection
  - Only one can be selected

- [ ] **Date/Time Picker**
  - Tap to open native picker
  - Select future date
  - Select past date (should show warning)
  - Clear date option available
  - Time picker works independently

- [ ] **Tag Input**
  - Type tag and press Add/Enter
  - Tags appear as chips
  - Tap X to remove tag
  - Duplicate tags prevented
  - Special characters in tags

- [ ] **Goal Selector**
  - Shows available goals
  - Search/filter goals
  - Select goal updates UI
  - Can clear selection

- [ ] **Color Theme**
  - Tap to show gradient picker
  - Preview current selection
  - Select new gradient
  - Picker closes on selection
  - Selected gradient highlighted

### Form Submission
- [ ] **Successful Creation**
  - All required fields filled
  - Tap Create
  - Loading indicator appears
  - Success feedback
  - Navigate back to list
  - New task appears in list

- [ ] **Creation with Errors**
  - Submit with empty name
  - Error message appears
  - Form remains filled
  - Fix error and resubmit
  - Success flow works

## 3. Task Edit Screen

### Loading and Display
- [ ] **Task Loading**
  - Select task from list
  - Loading indicator while fetching
  - All fields populated correctly
  - Metadata shown (created date, etc.)

- [ ] **Field Preservation**
  - All original values displayed
  - Special characters preserved
  - Date/time formatting correct
  - Tags loaded as chips

### Editing Functionality
- [ ] **Change Detection**
  - Save button disabled initially
  - Make any change → Save enabled
  - Revert change → Save disabled again
  - Multiple changes tracked

- [ ] **Field Updates**
  - Edit each field type
  - Validation works same as create
  - Can clear optional fields
  - Progress slider (0, 25, 50, 75, 100%)

### Special Actions
- [ ] **Task Completion**
  - Tap "Mark as Complete"
  - Status updates immediately
  - Button changes to "Completed ✓"
  - Can toggle back to incomplete
  - Completion date recorded

- [ ] **Task Deletion**
  - Tap Delete button
  - Confirmation dialog appears
  - Cancel → Nothing happens
  - Confirm → Task deleted
  - Navigate back to list
  - Task no longer in list

### Save Functionality
- [ ] **Successful Save**
  - Make changes
  - Tap Save
  - Loading indicator
  - Success message
  - Navigate back
  - Changes reflected in list

- [ ] **Save with Validation Errors**
  - Clear required field
  - Try to save
  - Error message appears
  - Fix and save successfully

- [ ] **Concurrent Edit Warning**
  - (If implemented) Open same task in two sessions
  - Edit in both
  - Second save shows conflict warning

## 4. Navigation and State Management

### Navigation Flow
- [ ] **Back Navigation**
  - Use back button/gesture
  - Unsaved changes warning (if implemented)
  - Cancel returns to form
  - Confirm discards changes

- [ ] **Deep Linking**
  - Open task from notification
  - Open create with prefilled text
  - Share task URL opens edit

### State Persistence
- [ ] **Form State**
  - Fill create form partially
  - Navigate away and back
  - Data persisted or cleared?
  - App background/foreground

- [ ] **Mode Switching**
  - Natural → Form mode preserves parsed data
  - Form → Natural doesn't lose form data
  - Gradient selection persists

## 5. Performance Testing

### Responsiveness
- [ ] **Input Performance**
  - Type quickly in text fields
  - No lag or dropped characters
  - Smooth cursor movement

- [ ] **Scroll Performance**
  - Long form scrolls smoothly
  - No jank when keyboard appears/hides
  - Gradient picker scrolls well

- [ ] **Load Times**
  - Create screen < 500ms
  - Edit screen < 1s (with data)
  - Save operation < 2s
  - Delete operation < 1s

### Memory Usage
- [ ] **Multiple Operations**
  - Create 10 tasks in succession
  - Edit multiple tasks
  - No memory leaks
  - App remains responsive

## 6. Accessibility Testing

### Screen Reader
- [ ] **Labels and Hints**
  - All inputs have labels
  - Buttons have descriptive text
  - Error messages announced
  - Success messages announced

- [ ] **Navigation**
  - Can navigate all elements
  - Focus order logical
  - Modal/picker accessibility

### Visual Accessibility
- [ ] **Text Contrast**
  - All text readable
  - Error states have sufficient contrast
  - Selected states distinguishable

- [ ] **Touch Targets**
  - All buttons ≥ 44pt
  - Adequate spacing
  - Easy to tap on small screens

## 7. Error Handling and Edge Cases

### Network Errors
- [ ] **Offline Creation**
  - Airplane mode on
  - Try to create task
  - Appropriate error or queued?

- [ ] **Timeout Handling**
  - Slow network simulation
  - Create/save timeout
  - Can retry operation

### Data Validation
- [ ] **Invalid Data**
  - SQL injection attempts in text
  - HTML/script tags in fields
  - Extremely long strings
  - Unicode edge cases

### Conflict Resolution
- [ ] **Deleted Task Edit**
  - Delete task from another device
  - Try to edit on current device
  - Appropriate error handling

## 8. Platform-Specific Testing

### iOS Specific
- [ ] **iOS Keyboard**
  - Keyboard avoidance works
  - Done button behavior
  - Keyboard shortcuts (if any)

- [ ] **iOS Gestures**
  - Swipe back works
  - Pull to refresh (if applicable)
  - 3D touch/long press

### Android Specific
- [ ] **Android Back Button**
  - Hardware back behavior
  - Proper navigation stack

- [ ] **Android Keyboard**
  - Different keyboard apps
  - Keyboard navigation
  - Enter key behavior

## 9. Integration Testing

### Database Integration
- [ ] **Data Persistence**
  - Create task → Kill app → Reopen
  - Task still exists with all data
  - Edit task → Verify in database

- [ ] **Related Data**
  - Task appears in goal view
  - Task counts update
  - Routine tasks link properly

### Sync Testing (if applicable)
- [ ] **Multi-device Sync**
  - Create on device A
  - Appears on device B
  - Edit on B → Updates on A
  - Conflict resolution

## 10. Security Testing

### Input Security
- [ ] **XSS Prevention**
  - Enter `<script>alert('XSS')</script>` in fields
  - HTML properly escaped
  - No code execution

- [ ] **Data Privacy**
  - Tasks only visible to creator
  - No data leakage in logs
  - Secure data transmission

## Regression Test Suite

After any changes, verify:
- [ ] Existing tasks still load
- [ ] Can create basic task
- [ ] Can edit existing task
- [ ] Can delete task
- [ ] Natural language parsing works
- [ ] All pickers/selectors function
- [ ] No console errors
- [ ] No crash scenarios

## Performance Benchmarks

Target metrics:
- Screen load: < 500ms
- Form submission: < 1s
- Text input lag: < 16ms
- Memory usage: < 50MB increase
- Battery drain: < 2% for 10 min use

## Notes Section

Record any issues found:
```
Date: ________
Tester: ________
Device: ________
OS Version: ________

Issues Found:
1. 
2. 
3. 

Suggestions:
1. 
2. 
```