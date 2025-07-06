module.exports = {
  project: {
    android: {
      sourceDir: './android',
    },
  },
  dependencies: {
    // Disable autolinking for packages that might cause issues
    '@react-native-async-storage/async-storage': {
      platforms: {
        android: {
          sourceDir: '../node_modules/@react-native-async-storage/async-storage/android',
        },
      },
    },
  },
};