import adapter from 'sveltekit-adapter-chrome-extension';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	extensions: [ '.svelte' ],

	preprocess: vitePreprocess( { script: true } ),

	onwarn: ( warning, handler ) => {
		if ( warning.code.startsWith( 'a11y-' ) ) {
			return;
		}
		handler( warning );
	},

	kit: {
		adapter: adapter( {
			// Default options
			pages: 'build',
			assets: 'build',
			fallback: null,
			precompress: false,
		} ),

		alias: {
			'@yakkl/uniswap-alpha-router-service': '../uniswap-alpha-router-service/src',
		},

		appDir: 'app',
	},
};

export default config;
