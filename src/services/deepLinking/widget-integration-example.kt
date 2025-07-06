/**
 * Example integration for Android Widget to use deep links
 * This demonstrates how the widget can open specific screens in the app
 */

package com.productivityapp.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.RemoteViews

class ProductivityAppWidget : AppWidgetProvider() {
    
    /**
     * Create an intent that opens a specific task in the app
     */
    private fun createTaskDetailIntent(context: Context, taskId: String): PendingIntent {
        val intent = Intent(Intent.ACTION_VIEW).apply {
            data = Uri.parse("productivityapp://task/$taskId")
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        
        return PendingIntent.getActivity(
            context,
            taskId.hashCode(), // Unique request code
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
    }
    
    /**
     * Create an intent that opens the task creation screen
     */
    private fun createNewTaskIntent(context: Context): PendingIntent {
        val intent = Intent(Intent.ACTION_VIEW).apply {
            data = Uri.parse("productivityapp://create-task")
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        
        return PendingIntent.getActivity(
            context,
            CREATE_TASK_REQUEST_CODE,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
    }
    
    /**
     * Update the widget with task items and deep link handlers
     */
    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            val views = RemoteViews(context.packageName, R.layout.widget_layout)
            
            // Set up "Add Task" button to open task creation
            views.setOnClickPendingIntent(
                R.id.add_task_button,
                createNewTaskIntent(context)
            )
            
            // Example: Set up a task item to open task details
            // In a real implementation, this would be done for each task in the list
            val taskId = "12345" // This would come from your task data
            views.setOnClickPendingIntent(
                R.id.task_item_1,
                createTaskDetailIntent(context, taskId)
            )
            
            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
    }
    
    companion object {
        private const val CREATE_TASK_REQUEST_CODE = 1001
    }
}

/**
 * Example of how to open deep links from widget service or other components
 */
class DeepLinkHelper {
    
    /**
     * Open task details screen
     */
    fun openTaskDetails(context: Context, taskId: String) {
        val intent = Intent(Intent.ACTION_VIEW).apply {
            data = Uri.parse("productivityapp://task/$taskId")
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        context.startActivity(intent)
    }
    
    /**
     * Open task creation screen
     */
    fun createNewTask(context: Context) {
        val intent = Intent(Intent.ACTION_VIEW).apply {
            data = Uri.parse("productivityapp://create-task")
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        context.startActivity(intent)
    }
    
    /**
     * Open routine details screen
     */
    fun openRoutineDetails(context: Context, routineId: String) {
        val intent = Intent(Intent.ACTION_VIEW).apply {
            data = Uri.parse("productivityapp://routine/$routineId")
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        context.startActivity(intent)
    }
    
    /**
     * Open goal details screen
     */
    fun openGoalDetails(context: Context, goalId: String) {
        val intent = Intent(Intent.ACTION_VIEW).apply {
            data = Uri.parse("productivityapp://goal/$goalId")
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        context.startActivity(intent)
    }
}