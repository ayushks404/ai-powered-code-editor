const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd());

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { WebSocketServer } = require('ws');
const { handleReviewConnection } = require('./ws/review-server');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error handling request:', req.url, err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });

  // Use noServer: true so ws doesn't block Next.js's internal HMR WebSockets (/_next/hmr)
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (req, socket, head) => {
    const { pathname } = parse(req.url || '', true);

    if (pathname === '/ws/review') {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req);
      });
    }
    // If it's another WebSocket (e.g. Next.js HMR at /_next/hmr), let Next.js handle it
  });

  wss.on('connection', (ws) => {
    handleReviewConnection(ws);
  });

  wss.on('error', (err) => {
    console.error('WebSocketServer error:', err);
  });

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port} (Next.js + WebSocket Server)`);
  });
});
