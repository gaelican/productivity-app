# Quick Testing Guide for Todo App

Since building an APK in Termux requires a complex setup, here are immediate ways to test the app:

## 1. Web Version (Already Running!)

The app is currently running in web mode. To access it:

1. **Open your browser** on your Android device
2. **Navigate to**: `http://localhost:19006`
3. **Test features**:
   - Create tasks with natural language (e.g., "Buy milk tomorrow 5pm")
   - Mark tasks complete
   - Edit tasks
   - View different screens

## 2. PWA Installation (Web App on Home Screen)

You can install the web version as a Progressive Web App:

1. Open Chrome on your Android
2. Go to `http://localhost:19006`
3. Tap the menu (three dots)
4. Select "Add to Home screen"
5. Name it "Todo App"
6. Now you have an app icon that opens the web version!

## 3. Expo Go Testing

For a more native experience:

1. **Install Expo Go** from Play Store
2. **Find your IP address**:
   ```bash
   ip addr show wlan0 | grep inet
   ```
3. **Start Expo** (new terminal):
   ```bash
   cd /data/data/com.termux/files/home/monorepo-todo-app/apps/mobile
   npx expo start --tunnel
   ```
4. **Scan QR code** in Expo Go app

## 4. Widget Testing (Requires APK)

The widget implementation is complete but needs an APK. Your options:

### Option A: Use EAS Build (Cloud)
```bash
# Install EAS
npm install -g eas-cli

# Login (create free account)
eas login

# Build APK
eas build --platform android --profile preview
```

### Option B: Transfer Project
1. Copy project to a PC with Android Studio
2. Run: `./gradlew assembleDebug`
3. Install APK on your phone

## 5. What's Working in the Code

### ✅ Implemented Features:
- **Task Management**: Create, edit, complete, delete tasks
- **Natural Language**: "Buy milk tomorrow 5pm" parsing
- **Widget Bridge**: Native module for widget communication
- **Widget Provider**: Full Android widget implementation
- **Deep Linking**: productivityapp:// URL scheme
- **Data Sync**: Automatic widget updates from app

### 📱 Widget Features (Need APK):
- 3 sizes: Small (2x2), Medium (4x2), Large (4x4)
- Interactive checkboxes for task completion
- Deep links to open specific tasks
- Manual refresh button
- 30-minute auto-update

## 6. Testing Checklist

### In Web Version:
- [ ] Create a task with natural language
- [ ] Mark task as complete
- [ ] Edit task details
- [ ] Check responsive design
- [ ] Test navigation between screens

### In Expo Go:
- [ ] Test native feel
- [ ] Check animations
- [ ] Verify gestures work
- [ ] Test performance

### With APK (Future):
- [ ] Add widget to home screen
- [ ] Complete task from widget
- [ ] Tap task to open app
- [ ] Test widget refresh
- [ ] Verify deep links

## Current Status

- **Web Server**: Running at http://localhost:19006
- **Widget Code**: Complete and ready
- **APK Build**: Requires Java/Gradle setup

## Next Steps

1. **Test the web version** now
2. **Try Expo Go** for native feel
3. **Use EAS Build** for APK with widgets
4. **Or transfer** to PC for local build

The core app functionality is ready to test in your browser right now!