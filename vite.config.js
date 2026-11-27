import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backend = String(
    env.VITE_BACKEND_URL || 'https://api.frenvi.co'
  ).replace(/\/$/, '');

  return {
    plugins: [react()],
    base: '/',

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
              if (
                err.code !== 'ECONNABORTED' &&
                err.code !== 'ECONNRESET'
              ) {
                console.warn('[Vite Proxy WS]', err.message);
              }
            });
          }
        }
      }
    }
  };
});
