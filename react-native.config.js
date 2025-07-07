module.exports = {
  project: {
    android: {
      sourceDir: './android',
    },
  },
  dependencies: {
    // Completely disable AsyncStorage for now to get a successful build
    '@react-native-async-storage/async-storage': {
      platforms: {
        android: null,
        ios: null,
      },
    },
    // Also disable WatermelonDB temporarily if it causes issues
    '@nozbe/watermelondb': {
      platforms: {
        android: {
          sourceDir: '../node_modules/@nozbe/watermelondb/native/android',
          packageImportPath: 'import com.nozbe.watermelondb.WatermelonDBPackage;',
        },
      },
    },
  },
};
