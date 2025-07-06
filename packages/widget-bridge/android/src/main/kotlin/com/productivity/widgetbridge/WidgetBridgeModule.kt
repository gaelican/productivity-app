package com.productivity.widgetbridge

import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import android.content.Intent
import android.content.Context
import android.net.Uri
import android.content.SharedPreferences
import android.content.ComponentName
import android.appwidget.AppWidgetManager
import org.json.JSONObject

class WidgetBridgeModule(reactContext: ReactApplicationContext) : 
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val MODULE_NAME = "WidgetBridge"
        const val PREFS_NAME = "ProductivityWidgetPrefs"
        const val PREF_WIDGET_DATA = "widget_data_"
    }

    override fun getName() = MODULE_NAME

    private fun getSharedPreferences(): SharedPreferences {
        return reactApplicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    }

    @ReactMethod
    fun updateWidgetData(widgetId: String, dataJson: String, promise: Promise) {
        try {
            val prefs = getSharedPreferences()
            prefs.edit().putString(PREF_WIDGET_DATA + widgetId, dataJson).apply()
            
            // Trigger widget update
            triggerWidgetUpdate()
            
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("UPDATE_FAILED", e.message)
        }
    }

    @ReactMethod
    fun getWidgetData(widgetId: String, promise: Promise) {
        try {
            val prefs = getSharedPreferences()
            val data = prefs.getString(PREF_WIDGET_DATA + widgetId, null)
            promise.resolve(data)
        } catch (e: Exception) {
            promise.reject("GET_FAILED", e.message)
        }
    }

    @ReactMethod
    fun scheduleUpdate(widgetId: String, delayMs: Double, promise: Promise) {
        try {
            // Use the widget update service
            val intent = Intent("com.productivity.widget.UPDATE_WIDGETS").apply {
                putExtra("widgetId", widgetId)
                putExtra("delayMs", delayMs.toLong())
            }
            reactApplicationContext.sendBroadcast(intent)
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("SCHEDULE_FAILED", e.message)
        }
    }

    @ReactMethod
    fun forceUpdateAll(promise: Promise) {
        try {
            triggerWidgetUpdate()
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("UPDATE_FAILED", e.message)
        }
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    fun supportsInteraction(): Boolean {
        // Android widgets support limited interaction
        return true
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    fun canCompleteTask(): Boolean {
        // Android widgets can complete tasks via checkbox
        return true
    }

    @ReactMethod
    fun openDeepLink(url: String, params: String?, promise: Promise) {
        try {
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url)).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
                if (params != null) {
                    putExtra("params", params)
                }
            }
            
            if (intent.resolveActivity(reactApplicationContext.packageManager) != null) {
                reactApplicationContext.startActivity(intent)
                promise.resolve(null)
            } else {
                promise.reject("NO_ACTIVITY", "No activity found to handle the deep link")
            }
        } catch (e: Exception) {
            promise.reject("DEEPLINK_FAILED", e.message)
        }
    }

    private fun triggerWidgetUpdate() {
        val intent = Intent(reactApplicationContext, getWidgetProviderClass()).apply {
            action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
            val appWidgetManager = AppWidgetManager.getInstance(reactApplicationContext)
            val widgetComponent = ComponentName(
                reactApplicationContext.packageName,
                "com.productivity.widget.TodoWidgetProvider"
            )
            val ids = appWidgetManager.getAppWidgetIds(widgetComponent)
            putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids)
        }
        reactApplicationContext.sendBroadcast(intent)
    }

    private fun getWidgetProviderClass(): Class<*> {
        return Class.forName("com.productivity.widget.TodoWidgetProvider")
    }

    // Send events to JavaScript
    private fun sendEvent(eventName: String, params: WritableMap) {
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }

    // Listen for widget events
    fun onWidgetTaskCompleted(taskId: String, completed: Boolean) {
        val params = Arguments.createMap().apply {
            putString("type", "TASK_COMPLETED")
            putString("taskId", taskId)
            putBoolean("completed", completed)
        }
        sendEvent("WidgetEvent", params)
    }
}