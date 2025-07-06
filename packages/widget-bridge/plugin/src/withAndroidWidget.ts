import {
  ConfigPlugin,
  withAndroidManifest,
  withDangerousMod,
  AndroidConfig,
} from '@expo/config-plugins';
import { ExpoConfig } from '@expo/config-types';
import * as fs from 'fs';
import * as path from 'path';

const { getMainApplicationOrThrow } = AndroidConfig.Manifest;

interface WidgetPluginProps {
  widgetName?: string;
  updateInterval?: number; // in minutes
}

const withAndroidWidget: ConfigPlugin<WidgetPluginProps> = (
  config,
  props = {}
) => {
  const { widgetName = 'TodoWidget', updateInterval = 30 } = props;

  // Modify AndroidManifest.xml
  config = withAndroidManifest(config, async (config) => {
    const manifest = config.modResults;
    const mainApplication = getMainApplicationOrThrow(manifest);

    // Add widget receiver
    if (!mainApplication.receiver) {
      mainApplication.receiver = [];
    }

    // Check if widget receiver already exists
    const widgetReceiverExists = mainApplication.receiver.some(
      (receiver) => receiver.$['android:name'] === `.${widgetName}Provider`
    );

    if (!widgetReceiverExists) {
      mainApplication.receiver.push({
        $: {
          'android:name': `.${widgetName}Provider`,
          'android:exported': 'true',
          'android:label': '@string/app_name',
        },
        'intent-filter': [
          {
            action: [
              {
                $: {
                  'android:name': 'android.appwidget.action.APPWIDGET_UPDATE',
                },
              },
            ],
          },
        ],
        'meta-data': [
          {
            $: {
              'android:name': 'android.appwidget.provider',
              'android:resource': `@xml/${widgetName.toLowerCase()}_info`,
            },
          },
        ],
      });
    }

    // Add widget update service
    if (!mainApplication.service) {
      mainApplication.service = [];
    }

    const widgetServiceExists = mainApplication.service.some(
      (service) => service.$['android:name'] === `.${widgetName}UpdateService`
    );

    if (!widgetServiceExists) {
      mainApplication.service.push({
        $: {
          'android:name': `.${widgetName}UpdateService`,
          'android:permission': 'android.permission.BIND_JOB_SERVICE',
          'android:exported': 'false',
        },
      });
    }

    // Add necessary permissions
    if (!manifest.manifest.permission) {
      manifest.manifest.permission = [];
    }

    const requiredPermissions = [
      'android.permission.RECEIVE_BOOT_COMPLETED',
      'android.permission.WAKE_LOCK',
    ];

    requiredPermissions.forEach((permission) => {
      const permissionExists = manifest.manifest['uses-permission']?.some(
        (perm) => perm.$['android:name'] === permission
      );

      if (!permissionExists) {
        if (!manifest.manifest['uses-permission']) {
          manifest.manifest['uses-permission'] = [];
        }
        manifest.manifest['uses-permission'].push({
          $: {
            'android:name': permission,
          },
        });
      }
    });

    return config;
  });

  // Create widget provider XML file
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const widgetInfoPath = path.join(
        projectRoot,
        'android',
        'app',
        'src',
        'main',
        'res',
        'xml'
      );

      // Create xml directory if it doesn't exist
      if (!fs.existsSync(widgetInfoPath)) {
        fs.mkdirSync(widgetInfoPath, { recursive: true });
      }

      // Create widget info XML
      const widgetInfoContent = `<?xml version="1.0" encoding="utf-8"?>
<appwidget-provider xmlns:android="http://schemas.android.com/apk/res/android"
    android:minWidth="250dp"
    android:minHeight="180dp"
    android:updatePeriodMillis="${updateInterval * 60 * 1000}"
    android:previewImage="@drawable/widget_preview"
    android:initialLayout="@layout/widget_layout"
    android:resizeMode="horizontal|vertical"
    android:widgetCategory="home_screen"
    android:configure="com.todoapp.widget.${widgetName}ConfigureActivity">
</appwidget-provider>`;

      fs.writeFileSync(
        path.join(widgetInfoPath, `${widgetName.toLowerCase()}_info.xml`),
        widgetInfoContent
      );

      // Create widget layout XML
      const layoutPath = path.join(
        projectRoot,
        'android',
        'app',
        'src',
        'main',
        'res',
        'layout'
      );

      if (!fs.existsSync(layoutPath)) {
        fs.mkdirSync(layoutPath, { recursive: true });
      }

      const widgetLayoutContent = `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:padding="16dp"
    android:background="@drawable/widget_background">

    <TextView
        android:id="@+id/widget_title"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:text="Todo Tasks"
        android:textSize="18sp"
        android:textStyle="bold"
        android:textColor="@android:color/black"
        android:paddingBottom="8dp" />

    <ListView
        android:id="@+id/widget_task_list"
        android:layout_width="match_parent"
        android:layout_height="0dp"
        android:layout_weight="1"
        android:divider="@android:color/transparent"
        android:dividerHeight="4dp" />

    <Button
        android:id="@+id/widget_add_button"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:text="Add Task"
        android:layout_marginTop="8dp" />

</LinearLayout>`;

      fs.writeFileSync(
        path.join(layoutPath, 'widget_layout.xml'),
        widgetLayoutContent
      );

      // Create widget background drawable
      const drawablePath = path.join(
        projectRoot,
        'android',
        'app',
        'src',
        'main',
        'res',
        'drawable'
      );

      if (!fs.existsSync(drawablePath)) {
        fs.mkdirSync(drawablePath, { recursive: true });
      }

      const widgetBackgroundContent = `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android"
    android:shape="rectangle">
    <solid android:color="@android:color/white" />
    <corners android:radius="16dp" />
    <stroke
        android:width="1dp"
        android:color="#E0E0E0" />
</shape>`;

      fs.writeFileSync(
        path.join(drawablePath, 'widget_background.xml'),
        widgetBackgroundContent
      );

      return config;
    },
  ]);

  // Add widget provider and service Java/Kotlin files
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const packageName = config.android?.package || 'com.todoapp';
      const packagePath = packageName.replace(/\./g, '/');
      
      const javaPath = path.join(
        projectRoot,
        'android',
        'app',
        'src',
        'main',
        'java',
        packagePath
      );

      if (!fs.existsSync(javaPath)) {
        fs.mkdirSync(javaPath, { recursive: true });
      }

      // Create widget provider class
      const widgetProviderContent = `package ${packageName};

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.widget.RemoteViews;

public class ${widgetName}Provider extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
        
        // Schedule widget updates
        Intent serviceIntent = new Intent(context, ${widgetName}UpdateService.class);
        context.startService(serviceIntent);
    }

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_layout);
        
        // Set up click handler for add button
        Intent intent = new Intent(context, MainActivity.class);
        intent.setAction("ADD_TASK");
        PendingIntent pendingIntent = PendingIntent.getActivity(
            context, 
            0, 
            intent, 
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.widget_add_button, pendingIntent);
        
        // Update the widget
        appWidgetManager.updateAppWidget(appWidgetId, views);
    }
    
    @Override
    public void onEnabled(Context context) {
        // Enter relevant functionality for when the first widget is created
    }

    @Override
    public void onDisabled(Context context) {
        // Enter relevant functionality for when the last widget is disabled
    }
    
    public static void updateAllWidgets(Context context) {
        AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
        ComponentName widget = new ComponentName(context, ${widgetName}Provider.class);
        int[] appWidgetIds = appWidgetManager.getAppWidgetIds(widget);
        
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }
}`;

      fs.writeFileSync(
        path.join(javaPath, `${widgetName}Provider.java`),
        widgetProviderContent
      );

      // Create widget update service class
      const widgetServiceContent = `package ${packageName};

import android.app.Service;
import android.content.Intent;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;

public class ${widgetName}UpdateService extends Service {
    private Handler handler;
    private Runnable updateRunnable;
    private static final long UPDATE_INTERVAL = ${updateInterval} * 60 * 1000L; // ${updateInterval} minutes

    @Override
    public void onCreate() {
        super.onCreate();
        handler = new Handler(Looper.getMainLooper());
        
        updateRunnable = new Runnable() {
            @Override
            public void run() {
                ${widgetName}Provider.updateAllWidgets(getApplicationContext());
                handler.postDelayed(this, UPDATE_INTERVAL);
            }
        };
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        handler.removeCallbacks(updateRunnable);
        handler.post(updateRunnable);
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        handler.removeCallbacks(updateRunnable);
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}`;

      fs.writeFileSync(
        path.join(javaPath, `${widgetName}UpdateService.java`),
        widgetServiceContent
      );

      return config;
    },
  ]);

  return config;
};

export default withAndroidWidget;