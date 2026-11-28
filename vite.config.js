import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src',
  publicDir: '../public',
  base: './',
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: true,
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: { output: { manualChunks: { three: ['three'] } } },
  },
});
