import { defineConfig } from 'vite';
// @ts-ignore
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
  ],
  optimizeDeps: {
    exclude: ['@journeyapps/wa-sqlite', '@powersync/web'],
    include: ['@powersync/web > uuid', '@powersync/web > event-iterator', '@powersync/web > js-logger']
  },
  worker: {
    format: 'es',
    plugins: () => [react()]
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    },
    target: 'esnext'
  }
});