import { defineConfig } from 'vite';

// base './' faz os caminhos funcionarem em qualquer subpasta (ex.: GitHub Pages /Tigrinho-Show/).
export default defineConfig({
  base: './',
  server: { host: '0.0.0.0', port: 5173 },
  preview: { host: '0.0.0.0', port: 4173 },
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 2000,
  },
});
