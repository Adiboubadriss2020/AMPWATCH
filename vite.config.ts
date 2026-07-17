import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'

function webhookPlugin(): Plugin {
  return {
    name: 'vite:webhook-middleware',
    configureServer(server) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        const url = req.url?.split('?')[0] || '';

        if (url === '/api/external-webhook' && req.method === 'GET') {
          try {
            const remoteUrl = 'https://stg-orch-api.abafusion.ai/webhook/webhook-k0j9rl0gsqteuc0qltcwkbiz/dashboard';
            const remoteRes = await fetch(remoteUrl, { method: 'GET', headers: { accept: 'application/json' } });
            const json = await remoteRes.json();
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(json));
          } catch (err) {
            res.statusCode = 502;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Failed to fetch remote webhook data', message: String(err) }));
          }
          return;
        }

        next();
      });
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), webhookPlugin()],
})
