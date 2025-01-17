import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
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
    nodePolyfills({
      protocolImports: true,
    }),
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
      'webextension-polyfill': path.resolve( __dirname, 'node_modules/webextension-polyfill/dist/browser-polyfill.js' ),
      stream: 'stream-browserify',
      ethersv6: path.resolve( 'node_modules/ethers-v6' ),
      ethers: path.resolve( 'node_modules/ethers' ),
      '@yakkl/uniswap-alpha-router-service': '../uniswap-alpha-router-service/src',
      'events': 'events',
    },
  },
  define: {
    'process.env': {},
    __version__: JSON.stringify( process.env.npm_package_version ),
    'process.env.DEV_DEBUG': process.env.DEV_DEBUG || false,
  },
  optimizeDeps: {
    exclude: [
      'webextension-polyfill',
      '**/*.tmp/**/*',  // Exclude .tmp directories - the .tmp items here do not seem to be working as expected. I will keep it and handle it another way.
      '**/*.tmp',       // Exclude .tmp files
    ],
    entries: [
      '!**/*.tmp/**/*',  // Exclude .tmp directories
      '!**/*.tmp',       // Exclude .tmp files
    ],
    esbuildOptions: {
      define: {
        global: 'globalThis'
      }
    },
  },
  ssr: {
    noExternal: [ 'webextension-polyfill', '@walletconnect/web3wallet', '@walletconnect/core' ],
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
      ]
    },
    rollupOptions: {
      external: [
        'webextension-polyfill',
      ],
    }
  },
} );
