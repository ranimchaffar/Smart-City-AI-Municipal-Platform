import http from 'http';

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'ok', server: 'WSL_NODE_SERVER' }));
});

server.listen(3003, '0.0.0.0', () => {
  console.log('WSL server listening on port 3003');
});
