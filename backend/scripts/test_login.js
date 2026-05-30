const http = require('http');
const data = JSON.stringify({ username: 'admin', password: 'Password123!' });

const opts = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
  },
};

const req = http.request(opts, (res) => {
  let body = '';
  res.on('data', (c) => (body += c));
  res.on('end', () => {
    console.log('STATUS', res.statusCode);
    console.log(body);
  });
});

req.on('error', (e) => {
  console.error('REQUEST_ERROR', e.message);
});

req.write(data);
req.end();
