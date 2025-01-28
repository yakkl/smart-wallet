import prettier from 'eslint-config-prettier';
import js from '@eslint/js';
import { includeIgnoreFile } from '@eslint/compat';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import { fileURLToPath } from 'node:url';
import * as svelteParser from 'svelte-eslint-parser';
import ts from '@typescript-eslint/parser';
import svelteConfig from './svelte.config.js';

const gitignorePath = fileURLToPath(new URL('./.gitignore', import.meta.url));

export default ts.config(
	includeIgnoreFile(gitignorePath),
	js.configs.recommended,
  ...ts.configs.recommended,
	...svelte.configs.recommended,
	// ...svelte.configs['flat/recommended'],
	prettier,
	// ...svelte.configs['flat/prettier'],
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node
			}
		}
	},
	{
		files: [
      '**/*.svelte',
      '*.svelte',
      '**/*.svelte.ts',
      '*.svelte.ts',
      '**/*.svelte.js',
      '*.svelte.js'
    ],
		languageOptions: {
      parser: svelteParser,
			parserOptions: {
        svelteConfig,
				parser: ts,
        project: './tsconfig.json',
        extraFileExtensions: ['.svelte']
			},
			globals: {
				...globals.browser,
				...globals.node
			}
		}
	},
  {
    rules: {

    },
  }
);

// export default ts.config(
// 	includeIgnoreFile(gitignorePath),
// 	js.configs.recommended,
// 	...ts.configs.recommended,
// 	...svelte.configs['flat/recommended'],
// 	prettier,
// 	...svelte.configs['flat/prettier'],
// 	{
// 		languageOptions: {
// 			globals: {
// 				...globals.browser,
// 				...globals.node
// 			}
// 		}
// 	},
// 	{
// 		files: ['**/*.svelte', '*.svelte'],

// 		languageOptions: {
// 			parserOptions: {
// 				parser: ts.parser
// 			}
// 		}
// 	}
// );
