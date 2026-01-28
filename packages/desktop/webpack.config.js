const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

const appDirectory = path.resolve(__dirname);
const isDev = process.env.NODE_ENV !== 'production';
const isElectron = process.env.ELECTRON === 'true';

// Babel loader configuration
const babelLoaderConfiguration = {
  test: /\.(js|jsx|ts|tsx)$/,
  exclude:
    /node_modules\/(?!(react-native-reanimated|react-native-gesture-handler|react-native-screens|react-native-safe-area-context|@react-navigation|react-native-svg|nativewind)\/).*/,
  use: {
    loader: 'babel-loader',
    options: {
      cacheDirectory: true,
      presets: [
        ['@babel/preset-env', {targets: {browsers: ['last 2 versions']}}],
        ['@babel/preset-react', {runtime: 'automatic'}],
        '@babel/preset-typescript',
      ],
      plugins: [
        '@babel/plugin-transform-runtime',
      ],
    },
  },
};

// Image loader configuration
const imageLoaderConfiguration = {
  test: /\.(gif|jpe?g|png|svg)$/,
  type: 'asset/resource',
};

// Font loader configuration
const fontLoaderConfiguration = {
  test: /\.(woff|woff2|eot|ttf|otf)$/,
  type: 'asset/resource',
};

// CSS loader configuration
const cssLoaderConfiguration = {
  test: /\.css$/,
  use: ['style-loader', 'css-loader'],
};

module.exports = {
  entry: path.resolve(appDirectory, 'src/index.tsx'),
  output: {
    path: path.resolve(appDirectory, 'dist'),
    filename: 'bundle.[contenthash].js',
    publicPath: (isDev || isElectron) ? './' : '/',
    clean: true,
  },
  module: {
    rules: [babelLoaderConfiguration, imageLoaderConfiguration, fontLoaderConfiguration, cssLoaderConfiguration],
  },
  resolve: {
    extensions: ['.web.tsx', '.web.ts', '.web.js', '.tsx', '.ts', '.js'],
    alias: {
      // Map react-native to react-native-web
      'react-native$': path.resolve(__dirname, '../../node_modules/react-native-web'),
      // Shared package
      '@xenolexia/shared': path.resolve(__dirname, '../shared/src'),
      // Path aliases for desktop package
      '@': path.resolve(appDirectory, 'src'),
      '@components': path.resolve(appDirectory, 'src/components'),
      '@screens': path.resolve(appDirectory, 'src/screens'),
      '@navigation': path.resolve(appDirectory, 'src/navigation'),
      '@theme': path.resolve(appDirectory, 'src/theme'),
      '@app': path.resolve(appDirectory, 'src/app'),
      // Web mocks for native modules
      'react-native-fs': path.resolve(__dirname, 'src/mocks/react-native-fs.electron.ts'),
      'react-native-document-picker': path.resolve(__dirname, '../../packages/mobile/src/mocks/react-native-document-picker.web.ts'),
      'react-native-sqlite-storage': path.resolve(__dirname, '../../packages/mobile/src/mocks/react-native-sqlite-storage.web.ts'),
      'react-native-webview': path.resolve(__dirname, '../../packages/mobile/src/mocks/react-native-webview.web.tsx'),
    },
    fallback: {
      crypto: false,
      stream: false,
      buffer: false,
      fs: false,
      path: false,
    },
  },
  plugins: [
    new webpack.DefinePlugin({
      __DEV__: JSON.stringify(isDev),
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(appDirectory, 'public/index.html'),
      filename: 'index.html',
      scriptLoading: 'defer',
    }),
  ],
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  devtool: process.env.NODE_ENV === 'production' ? 'source-map' : 'eval-source-map',
};
