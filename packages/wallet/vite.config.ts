import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import path from 'path';
import replace from '@rollup/plugin-replace';
import fs from 'fs';
import { isoImport } from 'vite-plugin-iso-import';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import { viteStaticCopy } from 'vite-plugin-static-copy';

const htmlContent = fs.readFileSync( path.resolve( 'static/snippet-terms.html' ), 'utf-8' );

export default defineConfig( {
  plugins: [
    replace( {
      '___HTML_SNIPPET___': htmlContent,
      preventAssignment: true,
    } ),
    sveltekit(),
    isoImport(),
    nodePolyfills( {
      protocolImports: true, // Enable protocol imports
    } ),
    viteStaticCopy( {
      targets: [
        {
          src: '_locales',
          dest: ''
        }
      ]
    } ),
  ],
  resolve: {
    alias: {
      process: 'process/browser',
      $base: path.resolve( './src' ),
      $static: path.resolve( './src/static' ),
      $lib: path.resolve( './src/lib' ),
      $components: path.resolve( './src/lib/components' ),
      $routes: path.resolve( './src/routes' ),
      $plugins: path.resolve( './src/lib/plugins' ),
      'webextension-polyfill': path.resolve( __dirname, 'node_modules/webextension-polyfill/dist/browser-polyfill.min.js' ),
      stream: 'readable-stream',
      // ethers: path.resolve( 'node_modules/ethers' ), // replace require.resolve() with path.resolve()
      ethersv5: path.resolve( 'node_modules/ethers-v5' ), // replace require.resolve() with path.resolve()
    },
  },
  define: {
    'process.env': {},
    __version__: JSON.stringify( process.env.npm_package_version ),
    'process.env.DEV_DEBUG': process.env.DEV_DEBUG || false,
  },
  optimizeDeps: {
    exclude: [ 'webextension-polyfill' ],
    include: [
      'axios',
      'ethers-v5',
      '@uniswap/smart-order-router',
      '@ethersproject/abstract-provider',
      '@ethersproject/abstract-signer'
    ],
    esbuildOptions: {
      define: {
        global: 'globalThis'
      }
    },
  },
  ssr: {
    noExternal: [ 'webextension-polyfill' ],
  },
  build: {
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: false,
      mangle: false,
      keep_classnames: true,
      keep_fnames: true,
      format: {
        beautify: true,
      },
    },
    commonjsOptions: {
      transformMixedEsModules: true,
      include: [
        /node_modules/,
        /@uniswap\/smart-order-router/,
        /ethers-v5/
      ]
    },
    rollupOptions: {
      external: [ 'webextension-polyfill' ],
    }
  },
  test: {
    include: [ 'src/**/*.{test,spec}.{js,ts}' ],
  },
} );



// import { sveltekit } from '@sveltejs/kit/vite';
// import { defineConfig } from 'vitest/config';
// import path from 'path';
// import replace from '@rollup/plugin-replace';
// import fs from 'fs';
// import { isoImport } from 'vite-plugin-iso-import';
// import { nodePolyfills } from 'vite-plugin-node-polyfills';
// import { viteStaticCopy } from 'vite-plugin-static-copy';

// const htmlContent = fs.readFileSync(path.resolve('static/snippet-terms.html'), 'utf-8');

// export default defineConfig({
//   plugins: [
//     replace({
//       '___HTML_SNIPPET___': htmlContent,
//       preventAssignment: true,
//     } ),
//     sveltekit(),
//     isoImport(),
//     nodePolyfills( {
//       protocolImports: true, // Enable protocol imports
//     }),
//     viteStaticCopy({
//       targets: [
//         {
//           src: '_locales',
//           dest: ''
//         }
//       ]
//     }),
//   ],
//   resolve: {
//     alias: {
//       process: 'process/browser',
//       $base: path.resolve('./src'),
//       $static: path.resolve('./src/static'),
//       $lib: path.resolve('./src/lib'),
//       $components: path.resolve('./src/lib/components'),
//       $routes: path.resolve('./src/routes'),
//       $plugins: path.resolve('./src/lib/plugins'),
//       'webextension-polyfill': path.resolve(__dirname, 'node_modules/webextension-polyfill/dist/browser-polyfill.min.js'),
//       stream: 'readable-stream',
//       ethers: require.resolve( 'ethers' ),
//       ethersv5: require.resolve( 'ethers-v5' ),
//       'ethers/lib/utils': 'ethers-v5/lib/utils',
//       'ethers/lib': 'ethers-v5/lib',
//       '@ethersproject/abstract-provider': path.resolve( 'node_modules/@ethersproject/abstract-provider' ),
//       '@ethersproject/abstract-signer': path.resolve( 'node_modules/@ethersproject/abstract-signer' ),
//     },
//   },
//   define: {
//     'process.env': {},
//     __version__: JSON.stringify(process.env.npm_package_version),
//     'process.env.DEV_DEBUG': process.env.DEV_DEBUG || false,
//   },
//   optimizeDeps: {
//     exclude: [ 'webextension-polyfill' ],
//     include: [
//       'axios',
//       'ethers-v5',
//       '@uniswap/smart-order-router',
//       '@ethersproject/abstract-provider',
//       '@ethersproject/abstract-signer'
//     ],
//     esbuildOptions: {
//       // target: 'esnext', // Ensure compatibility with modern JavaScript features.
//       define: {
//         global: 'globalThis'
//       }
//     },
//   },
//   ssr: {
//     noExternal: ['webextension-polyfill'],
//   },
//   build: {
//     sourcemap: true,
//     minify: 'terser',
//     terserOptions: {
//       compress: false,
//       mangle: false,
//       keep_classnames: true,
//       keep_fnames: true,
//       format: {
//         beautify: true,
//       },
//     },
//     commonjsOptions: {
//       transformMixedEsModules: true,
//       include: [
//         /node_modules/,
//         /@uniswap\/smart-order-router/,
//         /ethers-v5/
//       ]
//     },
//     rollupOptions: {
//       external: ['webextension-polyfill'],
//     }
//   },
//   test: {
//     include: ['src/**/*.{test,spec}.{js,ts}'],
//   },
// });
