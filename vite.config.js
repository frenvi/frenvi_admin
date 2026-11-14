import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/admin/',
  optimizeDeps: {
    exclude: ['agora-rtc-sdk-ng', 'lucide-react']
  },
  server: {
    port: 3000,
    cors: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false
      },
      '/socket.io': {
        target: 'http://127.0.0.1:5000',
        ws: true,
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            // Silently handle socket aborts on browser reload
            if (err.code !== 'ECONNABORTED' && err.code !== 'ECONNRESET') {
              console.warn('[Vite Proxy WS]', err.message);
            }
          });
        }
      }
    }
  }
});
