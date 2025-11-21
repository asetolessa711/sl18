import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  server: {
    port: 5179,
    proxy: {
      '/api': 'http://localhost:5178',
      '/oauth': 'http://localhost:5178'
    }
  },
  plugins: [react()]
});
