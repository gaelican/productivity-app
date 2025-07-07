# React Native 0.73.x Downgrade Plan

## Version Compatibility Matrix
- **Current**: React Native 0.74.5 + Expo SDK 51
- **Target**: React Native 0.73.9 + Expo SDK 50

## Dependencies to Update

### Core Dependencies
```json
{
  "react-native": "0.73.9",
  "expo": "~50.0.0",
  "react": "18.2.0"  // Keep same
}
```

### Metro & Babel
```json
{
  "metro-react-native-babel-preset": "0.76.8",
  "@babel/core": "^7.20.0",
  "@babel/preset-env": "^7.20.0"
}
```

### Expo Modules to Downgrade
- All expo modules should use SDK 50 compatible versions
- Will be handled automatically by `npx expo install --fix`

## Step-by-Step Process

1. **Backup current state**
   - Already on branch: `downgrade-to-rn-073`
   - Current commit saved

2. **Update package.json**
   - Change React Native version
   - Change Expo SDK version
   - Update metro babel preset

3. **Clean install**
   ```bash
   rm -rf node_modules package-lock.json
   rm -rf android/build android/app/build
   npm install
   ```

4. **Fix Expo dependencies**
   ```bash
   npx expo install --fix
   ```

5. **Update Android configuration**
   - Gradle wrapper may need adjustment
   - Check for RN 0.73 specific settings

6. **Test build**
   ```bash
   eas build --platform android --profile production
   ```

## Expected Outcomes
- ✅ EAS Build should work (RN 0.73 has gradle plugin in Maven)
- ✅ All native modules should be compatible
- ⚠️ May lose some RN 0.74 features
- ⚠️ Some dependencies might need version adjustments

## Rollback Plan
If downgrade fails:
```bash
git checkout master
git branch -D downgrade-to-rn-073
```