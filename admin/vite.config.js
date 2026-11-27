import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Admin UI runs on its own port (default 5173).
 * Backend API is a separate origin (default http://localhost:5000).
 * Dev server proxies /api + /socket.io → backend so the two stay decoupled.
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backend = String(env.VITE_BACKEND_URL || 'https://api.frenvi.co').replace(/\/$/, '');
  const adminPort = Number(env.VITE_ADMIN_DEV_PORT) || 5173;

  return {
    plugins: [react()],
    // Same path in prod when hosted under the API host at /admin
    base: '/admin/',
    optimizeDeps: {
      exclude: ['agora-rtc-sdk-ng', 'lucide-react']
    },
    server: {
      port: adminPort,
      strictPort: true,
      host: true,
      cors: true,
      proxy: {
        '/api': {
          target: backend,
          changeOrigin: true,
          secure: backend.startsWith('https')
        },
        '/socket.io': {
          target: backend,
          ws: true,
          changeOrigin: true,
          secure: backend.startsWith('https'),
          configure: (proxy) => {
            proxy.on('error', (err) => {
              if (err.code !== 'ECONNABORTED' && err.code !== 'ECONNRESET') {
                console.warn('[Admin→API proxy]', err.message);
              }
            });
          }
        }
      }
    },
    preview: {
      port: adminPort,
      host: true
    }
  };
});
