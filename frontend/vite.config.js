import { defineConfig } from 'vite';

// Builds into ../web, which the Java server serves.
// During `npm run dev`, /api calls are forwarded to the Java server on 8080.
export default defineConfig({
  // three.js (~590 kB) is a lazy chunk that only loads when the 3D drawer opens.
  build: { outDir: '../web', emptyOutDir: true, chunkSizeWarningLimit: 700 },
  server: { proxy: { '/api': 'http://localhost:8080' } },
});
