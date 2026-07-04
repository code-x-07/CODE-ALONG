import { defineConfig, loadEnv, type Plugin } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

/**
 * Dev-only middleware that mints LiveKit tokens, mirroring api/livekit/token.js,
 * so `npm run dev` supports live rooms without a separate server process.
 */
function livekitDevApi(env: Record<string, string>): Plugin {
  return {
    name: 'livekit-dev-api',
    configureServer(server) {
      server.middlewares.use('/api/livekit/token', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ message: 'Method not allowed.' }));
          return;
        }

        let body = '';
        req.on('data', (chunk) => {
          body += chunk;
        });
        req.on('end', async () => {
          res.setHeader('Content-Type', 'application/json');

          const livekitUrl = env.LIVEKIT_URL?.trim();
          const apiKey = env.LIVEKIT_API_KEY?.trim();
          const apiSecret = env.LIVEKIT_API_SECRET?.trim();

          if (!livekitUrl || !apiKey || !apiSecret) {
            res.statusCode = 500;
            res.end(
              JSON.stringify({
                message:
                  'LiveKit environment variables are missing. Set LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET in .env.',
              }),
            );
            return;
          }

          try {
            const { AccessToken } = await import('livekit-server-sdk');
            const { roomName, participantName } = body ? JSON.parse(body) : {};
            const normalizedRoomName = String(roomName || '').trim().toUpperCase();
            const normalizedParticipantName = String(participantName || '').trim() || 'Guest';

            if (!normalizedRoomName) {
              res.statusCode = 400;
              res.end(JSON.stringify({ message: 'roomName is required.' }));
              return;
            }

            // Unique identity per connection — same-identity joins kick the previous session.
            const identity = `${normalizedParticipantName}-${Math.random().toString(36).slice(2, 8)}`;
            const token = new AccessToken(apiKey, apiSecret, {
              identity,
              name: normalizedParticipantName,
              ttl: '10m',
            });

            token.addGrant({
              roomJoin: true,
              room: normalizedRoomName,
              canPublish: true,
              canSubscribe: true,
              canPublishData: true,
            });

            res.statusCode = 200;
            res.end(
              JSON.stringify({
                token: await token.toJwt(),
                url: livekitUrl,
                roomName: normalizedRoomName,
                participantName: normalizedParticipantName,
              }),
            );
          } catch (error) {
            res.statusCode = 500;
            res.end(
              JSON.stringify({
                message: 'Failed to create a LiveKit token.',
                details: error instanceof Error ? error.message : 'Unknown token error.',
              }),
            );
          }
        });
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // Piston API root. Public instance: https://emkc.org/api/v2/piston
  const pistonBaseUrl = env.PISTON_BASE_URL || 'https://emkc.org/api/v2/piston';
  const pistonApiKey = env.PISTON_API_KEY?.trim();

  return {
    plugins: [
      react(),
      tailwindcss(),
      livekitDevApi(env),
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
          rewrite: (requestPath) => requestPath.replace(/^\/api\/piston/, ''),
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
