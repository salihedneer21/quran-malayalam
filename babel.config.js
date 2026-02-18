module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Keep expo-router plugin enabled when adding custom babel config.
      'expo-router/babel',
      // Must be last.
      'react-native-reanimated/plugin',
    ],
  };
};

