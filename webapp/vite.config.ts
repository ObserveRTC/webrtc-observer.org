import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';

export default defineConfig({ 
	plugins: [ solidPlugin() ], 
	server: { port: 3000 }, 
	build: { 
		outDir: 'build',
		target: 'esnext' 
	},
	optimizeDeps: { 
		exclude: [
			'fsevents',
			'@observertc/client-monitor-js'
		] 
	},
	// https://vitejs.dev/config/
	// optimizeDeps: {
	// 	exclude: ['@observertc/client-monitor-js']
	// },
});
