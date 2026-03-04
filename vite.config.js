import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    strictPort: true,
    host: true,
    hmr: {
      host: 'localhost',
      protocol: 'ws',
      clientPort: 3001,
    },
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    target: 'es2020',
    // Enable minification and tree-shaking
    minify: 'esbuild',
    // CSS code splitting for parallel loading
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'services': [
            './src/services/quranAPI.js',
            './src/services/warshService.js',
            './src/services/audioService.js',
            './src/services/storageService.js',
          ],
          'data': [
            './src/data/surahs.js',
            './src/data/juz.js',
            './src/data/reciters.js',
            './src/data/tajwidRules.js',
          ],
        },
      },
    },
  },
});
