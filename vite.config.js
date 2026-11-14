<<<<<<< HEAD
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
=======
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backend = String(env.VITE_BACKEND_URL || 'https://api.frenvi.co').replace(/\/$/, '');

  return {
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
          target: backend,
          changeOrigin: true,
          secure: true
        },
        '/socket.io': {
          target: backend,
          ws: true,
          changeOrigin: true,
          secure: true,
          configure: (proxy) => {
            proxy.on('error', (err) => {
              if (err.code !== 'ECONNABORTED' && err.code !== 'ECONNRESET') {
                console.warn('[Vite Proxy WS]', err.message);
              }
            });
          }
        }
      }
    }
  };
>>>>>>> 6333108 (Update Frenvi Admin)
});
