import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

export default defineConfig({
  plugins: [preact()],
  server: {
    port: 5173,
    proxy: {
      '/api': `http://localhost:${process.env.MPV_TRACKER_PORT || 8080}`
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});
