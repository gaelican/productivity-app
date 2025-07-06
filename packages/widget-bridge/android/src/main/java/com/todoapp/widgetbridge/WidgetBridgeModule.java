package com.todoapp.widgetbridge;

import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.module.annotations.ReactModule;

import org.json.JSONArray;
import org.json.JSONObject;

@ReactModule(name = "WidgetBridgeModule")
public class WidgetBridgeModule extends ReactContextBaseJavaModule {
    private static final String MODULE_NAME = "WidgetBridgeModule";
    private static final String PREFS_NAME = "TodoWidgetPrefs";
    private static final String TASKS_KEY = "tasks_data";

    public WidgetBridgeModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return MODULE_NAME;
    }

    @ReactMethod
    public void updateWidget(ReadableMap data, Promise promise) {
        try {
            Context context = getReactApplicationContext();
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            SharedPreferences.Editor editor = prefs.edit();

            // Convert ReadableMap to JSON
            JSONObject jsonData = new JSONObject();
            
            if (data.hasKey("tasks")) {
                ReadableArray tasksArray = data.getArray("tasks");
                JSONArray jsonTasks = new JSONArray();
                
                for (int i = 0; i < tasksArray.size(); i++) {
                    ReadableMap task = tasksArray.getMap(i);
                    JSONObject jsonTask = new JSONObject();
                    
                    jsonTask.put("id", task.getString("id"));
                    jsonTask.put("title", task.getString("title"));
                    jsonTask.put("completed", task.getBoolean("completed"));
                    
                    if (task.hasKey("dueDate")) {
                        jsonTask.put("dueDate", task.getString("dueDate"));
                    }
                    
                    if (task.hasKey("priority")) {
                        jsonTask.put("priority", task.getString("priority"));
                    }
                    
                    jsonTasks.put(jsonTask);
                }
                
                jsonData.put("tasks", jsonTasks);
            }
            
            if (data.hasKey("lastUpdated")) {
                jsonData.put("lastUpdated", data.getString("lastUpdated"));
            }

            // Save data to SharedPreferences
            editor.putString(TASKS_KEY, jsonData.toString());
            editor.apply();

            // Trigger widget update
            updateAllWidgets(context);
            
            promise.resolve(null);
        } catch (Exception e) {
            promise.reject("UPDATE_WIDGET_ERROR", "Failed to update widget", e);
        }
    }

    @ReactMethod
    public void refreshWidget(Promise promise) {
        try {
            Context context = getReactApplicationContext();
            updateAllWidgets(context);
            promise.resolve(null);
        } catch (Exception e) {
            promise.reject("REFRESH_WIDGET_ERROR", "Failed to refresh widget", e);
        }
    }

    @ReactMethod
    public void isWidgetSupported(Promise promise) {
        try {
            Context context = getReactApplicationContext();
            AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
            
            // Check if any widgets are installed
            ComponentName provider = new ComponentName(context.getPackageName(), 
                context.getPackageName() + ".TodoWidgetProvider");
            int[] widgetIds = appWidgetManager.getAppWidgetIds(provider);
            
            promise.resolve(widgetIds.length > 0);
        } catch (Exception e) {
            promise.resolve(false);
        }
    }

    private void updateAllWidgets(Context context) {
        Intent intent = new Intent(context.getPackageName() + ".UPDATE_WIDGET");
        intent.setPackage(context.getPackageName());
        context.sendBroadcast(intent);
        
        // Also use AppWidgetManager to force update
        AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
        ComponentName provider = new ComponentName(context.getPackageName(), 
            context.getPackageName() + ".TodoWidgetProvider");
        int[] widgetIds = appWidgetManager.getAppWidgetIds(provider);
        
        if (widgetIds.length > 0) {
            Intent updateIntent = new Intent(AppWidgetManager.ACTION_APPWIDGET_UPDATE);
            updateIntent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, widgetIds);
            updateIntent.setComponent(provider);
            context.sendBroadcast(updateIntent);
        }
    }
}