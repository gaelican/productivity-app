module.exports = {
  dependencies: {
    '@react-native-async-storage/async-storage': {
      platforms: {
        android: null, // Disable Android platform
        ios: null,     // Disable iOS platform
      },
    },
    '@react-native-community/async-storage': {
      platforms: {
        android: null,
        ios: null,
      },
    },
  },
};
