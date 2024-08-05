/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    background: ['./src/lib/extensions/chrome/background.ts'],
    content: ['./src/lib/extensions/chrome/content.ts'],
    inpage: ['./src/lib/extensions/chrome/inpage.ts']
  },
  mode: 'production',
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'static/js'),
  },
  optimization: {
    minimize: false,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          mangle: false,
          compress: false,
          keep_classnames: true,
          keep_fnames: true,
          output: {
            beautify: true,
            indent_level: 2,
          },
        },
      }),
    ],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: false,
              configFile: path.resolve(__dirname, 'tsconfig.json'),
              compilerOptions: {
                module: 'esnext',
              },
            },
          },
        ],
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      'webextension-polyfill': path.resolve(__dirname, 'node_modules/webextension-polyfill/dist/browser-polyfill.js'),
      '$lib': path.resolve(__dirname, 'src/lib'),
      '$lib/common': path.resolve(__dirname, 'src/lib/common'),
      '$plugins': path.resolve(__dirname, 'src/lib/plugins'),
      '$lib/plugins': path.resolve(__dirname, 'src/lib/plugins'),
    },
    fallback: {
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      vm: require.resolve('vm-browserify')
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
          to: path.resolve(__dirname, 'static/js/browser-polyfill.js')
        },
      ],
    }),
  ]
};


// module.exports = {
//   entry: {
//     background: ['webextension-polyfill', './src/lib/extensions/chrome/background.ts'],
//     content: ['webextension-polyfill', './src/lib/extensions/chrome/content.ts'],
//     inpage: ['webextension-polyfill', './src/lib/extensions/chrome/inpage.ts']
//   },
//   mode: 'production',
//   output: {
//     filename: '[name].js',
//     path: path.resolve(__dirname, 'static/js'),
//   },
//   optimization: {
//     minimize: false,
//     minimizer: [
//       new TerserPlugin({
//         terserOptions: {
//           mangle: false,
//           compress: false,
//           keep_classnames: true,
//           keep_fnames: true,
//           output: {
//             beautify: true,
//             indent_level: 2,
//           },
//         },
//       }),
//     ],
//   },
//   module: {
//     rules: [
//       {
//         test: /\.(ts|js)$/,
//         exclude: /node_modules/,
//         use: {
//           loader: 'ts-loader',
//         }
//       },
//     ],
//   },
//   resolve: {
//     extensions: ['.ts', '.js'],
//     alias: {
//       'webextension-polyfill': path.resolve(__dirname, 'node_modules/webextension-polyfill/dist/browser-polyfill.min.js'),
//     },
//     fallback: {
//       crypto: require.resolve('crypto-browserify'),
//       stream: require.resolve('stream-browserify'),
//       vm: require.resolve('vm-browserify')
//     },
//   },
//   plugins: [
//     new webpack.ProvidePlugin({
//       browser: 'webextension-polyfill',
//       process: 'process/browser',
//       Buffer: ['buffer', 'Buffer']
//     }),
//     new CopyPlugin({
//       patterns: [
//         { 
//           from: path.resolve(__dirname, 'node_modules/webextension-polyfill/dist/browser-polyfill.min.js'),
//           to: path.resolve(__dirname, 'static/js/browser-polyfill.min.js')
//         },
//       ],
//     }),
//   ]
// };




// /* eslint-disable @typescript-eslint/no-var-requires */
// const path = require('path');
// const TerserPlugin = require('terser-webpack-plugin');
// const webpack = require('webpack');
// const CopyPlugin = require('copy-webpack-plugin');

// module.exports = {
//   entry: {
//     background: './src/lib/extensions/chrome/background.ts',
//     content: './src/lib/extensions/chrome/content.ts',
//     inpage: './src/lib/extensions/chrome/inpage.ts'
//   },
//   mode: 'production',
//   output: {
//     filename: '[name].js',
//     path: path.resolve(__dirname, 'static/js'),
//   },
//   optimization: {
//     minimize: false,
//     minimizer: [
//       new TerserPlugin({
//         terserOptions: {
//           mangle: false,
//           compress: false,
//           keep_classnames: true,
//           keep_fnames: true,
//           output: {
//             beautify: true,
//             indent_level: 2,
//           },
//         },
//       }),
//     ],
//   },
//   module: {
//     rules: [
//       {
//         test: /\.(ts|js)$/,
//         exclude: /node_modules/,
//         use: {
//           loader: 'babel-loader',
//           options: {
//             presets: [
//               ['@babel/preset-env', { targets: "defaults" }],
//               '@babel/preset-typescript'
//             ]
//           },
//         }
//       },
//       {
//         test: /browser-polyfill\.min\.js$/,
//         use: 'exports-loader?browser'
//       },
//     ],
//   },
//   resolve: {
//     extensions: ['.ts', '.js'],
//     alias: {
//       'webextension-polyfill': path.resolve(__dirname, 'node_modules/webextension-polyfill/dist/browser-polyfill.min.js'),
//     },
//     fallback: {
//       crypto: require.resolve('crypto-browserify'),
//       stream: require.resolve('stream-browserify'),
//       vm: require.resolve('vm-browserify')
//     },
//   },
//   plugins: [
//     new webpack.ProvidePlugin({
//       browser: 'webextension-polyfill',
//       process: 'process/browser',
//       Buffer: ['buffer', 'Buffer']
//     }),
//     new CopyPlugin({
//       patterns: [
//         { 
//           from: path.resolve(__dirname, 'node_modules/webextension-polyfill/dist/browser-polyfill.min.js'),
//           to: path.resolve(__dirname, 'static/js/browser-polyfill.min.js')
//         },
//       ],
//     }),
//   ]
// };
