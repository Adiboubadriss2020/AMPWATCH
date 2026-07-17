/**
 * EnerGenius — ngrok tunnel starter
 * Starts the relay backend and opens a public ngrok tunnel.
 *
 * Usage:  npm run tunnel
 * Token:  NGROK_AUTHTOKEN in .env (or env var)
 */

const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Load .env if present (no dotenv dependency)
try {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  }
} catch {
  /* ignore */
}

const PORT = process.env.PORT || 3001;
const AUTHTOKEN = process.env.NGROK_AUTHTOKEN || '';

const server = spawn('node', ['server.cjs'], {
  stdio: 'inherit',
  env: { ...process.env, PORT },
});

server.on('error', (err) => {
  console.error('Failed to start relay server:', err);
  process.exit(1);
});

function waitForServer(retries = 15) {
  return new Promise((resolve, reject) => {
    const attempt = (n) => {
      setTimeout(() => {
        const req = http.get(`http://localhost:${PORT}/health`, (res) => {
          if (res.statusCode === 200) resolve();
          else if (n > 0) attempt(n - 1);
          else reject(new Error('Server did not become ready in time'));
        });
        req.on('error', () => {
          if (n > 0) attempt(n - 1);
          else reject(new Error('Server not reachable'));
        });
      }, 500);
    };
    attempt(retries);
  });
}

async function startTunnel() {
  console.log('\n🚀 Starting EnerGenius relay server...');

  if (!AUTHTOKEN) {
    console.warn('⚠️  NGROK_AUTHTOKEN missing — set it in .env');
  }

  try {
    await waitForServer();
    console.log(`✅ Server ready on port ${PORT}`);
  } catch (e) {
    console.error('❌ Server not ready:', e.message);
    process.exit(1);
  }

  const ngrokArgs = ['http', String(PORT)];
  if (AUTHTOKEN) {
    ngrokArgs.push('--authtoken', AUTHTOKEN);
  }

  console.log('\n🌐 Opening ngrok tunnel...');
  const ngrok = spawn('npx', ['ngrok', ...ngrokArgs], {
    stdio: 'pipe',
    env: { ...process.env },
  });

  setTimeout(() => {
    const req = http.get('http://localhost:4040/api/tunnels', (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const { tunnels } = JSON.parse(body);
          const publicUrl =
            tunnels.find((t) => t.proto === 'https')?.public_url || tunnels[0]?.public_url;

          if (publicUrl) {
            console.log('\n╔══════════════════════════════════════════════════════════╗');
            console.log('║  EnerGenius ngrok Tunnel Active                          ║');
            console.log('╠══════════════════════════════════════════════════════════╣');
            console.log(`║  Public URL   : ${publicUrl}`);
            console.log(`║  Telemetry IN : ${publicUrl}/webhook`);
            console.log(`║  Telemetry OUT: ${publicUrl}/payload`);
            console.log(`║  Agent IN     : ${publicUrl}/agent`);
            console.log(`║  Agent OUT    : ${publicUrl}/agent`);
            console.log('╚══════════════════════════════════════════════════════════╝');
            console.log('\n👉 Point your agent workflow webhook to:');
            console.log(`   ${publicUrl}/agent\n`);
          }
        } catch {
          console.log('ℹ️  Tunnel started. Check http://localhost:4040 for the public URL.');
        }
      });
    });
    req.on('error', () => {
      console.log('ℹ️  ngrok started. Open http://localhost:4040 to see the public URL.');
    });
  }, 2500);

  ngrok.stderr.on('data', (d) => {
    const msg = d.toString().trim();
    if (msg) console.error('[ngrok]', msg);
  });

  ngrok.on('close', (code) => {
    console.log(`ngrok exited (${code})`);
    server.kill();
    process.exit(code || 0);
  });

  process.on('SIGINT', () => {
    console.log('\nShutting down...');
    ngrok.kill();
    server.kill();
    process.exit(0);
  });
}

startTunnel();
