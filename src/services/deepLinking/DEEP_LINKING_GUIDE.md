# Deep Linking Guide

This guide documents the deep linking configuration and patterns for the Productivity App.

## Overview

The app supports deep linking through a custom URL scheme (`productivityapp://`) and universal links (`https://productivityapp.com`). This allows external sources like widgets, notifications, or web pages to open specific screens within the app.

## Configuration

### App.json Configuration

The deep linking is configured in `app.json` with:
- URL Scheme: `productivityapp`
- Android Intent Filters for both custom scheme and HTTPS links
- iOS Associated Domains for universal links

### Navigation Configuration

The navigation container is configured with linking prefixes and screen mappings in `DeepLinkHandler.ts`.

## Supported Deep Link Patterns

### Task Management

1. **Open Task Details**
   - URL: `productivityapp://task/{taskId}`
   - Example: `productivityapp://task/123`
   - Opens the task detail screen for the specified task ID

2. **Create New Task**
   - URL: `productivityapp://create-task`
   - Opens the task creation screen

### Routine Management

3. **Open Routine Details**
   - URL: `productivityapp://routine/{routineId}`
   - Example: `productivityapp://routine/456`
   - Opens the routine detail screen for the specified routine ID

4. **Create New Routine**
   - URL: `productivityapp://create-routine`
   - Opens the routine creation screen

### Goal Management

5. **Open Goal Details**
   - URL: `productivityapp://goal/{goalId}`
   - Example: `productivityapp://goal/789`
   - Opens the goal detail screen for the specified goal ID

6. **Create New Goal**
   - URL: `productivityapp://create-goal`
   - Opens the goal creation screen

### Other Screens

7. **Settings**
   - URL: `productivityapp://settings`
   - Opens the settings screen

8. **User Profile**
   - URL: `productivityapp://profile/{userId}`
   - Example: `productivityapp://profile/user123`
   - Opens a specific user's profile

## Universal Links

The app also supports HTTPS universal links:
- `https://productivityapp.com/task/{taskId}`
- `https://productivityapp.com/create-task`
- `https://productivityapp.com/routine/{routineId}`
- `https://productivityapp.com/create-routine`
- `https://productivityapp.com/goal/{goalId}`
- `https://productivityapp.com/create-goal`

## Widget Integration

The deep linking configuration is designed to work seamlessly with the Android widget's `openDeepLink` implementation. The widget can trigger any of the supported deep link patterns to navigate users directly to the relevant screen.

### Example Widget Usage

```kotlin
// In your widget's onUpdate or onClick handler
fun openTaskDetails(context: Context, taskId: String) {
    val intent = Intent(Intent.ACTION_VIEW).apply {
        data = Uri.parse("productivityapp://task/$taskId")
        flags = Intent.FLAG_ACTIVITY_NEW_TASK
    }
    context.startActivity(intent)
}

fun createNewTask(context: Context) {
    val intent = Intent(Intent.ACTION_VIEW).apply {
        data = Uri.parse("productivityapp://create-task")
        flags = Intent.FLAG_ACTIVITY_NEW_TASK
    }
    context.startActivity(intent)
}
```

## Implementation Details

### DeepLinkHandler Class

The `DeepLinkHandler` class is responsible for:
1. Parsing incoming deep link URLs
2. Navigating to the appropriate screen
3. Handling initial app launch via deep link
4. Setting up listeners for when the app is already open

### Navigation Integration

The deep linking is integrated into the navigation system through:
1. `linkingConfiguration` object that maps URLs to screens
2. `useDeepLinking` hook that sets up the handler
3. Navigation container configuration with the linking prop

## Testing Deep Links

### Android Testing

```bash
# Test custom scheme
adb shell am start -W -a android.intent.action.VIEW -d "productivityapp://task/123" com.productivityapp.app

# Test universal link
adb shell am start -W -a android.intent.action.VIEW -d "https://productivityapp.com/create-task" com.productivityapp.app
```

### iOS Testing

```bash
# Test custom scheme
xcrun simctl openurl booted "productivityapp://task/123"

# Test universal link
xcrun simctl openurl booted "https://productivityapp.com/create-task"
```

## Error Handling

The deep link handler includes error handling for:
- Invalid URLs
- Missing navigation reference
- Unknown URL patterns (falls back to main screen)
- Parsing errors

## Future Enhancements

Potential improvements to consider:
1. Add support for query parameters (e.g., `productivityapp://task/123?edit=true`)
2. Implement deep link analytics
3. Add support for nested navigation states
4. Create a deep link builder utility for generating links programmatically