import { defineConfig } from 'vite';
// @ts-ignore
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      'dexie-react-hooks': '/src/db/localDB.ts'
    }
  },
  worker: {
    format: 'es',
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  }
});