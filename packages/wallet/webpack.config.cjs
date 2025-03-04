/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    background: ['./src/lib/extensions/chrome/background.ts'],
    content: ['./src/lib/extensions/chrome/content.ts'],
    inpage: ['./src/lib/extensions/chrome/inpage.ts'],
    sandbox: ['./src/lib/extensions/chrome/sandbox.ts'],
  },
  mode: 'production',
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'static/ext'),
    publicPath: '/'
  },
  optimization: {
    minimize: true, //false
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          mangle: true, //true, -
          compress: false,
          keep_classnames: true,
          keep_fnames: true,
          output: {
            beautify: false, //true,
            indent_level: 2,
          },
        },
      }),
    ],
    // splitChunks: {
    //   chunks: 'all', // Splits common dependencies into separate files
    // },
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: [
          path.resolve(__dirname, 'node_modules'),
          path.resolve(__dirname, '../../node_modules'),
          path.resolve(__dirname, '../uniswap-alpha-router-service/node_modules')
        ],
        use: [
          {
            loader: 'ts-loader',
            options: {
              configFile: path.resolve(__dirname, 'tsconfig.json'),
              compilerOptions: {
                module: 'esnext',
              },
            },
          },
        ],
      },
    ],
  },
  resolve: {
    modules: [
      path.resolve(__dirname, 'src'),
      'node_modules',
      // path.resolve(__dirname, '../../node_modules') // Add this to resolve from root node_modules
    ],
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      'process/browser': require.resolve( 'process/browser' ),
      'webextension-polyfill': path.resolve(__dirname, 'node_modules/webextension-polyfill/dist/browser-polyfill.js'),
      '$lib': path.resolve(__dirname, 'src/lib'),
      '$lib/common': path.resolve(__dirname, 'src/lib/common'),
      '$plugins': path.resolve(__dirname, 'src/lib/plugins'),
      '$lib/plugins': path.resolve(__dirname, 'src/lib/plugins'),
    },
    fallback: {
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      vm: require.resolve( 'vm-browserify' ),
      process: require.resolve( 'process/browser' ),
      events: require.resolve( 'events/' ),
    },
  },
  plugins: [
    new webpack.ProvidePlugin({
      browser: 'webextension-polyfill', // browser_ext: ['$lib/browser-polyfill-wrapper', 'browser_ext'],
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer']
    }),
    new CopyPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, 'node_modules/webextension-polyfill/dist/browser-polyfill.js'),
          to: path.resolve(__dirname, 'static/ext/browser-polyfill.js')
        },
      ],
    }),
  ]
};
