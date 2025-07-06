# EAS Build Step-by-Step Guide

## Step 1: Create an Expo Account

1. Open your browser and go to https://expo.dev
2. Click "Sign Up" and create a free account
3. Remember your username and password

## Step 2: Login to EAS CLI

Run this command and enter your credentials:

```bash
eas login
```

You'll be prompted for:
- Email or username
- Password

## Step 3: Configure the Project

Once logged in, run:

```bash
eas build:configure
```

This will:
- Create/update eas.json configuration
- Set up your project for cloud builds

## Step 4: Build the APK

For a development APK that you can install directly:

```bash
eas build --platform android --profile preview
```

Or for a production-ready APK:

```bash
eas build --platform android --profile production
```

## Step 5: Monitor the Build

- The CLI will show a URL to monitor your build progress
- Builds typically take 10-20 minutes
- You'll receive an email when complete

## Step 6: Download the APK

Once built:
1. The CLI will show a download URL
2. Or check your builds at: https://expo.dev/accounts/[your-username]/projects/productivity-app/builds
3. Download the APK file

## Step 7: Install on Your Device

1. Transfer the APK to your Android device
2. Enable "Install from Unknown Sources" in Settings
3. Open the APK file to install

## Troubleshooting

### If login fails:
- Make sure you've created an account at https://expo.dev
- Try using email instead of username
- Reset password if needed

### If build configuration fails:
- Make sure you're in the correct directory: `/apps/mobile`
- Check that eas.json exists

### If build fails:
- Check the build logs at the provided URL
- Common issues:
  - Missing dependencies
  - Invalid app.json configuration
  - Android package name conflicts

## Current Project Status

✅ EAS CLI installed
✅ eas.json configured
✅ Project structure ready
✅ Widget implementation complete
⏳ Awaiting login and build

## Next Command

Start with:
```bash
eas login
```