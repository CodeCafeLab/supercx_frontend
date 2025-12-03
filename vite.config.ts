import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3012,
    host: true,
  },
  preview: {
    port: 3012,
    host: true,
    allowedHosts: [
      'bankaichat.codecafelab.in',
      'Bankaichat.codecafelab.in',
      'localhost',
      '127.0.0.1'
    ],
  },
});

