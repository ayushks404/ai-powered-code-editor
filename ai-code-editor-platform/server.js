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

  // Create WebSocket server attached to HTTP server at /ws/review path
  const wss = new WebSocketServer({ server, path: '/ws/review' });

  wss.on('connection', (ws, req) => {
    handleReviewConnection(ws);
  });

  wss.on('error', (err) => {
    console.error('WebSocketServer error:', err);
  });

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port} (Next.js + WebSocket Server)`);
  });
});
