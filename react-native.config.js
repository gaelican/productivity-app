module.exports = {
  project: {
    android: {
      sourceDir: './android',
    },
  },
  dependencies: {
    // Disable AsyncStorage autolinking to configure manually
    '@react-native-async-storage/async-storage': {
      platforms: {
        android: null,
        ios: null,
      },
    },
  },
};
