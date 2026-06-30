import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        sidepanel: resolve(__dirname, 'src/sidepanel/index.html'),
        popup: resolve(__dirname, 'src/popup/index.html'),
        serviceWorker: resolve(__dirname, 'src/background/service-worker.ts'),
        content: resolve(__dirname, 'src/content/index.ts')
      },
      output: {
        entryFileNames: (chunkInfo: { name: string }) => {
          if (chunkInfo.name === 'serviceWorker') return 'assets/background/service-worker.js';
          if (chunkInfo.name === 'content') return 'assets/content/index.js';
          if (chunkInfo.name === 'sidepanel') return 'assets/sidepanel/index.js';
          if (chunkInfo.name === 'popup') return 'assets/popup/index.js';
          return 'assets/[name].js';
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]'
      }
    }
  }
});
