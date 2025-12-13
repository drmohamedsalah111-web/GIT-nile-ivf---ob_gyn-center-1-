import { defineConfig } from 'vite';
// @ts-ignore
import react from '@vitejs/plugin-react';

import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto', // Use VitePWA's auto-registration (better for offline WASM)
      devOptions: {
        enabled: false,
        type: 'module',
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'Nile IVF Center',
        short_name: 'Nile IVF',
        description: 'Comprehensive IVF and Obstetrics Management System',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#00838f',
        orientation: 'portrait',
        scope: '/',
        lang: 'ar-EG',
        dir: 'ltr',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        categories: ['medical', 'health', 'productivity']
      },
      workbox: {
        // CRITICAL: Offline-first WASM/Worker asset caching
        // PowerSync/wa-sqlite load WASM bundles + worker threads from /assets at runtime.
        // Without proper precaching, offline reload crashes: ERR_INTERNET_DISCONNECTED
        // Solution: Precache all assets including large WASM binaries
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,wasm}'],
        // wa-sqlite-async WASM is ~4.5 MiB (exceeds default 2 MiB Workbox limit)
        // Increase limit to ensure WASM is precached on first install
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024, // 6 MiB for safety margin
        // Prevent service worker from caching API requests
        ignoreURLParametersMatching: [/^utm_/, /^fbclid$/],
        runtimeCaching: [
          // WASM binaries: CacheFirst (precached on install, rarely change)
          {
            urlPattern: /\/assets\/.*\.wasm$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'wasm-binaries-cache',
              cacheableResponse: {
                statuses: [0, 200]
              },
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          },
          // Web worker chunks: CacheFirst (needed for offline SQLite operations)
          {
            urlPattern: /\/assets\/.*\.worker[.-].*\.js$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'web-workers-cache',
              cacheableResponse: {
                statuses: [0, 200]
              },
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          },
          // Main app bundles (JS/CSS): StaleWhileRevalidate (prefer cache, update in bg)
          {
            urlPattern: /\/assets\/.*\.(js|css)$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'app-bundles-cache',
              cacheableResponse: {
                statuses: [0, 200]
              },
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 1 week
              }
            }
          },
          // Google Fonts CSS: CacheFirst
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          // Google Fonts assets (woff2): CacheFirst
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-assets-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
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
