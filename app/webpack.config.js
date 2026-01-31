const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

const appDirectory = path.resolve(__dirname);
const isDev = process.env.NODE_ENV !== 'production';
const isElectron = process.env.ELECTRON === 'true';

// Babel loader configuration
const babelLoaderConfiguration = {
  test: /\.(js|jsx|ts|tsx)$/,
  exclude: /node_modules/,
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
      '@xenolexia/shared': path.resolve(__dirname, '../lib/src'),
      '@': path.resolve(appDirectory, 'src'),
      '@components': path.resolve(appDirectory, 'src/components'),
      '@screens': path.resolve(appDirectory, 'src/screens'),
      '@navigation': path.resolve(appDirectory, 'src/navigation'),
      '@theme': path.resolve(appDirectory, 'src/theme'),
      '@app': path.resolve(appDirectory, 'src/app'),
      'empty-node-fs': path.resolve(__dirname, 'src/mocks/empty-node-module.js'),
      'node:assert': 'assert',
      'node:crypto': 'crypto',
      'node:events': 'events',
      'node:path': 'path',
      'node:process': 'process',
      'node:stream': 'stream',
      'node:util': 'util',
    },
    fallback: {
      assert: require.resolve('assert/'),
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      buffer: require.resolve('buffer/'),
      path: require.resolve('path-browserify'),
      process: require.resolve('process/browser.js'),
      util: require.resolve('util/'),
      events: require.resolve('events/'),
      vm: require.resolve('vm-browserify'),
      fs: false,
    },
  },
  plugins: [
    new webpack.DefinePlugin({
      __DEV__: JSON.stringify(isDev),
    }),
    // Provide global process for Node polyfills (e.g. util) that expect it
    new webpack.ProvidePlugin({
      process: require.resolve('process/browser.js'),
    }),
    // Use IPC stub for DatabaseService in renderer so DB runs only in main process
    new webpack.NormalModuleReplacementPlugin(
      /[\\/]DatabaseService\.electron(\.ts)?$/,
      path.resolve(__dirname, 'src/services/DatabaseService.renderer.ts'),
    ),
    // Rewrite node: protocol requests to polyfill paths so webpack doesn't hit UnhandledSchemeError
    new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
      const name = resource.request.slice(5); // 'node:assert' -> 'assert'
      const map = {
        assert: require.resolve('assert/'),
        crypto: require.resolve('crypto-browserify'),
        events: require.resolve('events/'),
        path: require.resolve('path-browserify'),
        process: require.resolve('process/browser.js'),
        stream: require.resolve('stream-browserify'),
        util: require.resolve('util/'),
        fs: 'empty-node-fs',
        os: require.resolve('os-browserify/browser.js'),
      };
      if (map[name]) {
        resource.request = map[name];
      }
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
