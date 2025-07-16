# GitHub Actions Build Guide

This guide explains how to use GitHub Actions to build the React Native Android app with full access to build logs.

## Overview

GitHub Actions provides a complete CI/CD environment where we can:
- Build Android APKs with full log visibility
- Download build artifacts
- Debug build issues with detailed error messages
- Cache dependencies for faster builds

## Quick Start

### 1. Trigger a Build

You have several options to trigger a build:

#### Option A: Push to a tracked branch
```bash
git add .
git commit -m "Trigger GitHub Actions build"
git push origin downgrade-to-rn-073
```

#### Option B: Manual workflow dispatch
1. Go to: https://github.com/gaelican/productivity-app/actions
2. Click on "Build Android APK" workflow
3. Click "Run workflow"
4. Select branch and build type
5. Enable verbose logs if needed

### 2. Monitor the Build

1. Visit: https://github.com/gaelican/productivity-app/actions
2. Click on the running workflow
3. Click on the "build" job
4. Watch real-time logs for each step

### 3. Access Build Logs

If a build fails:
1. The logs are immediately visible in the GitHub Actions UI
2. Failed builds automatically upload Gradle logs as artifacts
3. Download the `gradle-build-logs-{commit-sha}` artifact for detailed error analysis

### 4. Download the APK

For successful builds:
1. Go to the workflow run page
2. Scroll to "Artifacts" section
3. Download `app-debug-{commit-sha}` or `app-release-{commit-sha}`

## Workflow Features

### Build Types
- **Debug**: Default build with debugging enabled
- **Release**: Production-ready build (requires signing configuration)

### Verbose Logging
- Enable verbose logs to see detailed Gradle output
- Helpful for debugging dependency resolution issues

### Caching
The workflow caches:
- Node modules
- Gradle dependencies
- Gradle wrapper
- Build outputs (for incremental builds)

### Error Handling
- Automatic log upload on failure
- Detailed stack traces with `--stacktrace` flag
- Build reports saved as artifacts

## Troubleshooting

### Common Issues

1. **Gradle version mismatch**
   - Check `android/gradle/wrapper/gradle-wrapper.properties`
   - Ensure it matches React Native 0.73.6 requirements

2. **SDK version issues**
   - Verify `compileSdkVersion` in `android/app/build.gradle`
   - Should be 34 for this project

3. **Memory issues**
   - The workflow sets `GRADLE_OPTS` with 4GB heap
   - Adjust if needed in the workflow file

### Viewing Detailed Logs

1. In the failed workflow run, expand the failed step
2. Look for lines starting with:
   - `FAILURE:` - Main error message
   - `* What went wrong:` - Gradle error details
   - `Caused by:` - Root cause

3. Download the build logs artifact for complete Gradle output

## Local Testing

Before pushing to GitHub, test locally:

```bash
cd android
./gradlew clean
./gradlew assembleDebug --stacktrace
```

## Workflow Configuration

The workflow file is located at: `.github/workflows/android-build.yml`

Key configuration options:
- `timeout-minutes`: Set to 45 for large builds
- `GRADLE_OPTS`: Memory settings for Gradle
- `cache`: Configured for optimal performance

## Next Steps

1. Push your changes to trigger a build
2. Monitor the workflow at: https://github.com/gaelican/productivity-app/actions
3. Review any build errors in the logs
4. Download and test the APK on your device

## Benefits Over EAS Build

- **Full log access**: Every line of output is visible
- **No authentication needed**: Uses GitHub's infrastructure
- **Free for public repos**: 2000 minutes/month for private repos
- **Artifact storage**: 500MB free storage
- **Better debugging**: Can add custom debug steps

## Support

If you encounter issues:
1. Check the workflow logs first
2. Download the build artifacts for detailed error logs
3. Review this guide's troubleshooting section
4. Check React Native 0.73.6 documentation for compatibility