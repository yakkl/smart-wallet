import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import path from 'path';
import replace from '@rollup/plugin-replace';
import fs from 'fs';
import { isoImport } from 'vite-plugin-iso-import';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import { viteStaticCopy } from 'vite-plugin-static-copy';

const htmlContent = fs.readFileSync(path.resolve('static/snippet-terms.html'), 'utf-8');

export default defineConfig({
  plugins: [
    replace({
      '___HTML_SNIPPET___': htmlContent,
      preventAssignment: true,
    }),
    sveltekit(),
    isoImport(),
    nodePolyfills(),
    viteStaticCopy({
      targets: [
        {
          src: '_locales',
          dest: ''
        }
      ]
    }),
  ],
  resolve: {
    alias: {
      $base: path.resolve('./src'),
      $static: path.resolve('./src/static'),
      $lib: path.resolve('./src/lib'),
      $components: path.resolve('./src/lib/components'),
      $routes: path.resolve('./src/routes'),
      $plugins: path.resolve('./src/lib/plugins'),
      'webextension-polyfill': path.resolve(__dirname, 'node_modules/webextension-polyfill/dist/browser-polyfill.min.js'),
      stream: 'readable-stream',
    },
  },
  define: {
    __version__: JSON.stringify(process.env.npm_package_version),
    'process.env.DEV_DEBUG': process.env.DEV_DEBUG || false,
  },
  optimizeDeps: {
    exclude: ['webextension-polyfill']
  },
  ssr: {
    noExternal: ['webextension-polyfill'],
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
    rollupOptions: {
      external: ['webextension-polyfill'],
    }
  },
  test: {
    include: ['src/**/*.{test,spec}.{js,ts}'],
  },
});
