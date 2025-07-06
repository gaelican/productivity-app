# Android Widget Expo Config Plugin

This Expo config plugin automatically configures your Android app to support home screen widgets.

## Installation

The plugin is included with the `@todo-app/widget-bridge` package. Install it in your Expo app:

```bash
npm install @todo-app/widget-bridge
# or
yarn add @todo-app/widget-bridge
```

## Usage

Add the plugin to your `app.json` or `app.config.js`:

```json
{
  "expo": {
    "plugins": [
      [
        "@todo-app/widget-bridge/plugin",
        {
          "widgetName": "TodoWidget",
          "updateInterval": 30
        }
      ]
    ]
  }
}
```

### Configuration Options

- `widgetName` (optional): The name of your widget class. Default: "TodoWidget"
- `updateInterval` (optional): Update interval in minutes. Default: 30

## What the Plugin Does

1. **Modifies AndroidManifest.xml**:
   - Adds widget receiver with appropriate intent filters
   - Adds widget update service
   - Adds necessary permissions (RECEIVE_BOOT_COMPLETED, WAKE_LOCK)

2. **Creates Widget Configuration Files**:
   - `widget_info.xml`: Widget provider configuration
   - `widget_layout.xml`: Default widget layout
   - `widget_background.xml`: Widget background drawable

3. **Generates Java Classes**:
   - `TodoWidgetProvider.java`: Main widget provider class
   - `TodoWidgetUpdateService.java`: Service for handling widget updates

## Customization

After running `expo prebuild`, you can customize the generated files:

- Modify the widget layout in `android/app/src/main/res/layout/widget_layout.xml`
- Customize the widget logic in the generated Java files
- Add custom widget sizes and layouts

## Integration with React Native

To communicate between your React Native app and the widget, use the `@todo-app/widget-bridge` module:

```typescript
import { WidgetBridge } from '@todo-app/widget-bridge';

// Update widget data
await WidgetBridge.updateWidget({
  tasks: [
    { id: '1', title: 'Task 1', completed: false },
    { id: '2', title: 'Task 2', completed: true }
  ]
});

// Force widget refresh
await WidgetBridge.refreshWidget();
```

## Notes

- The plugin only runs during the prebuild phase
- You need to run `expo prebuild` after adding the plugin
- For development, use `expo run:android` to test widgets
- Widgets are only supported on Android (iOS widgets require different implementation)