import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  base: '/road-rash/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
  },
});
