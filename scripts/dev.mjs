import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const root = resolve(fileURLToPath(new URL('..', import.meta.url)), args.includes('--dist') ? 'dist' : '.');
const argument = (name, fallback) => {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] && !args[index + 1].startsWith('--') ? args[index + 1] : fallback;
};
const port = Number(argument('--port', process.env.PORT || 5173));
const host = argument('--host', '127.0.0.1');
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ico': 'image/x-icon' };

const server = createServer(async (request, response) => {
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(405, { Allow: 'GET, HEAD' });
    response.end('Method not allowed');
    return;
  }
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const file = resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
    // Serve only public application files, never configuration, dotfiles or test scripts.
    const relative = file.slice(root.length + 1);
    if (!file.startsWith(`${root}${sep}`) || relative.split(/[\\/]/).some((part) => part.startsWith('.')) || !/^(index\.html|src\/[^/]+\.(js|css)|assets\/.+)$/.test(relative)) {
      response.writeHead(404); response.end('Not found'); return;
    }
    const info = await stat(file);
    if (!info.isFile()) throw new Error('Not a file');
    response.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream', 'Content-Length': info.size, 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' });
    if (request.method === 'HEAD') { response.end(); return; }
    const stream = createReadStream(file);
    stream.on('error', () => response.destroy());
    stream.pipe(response);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Страница не найдена');
  }
});

server.on('error', (error) => {
  console.error(`Не удалось запустить сервер: ${error.message}`);
  process.exitCode = 1;
});
server.listen(port, host, () => console.log(`Преображение → http://${host}:${port}\n${args.includes('--dist') ? 'Собранный сайт из dist/' : 'Для обновления изменений перезагрузите страницу.'}`));
