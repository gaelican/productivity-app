// Expo Config Plugin for Android Widgets
const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

function withAndroidWidget(config, options = {}) {
  const { widgetName = 'TodoWidget', updateInterval = 30 } = options;

  // Add Android manifest modifications
  config = withAndroidManifest(config, async (config) => {
    const manifest = config.modResults;
    
    // Add widget receiver to manifest
    const application = manifest.manifest.application[0];
    
    if (!application.receiver) {
      application.receiver = [];
    }
    
    // Check if widget receiver already exists
    const widgetReceiverExists = application.receiver.some(
      receiver => receiver.$['android:name'] === '.TodoWidgetProvider'
    );
    
    if (!widgetReceiverExists) {
      application.receiver.push({
        $: {
          'android:name': '.TodoWidgetProvider',
          'android:exported': 'true'
        },
        'intent-filter': [{
          action: [{
            $: {
              'android:name': 'android.appwidget.action.APPWIDGET_UPDATE'
            }
          }]
        }],
        'meta-data': [{
          $: {
            'android:name': 'android.appwidget.provider',
            'android:resource': '@xml/todo_widget_info'
          }
        }]
      });
    }
    
    // Add widget service
    if (!application.service) {
      application.service = [];
    }
    
    const widgetServiceExists = application.service.some(
      service => service.$['android:name'] === '.WidgetUpdateService'
    );
    
    if (!widgetServiceExists) {
      application.service.push({
        $: {
          'android:name': '.WidgetUpdateService',
          'android:exported': 'false'
        }
      });
    }
    
    return config;
  });

  // Add widget provider files
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const widgetSrcPath = path.join(
        __dirname,
        '../../android/src/main/kotlin/com/productivity/widget'
      );
      
      // Copy widget files if the source exists
      if (fs.existsSync(widgetSrcPath)) {
        const targetPath = path.join(
          projectRoot,
          'android/app/src/main/java/com/productivityapp/app'
        );
        
        // Create target directory if it doesn't exist
        if (!fs.existsSync(targetPath)) {
          fs.mkdirSync(targetPath, { recursive: true });
        }
        
        // Note: In a real implementation, we would copy the widget files here
        console.log('Widget plugin: Would copy widget files to Android project');
      }
      
      return config;
    }
  ]);

  return config;
}

module.exports = withAndroidWidget;