package com.productivityapp.widget

import android.app.AlarmManager
import android.app.PendingIntent
import android.app.Service
import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.IBinder
import android.os.SystemClock

/**
 * Service to handle widget updates from the main app
 * Respects Android's 30-minute minimum update interval
 */
class WidgetUpdateService : Service() {
    
    companion object {
        const val ACTION_UPDATE_WIDGETS = "com.productivityapp.widget.UPDATE_WIDGETS"
        const val EXTRA_WIDGET_DATA = "widget_data"
        
        // Minimum update interval (30 minutes for Android widgets)
        const val MIN_UPDATE_INTERVAL_MS = 30 * 60 * 1000L
        
        private var lastUpdateTime = 0L
        
        fun updateWidgets(context: Context, widgetData: String) {
            val intent = Intent(context, WidgetUpdateService::class.java).apply {
                action = ACTION_UPDATE_WIDGETS
                putExtra(EXTRA_WIDGET_DATA, widgetData)
            }
            context.startService(intent)
        }
        
        fun scheduleNextUpdate(context: Context) {
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            val intent = Intent(context, WidgetUpdateService::class.java).apply {
                action = ACTION_UPDATE_WIDGETS
            }
            val pendingIntent = PendingIntent.getService(
                context, 0, intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            
            // Schedule next update respecting minimum interval
            val nextUpdate = SystemClock.elapsedRealtime() + MIN_UPDATE_INTERVAL_MS
            alarmManager.set(AlarmManager.ELAPSED_REALTIME, nextUpdate, pendingIntent)
        }
    }
    
    override fun onBind(intent: Intent?): IBinder? = null
    
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_UPDATE_WIDGETS) {
            val currentTime = System.currentTimeMillis()
            
            // Check if enough time has passed since last update
            if (currentTime - lastUpdateTime >= MIN_UPDATE_INTERVAL_MS || lastUpdateTime == 0L) {
                val widgetData = intent.getStringExtra(EXTRA_WIDGET_DATA)
                if (widgetData != null) {
                    updateAllWidgets(widgetData)
                    lastUpdateTime = currentTime
                }
            }
            
            // Schedule next update
            scheduleNextUpdate(this)
        }
        
        stopSelf(startId)
        return START_NOT_STICKY
    }
    
    private fun updateAllWidgets(widgetData: String) {
        val appWidgetManager = AppWidgetManager.getInstance(this)
        val widgetComponent = ComponentName(this, TodoWidgetProvider::class.java)
        val widgetIds = appWidgetManager.getAppWidgetIds(widgetComponent)
        
        // Parse widget data and update each widget
        widgetIds.forEach { widgetId ->
            saveWidgetData(widgetId, widgetData)
            
            // Trigger widget update
            val updateIntent = Intent(this, TodoWidgetProvider::class.java).apply {
                action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
                putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, intArrayOf(widgetId))
            }
            sendBroadcast(updateIntent)
        }
    }
    
    private fun saveWidgetData(widgetId: Int, widgetData: String) {
        val prefs = getSharedPreferences(TodoWidgetProvider.PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit().putString(TodoWidgetProvider.PREF_WIDGET_DATA + widgetId, widgetData).apply()
    }
}