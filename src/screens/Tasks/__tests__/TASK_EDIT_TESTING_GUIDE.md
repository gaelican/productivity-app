# Task Edit Screen - Interactive Testing Guide

## Overview
This guide helps identify potential UI issues in the TaskEditScreen component through manual and automated testing.

## Automated Tests

### 1. Run the Jest Test Suite
```bash
npm run test:task-edit
```
This runs comprehensive unit tests that simulate user interactions.

### 2. Run the Interactive Test Runner
```bash
npm run test:interactive
```
This simulates various user scenarios and generates a performance report.

## Manual Testing Checklist

### Form Input Testing
- [ ] **Task Name Field**
  - Enter very long text (>100 characters)
  - Enter special characters (@#$%^&*)
  - Clear the field and try to save (should show validation error)
  - Test auto-capitalization behavior

- [ ] **Description/Notes Fields**
  - Enter multi-line text with line breaks
  - Paste large amounts of text
  - Test scrolling within the text area
  - Verify keyboard dismiss behavior

### Component Interaction Testing
- [ ] **Priority Selector**
  - Tap through all priority levels rapidly
  - Verify visual feedback on selection
  - Check if state persists correctly

- [ ] **Date/Time Picker**
  - Select past dates
  - Select dates far in the future
  - Clear date selection
  - Test timezone handling

- [ ] **Progress Slider**
  - Tap each progress button (0%, 25%, 50%, 75%, 100%)
  - Verify progress bar animation
  - Test if 100% progress marks task as complete

- [ ] **Tag Input**
  - Add multiple tags rapidly
  - Add tags with special characters
  - Remove tags
  - Test with 10+ tags

- [ ] **Icon Picker**
  - Select different icons
  - Verify icon updates in real-time
  - Test scrolling through icon list

- [ ] **Gradient Theme Selector**
  - Open gradient picker
  - Select different themes
  - Verify gradient preview updates
  - Test picker dismissal

### Save/Navigation Testing
- [ ] **Save Changes**
  - Make single field change and save
  - Make multiple changes and save
  - Save without changes (button should be disabled)
  - Test save with network offline

- [ ] **Unsaved Changes**
  - Make changes and try to navigate back
  - Verify warning alert appears
  - Test "Discard" option
  - Test "Don't leave" option

- [ ] **Task Completion**
  - Mark task as complete
  - Verify UI updates (strike-through, color change)
  - Unmark completed task
  - Test completion with subtasks

- [ ] **Task Deletion**
  - Press delete button
  - Verify confirmation dialog
  - Test cancel deletion
  - Test confirm deletion

### Performance Testing
- [ ] **Rapid Input**
  - Type quickly in text fields
  - Monitor for lag or stuttering
  - Check character loss

- [ ] **State Updates**
  - Change multiple fields quickly
  - Monitor UI responsiveness
  - Check for flickering

- [ ] **Memory Usage**
  - Open/close screen multiple times
  - Edit task repeatedly
  - Monitor app memory usage

### Edge Cases
- [ ] **Offline Mode**
  - Test save operations without network
  - Verify error handling
  - Check data persistence

- [ ] **Concurrent Editing**
  - Simulate task being edited elsewhere
  - Test conflict resolution
  - Verify version handling

- [ ] **Large Data**
  - Test with tasks having many tags
  - Test with very long descriptions
  - Test with complex recurring patterns

## Common Issues to Watch For

### 1. Text Input Issues
- **Symptom**: Keyboard covers input field
- **Test**: Focus on bottom text fields
- **Expected**: Screen should scroll to keep input visible

### 2. State Synchronization
- **Symptom**: Changes not reflected immediately
- **Test**: Make rapid changes to multiple fields
- **Expected**: All changes should be tracked

### 3. Memory Leaks
- **Symptom**: App becomes sluggish over time
- **Test**: Edit multiple tasks repeatedly
- **Expected**: Performance remains consistent

### 4. Save Button State
- **Symptom**: Save button enabled/disabled incorrectly
- **Test**: Make and revert changes
- **Expected**: Button state matches presence of changes

### 5. Navigation Guards
- **Symptom**: Lost changes without warning
- **Test**: Make changes and use back gesture
- **Expected**: Warning dialog appears

## Performance Benchmarks

Expected performance metrics:
- Initial render: <200ms
- Text input response: <16ms
- State update: <50ms
- Save operation: <500ms
- Navigation: <100ms

## Debugging Tips

1. **Enable React Native Debugger**
   - Monitor component re-renders
   - Check state updates
   - Profile performance

2. **Console Logging**
   - The test includes extensive console logs
   - Watch for warnings or errors
   - Monitor state change sequence

3. **Network Inspector**
   - Check API calls during save
   - Verify request/response data
   - Monitor for failed requests

## Reporting Issues

When reporting issues, include:
1. Device/OS information
2. Steps to reproduce
3. Expected vs actual behavior
4. Screenshots/recordings if possible
5. Console logs
6. Performance metrics

## Test Environment Setup

```bash
# Install dependencies
cd apps/mobile
npm install

# Install chalk for colored output (if needed)
npm install --save-dev chalk

# Run tests
npm run test:interactive
```

## Continuous Testing

Run these tests:
- Before major releases
- After UI library updates
- When performance issues are reported
- After state management changes
- When adding new features to the form