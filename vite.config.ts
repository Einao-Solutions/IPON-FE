import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	},
	optimizeDeps: {
		include: [
			'ajv/dist',
			'immutable-json-patch',
			'lodash-es',
			'@fortawesome/free-regular-svg-icons',
			'codemirror-wrapped-line-indent/dist',
			'@codemirror/language',
			'jmespath',
			'svelte-jsoneditor'
]
	}
});
