import { defineConfig, loadEnv } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const pistonBaseUrl = env.PISTON_BASE_URL || 'http://localhost:2000';
  const pistonApiKey = env.PISTON_API_KEY?.trim();

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      proxy: {
        '/api/piston': {
          target: pistonBaseUrl,
          changeOrigin: true,
          rewrite: (requestPath) => requestPath.replace(/^\/api\/piston/, '/api/v2'),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              if (pistonApiKey) {
                proxyReq.setHeader('Authorization', `Bearer ${pistonApiKey}`);
              }
            });
          },
        },
      },
    },
    assetsInclude: ['**/*.svg', '**/*.csv'],
  };
});
