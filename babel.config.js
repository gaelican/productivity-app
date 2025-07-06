module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Required for WatermelonDB decorators
      ['@babel/plugin-proposal-decorators', { legacy: true }],
      ['@babel/plugin-transform-class-properties', { loose: true }],
      // Required for React Native Reanimated (must be last)
      'react-native-reanimated/plugin',
    ],
  };
};