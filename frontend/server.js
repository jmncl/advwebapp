const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 5500;
const ROOT = __dirname;

const routeMap = {
  '/': 'index.html',
  '/login': 'login.html',
  '/register': 'register.html',
  '/verify-email': 'verify-email.html',
  '/cart': 'cart.html',
  '/checkout': 'checkout.html',
  '/orders': 'orders.html',
  '/product-detail': 'product-detail.html',
  '/admin/dashboard': 'admin/dashboard.html',
  '/admin/products': 'admin/products.html',
  '/admin/users': 'admin/users.html',
  '/admin/orders': 'admin/orders.html',
  '/admin/reports': 'admin/reports.html'
};

const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const sendFile = (res, filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end('<h1>404 - Page not found</h1>');
      return;
    }
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    res.end(data);
  });
};

const resolveFile = (urlPath) => {
  if (routeMap[urlPath]) {
    return path.join(ROOT, routeMap[urlPath]);
  }

  const safePath = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, '');
  let filePath = path.join(ROOT, safePath);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    const indexFile = path.join(filePath, 'index.html');
    if (fs.existsSync(indexFile)) return indexFile;
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    return filePath;
  }

  if (!path.extname(urlPath)) {
    const htmlFile = `${filePath}.html`;
    if (fs.existsSync(htmlFile)) return htmlFile;
  }

  return null;
};

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0].split('#')[0]);
  const filePath = resolveFile(urlPath);

  if (!filePath || !filePath.startsWith(ROOT)) {
    res.writeHead(404, { 'Content-Type': 'text/html' });
    return res.end('<h1>404 - Not Found</h1><p><a href="/">Go to shop</a></p>');
  }

  sendFile(res, filePath);
});

server.listen(PORT, () => {
  console.log(`Jordan Brand frontend: http://localhost:${PORT}`);
});
