import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
let visualizer: any;
try {
  // optional import - plugin may not be installed
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  visualizer = require('rollup-plugin-visualizer').visualizer;
} catch (err) {
  visualizer = null;
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Pre-bundle some larger dependencies to avoid many small runtime imports
  // which can slow down the dev server / first-load in the browser.
  optimizeDeps: {
    include: ['lucide-react', 'firebase/app', 'firebase/auth', 'firebase/firestore'],
  },
  // Build options (merged) and optional analyzer plugin
  build: {
    rollupOptions: {
      plugins: process.env.ANALYZE && visualizer ? [visualizer({ filename: 'dist/bundle-visualizer.html' })] : [],
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          ui: ['framer-motion', 'lucide-react'],
          utils: ['clsx', 'tailwind-merge', 'class-variance-authority']
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    target: 'esnext',
    minify: 'esbuild',
  },
  esbuild: {
    drop: ['console', 'debugger'],
  },
});
