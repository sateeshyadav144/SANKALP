import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';
import { ttsServerPlugin } from './server/ttsPlugin.js';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), ttsServerPlugin()],
  server: {
    host: true,
    port: 5173,
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    },
  },
  preview: {
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    },
  },
  build: {
    sourcemap: false, // Prevent internal source file exposure in production
    chunkSizeWarningLimit: 1200,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
  },
});
