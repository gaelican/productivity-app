package com.productivityapp.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.net.Uri
import android.widget.RemoteViews
import org.json.JSONArray
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.*

/**
 * Android App Widget Provider for Todo App
 * Supports 2x2, 4x2, and 4x4 widget sizes
 * Allows task completion through checkbox interaction
 */
class TodoWidgetProvider : AppWidgetProvider() {
    
    companion object {
        const val ACTION_TASK_COMPLETE = "com.productivityapp.widget.ACTION_TASK_COMPLETE"
        const val ACTION_REFRESH = "com.productivityapp.widget.ACTION_REFRESH"
        const val ACTION_OPEN_APP = "com.productivityapp.widget.ACTION_OPEN_APP"
        const val ACTION_CREATE_TASK = "com.productivityapp.widget.ACTION_CREATE_TASK"
        
        const val EXTRA_TASK_ID = "taskId"
        const val EXTRA_WIDGET_ID = "widgetId"
        
        const val PREFS_NAME = "ProductivityWidgetPrefs"
        const val PREF_WIDGET_DATA = "widget_data_"
        
        // Widget size thresholds
        const val SMALL_WIDTH = 110
        const val MEDIUM_WIDTH = 250
    }
    
    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateWidget(context, appWidgetManager, appWidgetId)
        }
    }
    
    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        
        when (intent.action) {
            ACTION_TASK_COMPLETE -> {
                val taskId = intent.getStringExtra(EXTRA_TASK_ID)
                val widgetId = intent.getIntExtra(EXTRA_WIDGET_ID, -1)
                if (taskId != null && widgetId != -1) {
                    handleTaskComplete(context, taskId, widgetId)
                }
            }
            ACTION_REFRESH -> {
                val widgetId = intent.getIntExtra(EXTRA_WIDGET_ID, -1)
                if (widgetId != -1) {
                    updateWidget(context, AppWidgetManager.getInstance(context), widgetId)
                }
            }
            ACTION_OPEN_APP -> {
                openApp(context, intent)
            }
            ACTION_CREATE_TASK -> {
                openCreateTask(context)
            }
        }
    }
    
    private fun updateWidget(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int
    ) {
        val views = createRemoteViews(context, appWidgetId)
        appWidgetManager.updateAppWidget(appWidgetId, views)
    }
    
    private fun createRemoteViews(context: Context, appWidgetId: Int): RemoteViews {
        val widgetSize = getWidgetSize(context, appWidgetId)
        val layoutId = getLayoutForSize(widgetSize)
        val views = RemoteViews(context.packageName, layoutId)
        
        // Set up header buttons
        setupHeaderButtons(context, views, appWidgetId)
        
        // Load and display tasks
        val tasks = loadWidgetData(context, appWidgetId)
        displayTasks(context, views, tasks, appWidgetId, widgetSize)
        
        return views
    }
    
    private fun getWidgetSize(context: Context, appWidgetId: Int): WidgetSize {
        val appWidgetManager = AppWidgetManager.getInstance(context)
        val options = appWidgetManager.getAppWidgetOptions(appWidgetId)
        val width = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH)
        
        return when {
            width < SMALL_WIDTH -> WidgetSize.SMALL
            width < MEDIUM_WIDTH -> WidgetSize.MEDIUM
            else -> WidgetSize.LARGE
        }
    }
    
    private fun getLayoutForSize(size: WidgetSize): Int {
        // These layouts will be created in the next step
        return when (size) {
            WidgetSize.SMALL -> R.layout.widget_small
            WidgetSize.MEDIUM -> R.layout.widget_medium
            WidgetSize.LARGE -> R.layout.widget_large
        }
    }
    
    private fun setupHeaderButtons(context: Context, views: RemoteViews, widgetId: Int) {
        // Refresh button
        val refreshIntent = Intent(context, TodoWidgetProvider::class.java).apply {
            action = ACTION_REFRESH
            putExtra(EXTRA_WIDGET_ID, widgetId)
        }
        val refreshPendingIntent = PendingIntent.getBroadcast(
            context, widgetId, refreshIntent, 
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        views.setOnClickPendingIntent(R.id.widget_refresh_button, refreshPendingIntent)
        
        // Add task button
        val addTaskIntent = Intent(context, TodoWidgetProvider::class.java).apply {
            action = ACTION_CREATE_TASK
        }
        val addTaskPendingIntent = PendingIntent.getBroadcast(
            context, 0, addTaskIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        views.setOnClickPendingIntent(R.id.widget_add_button, addTaskPendingIntent)
    }
    
    private fun loadWidgetData(context: Context, widgetId: Int): List<Task> {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val dataJson = prefs.getString(PREF_WIDGET_DATA + widgetId, null) ?: return emptyList()
        
        return try {
            val data = JSONObject(dataJson)
            val tasksArray = data.getJSONArray("tasks")
            val tasks = mutableListOf<Task>()
            
            for (i in 0 until tasksArray.length()) {
                val taskJson = tasksArray.getJSONObject(i)
                tasks.add(Task.fromJson(taskJson))
            }
            
            tasks
        } catch (e: Exception) {
            e.printStackTrace()
            emptyList()
        }
    }
    
    private fun displayTasks(
        context: Context,
        views: RemoteViews,
        tasks: List<Task>,
        widgetId: Int,
        size: WidgetSize
    ) {
        // Clear previous tasks
        views.removeAllViews(R.id.widget_task_container)
        
        val maxTasks = when (size) {
            WidgetSize.SMALL -> 3
            WidgetSize.MEDIUM -> 5
            WidgetSize.LARGE -> 10
        }
        
        tasks.take(maxTasks).forEach { task ->
            val taskView = createTaskView(context, task, widgetId)
            views.addView(R.id.widget_task_container, taskView)
        }
    }
    
    private fun createTaskView(context: Context, task: Task, widgetId: Int): RemoteViews {
        val taskView = RemoteViews(context.packageName, R.layout.widget_task_item)
        
        // Set task data
        taskView.setTextViewText(R.id.task_title, task.title)
        taskView.setTextViewText(R.id.task_due_date, formatDueDate(task.dueDate))
        
        // Set color strip
        taskView.setInt(R.id.task_color_strip, "setBackgroundColor", 
            android.graphics.Color.parseColor(task.color))
        
        // Set completion state
        taskView.setImageViewResource(R.id.task_checkbox,
            if (task.completed) R.drawable.ic_checkbox_checked else R.drawable.ic_checkbox_unchecked
        )
        
        // Set click handlers
        val completeIntent = Intent(context, TodoWidgetProvider::class.java).apply {
            action = ACTION_TASK_COMPLETE
            putExtra(EXTRA_TASK_ID, task.id)
            putExtra(EXTRA_WIDGET_ID, widgetId)
        }
        val completePendingIntent = PendingIntent.getBroadcast(
            context, task.id.hashCode(), completeIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        taskView.setOnClickPendingIntent(R.id.task_checkbox, completePendingIntent)
        
        // Task click opens detail
        val openTaskIntent = Intent(context, TodoWidgetProvider::class.java).apply {
            action = ACTION_OPEN_APP
            data = Uri.parse("productivityapp://task/${task.id}")
        }
        val openTaskPendingIntent = PendingIntent.getBroadcast(
            context, task.id.hashCode() + 1000, openTaskIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        taskView.setOnClickPendingIntent(R.id.task_content, openTaskPendingIntent)
        
        return taskView
    }
    
    private fun handleTaskComplete(context: Context, taskId: String, widgetId: Int) {
        // Update task in shared preferences
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val tasks = loadWidgetData(context, widgetId).toMutableList()
        
        tasks.find { it.id == taskId }?.let { task ->
            task.completed = !task.completed
            
            // Save updated data
            saveWidgetData(context, widgetId, tasks)
            
            // Update widget display
            updateWidget(context, AppWidgetManager.getInstance(context), widgetId)
            
            // Notify main app of change
            notifyAppOfTaskCompletion(context, taskId, task.completed)
        }
    }
    
    private fun saveWidgetData(context: Context, widgetId: Int, tasks: List<Task>) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val data = JSONObject().apply {
            put("tasks", JSONArray(tasks.map { it.toJson() }))
            put("lastUpdated", System.currentTimeMillis())
        }
        prefs.edit().putString(PREF_WIDGET_DATA + widgetId, data.toString()).apply()
    }
    
    private fun notifyAppOfTaskCompletion(context: Context, taskId: String, completed: Boolean) {
        // This will be handled by the widget bridge in the main app
        val intent = Intent("com.productivity.app.WIDGET_TASK_COMPLETED").apply {
            putExtra("taskId", taskId)
            putExtra("completed", completed)
        }
        context.sendBroadcast(intent)
    }
    
    private fun openApp(context: Context, intent: Intent) {
        val launchIntent = Intent(Intent.ACTION_VIEW, intent.data).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        context.startActivity(launchIntent)
    }
    
    private fun openCreateTask(context: Context) {
        val intent = Intent(Intent.ACTION_VIEW, 
            Uri.parse("productivityapp://create-task")).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        context.startActivity(intent)
    }
    
    private fun formatDueDate(dueDate: Long?): String {
        if (dueDate == null) return ""
        
        val now = System.currentTimeMillis()
        val diff = dueDate - now
        
        return when {
            diff < 0 -> "Overdue"
            diff < 24 * 60 * 60 * 1000 -> "Today"
            diff < 48 * 60 * 60 * 1000 -> "Tomorrow"
            else -> SimpleDateFormat("MMM d", Locale.getDefault()).format(Date(dueDate))
        }
    }
    
    enum class WidgetSize {
        SMALL, MEDIUM, LARGE
    }
    
    data class Task(
        val id: String,
        val title: String,
        val dueDate: Long?,
        val color: String,
        val icon: String,
        var completed: Boolean,
        val priority: String
    ) {
        fun toJson(): JSONObject {
            return JSONObject().apply {
                put("id", id)
                put("title", title)
                put("dueDate", dueDate)
                put("color", color)
                put("icon", icon)
                put("completed", completed)
                put("priority", priority)
            }
        }
        
        companion object {
            fun fromJson(json: JSONObject): Task {
                return Task(
                    id = json.getString("id"),
                    title = json.getString("title"),
                    dueDate = if (json.has("dueDate")) json.getLong("dueDate") else null,
                    color = json.getString("color"),
                    icon = json.getString("icon"),
                    completed = json.getBoolean("completed"),
                    priority = json.getString("priority")
                )
            }
        }
    }
}