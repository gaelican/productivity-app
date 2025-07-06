export default {
  expo: {
    name: 'Todo App with Widget',
    slug: 'todo-app-widget',
    version: '1.0.0',
    platforms: ['android'],
    android: {
      package: 'com.todoapp.widget',
    },
    plugins: [
      [
        '@todo-app/widget-bridge/plugin',
        {
          widgetName: process.env.WIDGET_NAME || 'TodoWidget',
          updateInterval: parseInt(process.env.WIDGET_UPDATE_INTERVAL || '30', 10),
        },
      ],
    ],
  },
};