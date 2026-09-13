import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: { target: ['es2022', 'safari16.4'] },
  server: { host: '127.0.0.1', port: 5173, strictPort: true },
});
