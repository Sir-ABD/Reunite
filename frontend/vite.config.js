import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/socket.io': {
        target: 'http://localhost:5000', // Backend URL
        ws: true, // Enable WebSocket proxying
        changeOrigin: true, // Ensure the origin is rewritten to match the target
      },
    },
  },
});