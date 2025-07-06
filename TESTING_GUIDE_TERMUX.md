# Testing React Native App from Termux on Android

This guide provides instructions for testing the React Native app from Termux on Android, where native Android compilation isn't directly available.

## Prerequisites

### 1. Install Expo CLI Globally (if not already installed)

First, check if Expo is installed:
```bash
npx expo --version
```

If not installed globally, you can use npx (recommended) or install globally:
```bash
# Using npx (recommended - no global install needed)
npx expo start

# OR install globally
npm install -g expo
```

### 2. Install Dependencies

From the mobile app directory:
```bash
cd /data/data/com.termux/files/home/monorepo-todo-app/apps/mobile
npm install
```

## Testing Options

### Option 1: Web Testing (Recommended for Termux)

The easiest way to test from Termux is using the web version:

```bash
# Run the app in web mode
npm run web

# Or use the custom test script (see below)
./test-web.sh
```

This will start the Expo development server and open the app in your web browser. The web version supports most features including widget sync functionality.

### Option 2: Using Expo Go App

1. Install the Expo Go app from Google Play Store on your Android device
2. Make sure your device and Termux are on the same network
3. Run the development server:
   ```bash
   npm start
   ```
4. In the terminal output, you'll see a QR code
5. Open Expo Go app and scan the QR code
6. The app will load on your device

**Note**: Since Termux runs in a sandbox, you may need to:
- Use the tunnel option: `npx expo start --tunnel`
- Or manually enter the URL shown in Expo Go

### Option 3: Web-Only Test Script

Use the provided test script for focused web testing with widget sync:
```bash
./test-web.sh
```

This script:
- Starts the web server on a specific port
- Opens the app in your browser
- Displays widget sync status
- Shows console logs for debugging

## Testing Widget Sync Functionality

The web version includes a widget sync indicator that shows:
- Connection status
- Last sync time
- Number of synced tasks

To test widget sync:
1. Run the app in web mode
2. Create or modify tasks
3. Check the sync indicator in the header
4. View console logs for detailed sync information

## Troubleshooting

### Port Already in Use
If you get a port error, you can specify a different port:
```bash
PORT=8082 npm run web
```

### Network Issues
If Expo Go can't connect:
1. Try using tunnel mode: `npx expo start --tunnel`
2. Check your firewall settings
3. Ensure both devices are on the same network

### Module Resolution Errors
If you encounter module errors:
```bash
# Clear cache and reinstall
npm run clean
rm -rf node_modules
npm install
```

### Termux-Specific Issues
- Make sure Node.js is properly installed: `node --version`
- Update Termux packages: `pkg update && pkg upgrade`
- Install required build tools: `pkg install nodejs python build-essential`

## Development Tips

1. **Hot Reloading**: The web version supports hot reloading. Save your changes and they'll appear instantly.

2. **Chrome DevTools**: Press F12 in Chrome to open DevTools for debugging.

3. **Console Logs**: View widget sync logs in the browser console.

4. **Responsive Design**: Test different screen sizes using Chrome's device emulator.

## Limitations

When testing from Termux:
- Native device features (camera, GPS, etc.) won't work in web mode
- Some React Native specific APIs may not be available
- Performance may differ from the native app

For full native testing, consider:
- Using a separate development machine
- Setting up remote development
- Using cloud-based development environments

## Quick Commands Reference

```bash
# Start web development server
npm run web

# Run with specific port
PORT=8082 npm run web

# Start with tunnel (for Expo Go)
npx expo start --tunnel

# Run custom test script
./test-web.sh

# Clean and restart
npm run clean && npm install && npm run web

# Check logs
npx expo start --web --dev --log
```