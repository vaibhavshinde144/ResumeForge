import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  base: './',
  plugins: [react(), viteSingleFile()],
  build: {
    assetsInlineLimit: 100000000,
    cssCodeSplit: false,
    sourcemap: false,
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test-setup.js',
    css: true,
    include: ['src/**/*.test.{js,jsx}'],
    testTimeout: 60000,
  },
});
