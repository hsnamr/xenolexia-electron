module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // NativeWind for Tailwind CSS support
    'nativewind/babel',

    // Module resolver for path aliases
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: [
          '.ios.js',
          '.android.js',
          '.ios.tsx',
          '.android.tsx',
          '.js',
          '.jsx',
          '.ts',
          '.tsx',
          '.json',
        ],
        alias: {
          '@': './src',
          '@app': './src/app',
          '@components': './src/components',
          '@screens': './src/screens',
          '@services': './src/services',
          '@stores': './src/stores',
          '@hooks': './src/hooks',
          '@utils': './src/utils',
          '@types': './src/types',
          '@constants': './src/constants',
          '@assets': './src/assets',
          '@navigation': './src/navigation',
        },
      },
    ],

    // Reanimated plugin (must be last)
    'react-native-reanimated/plugin',
  ],
};
