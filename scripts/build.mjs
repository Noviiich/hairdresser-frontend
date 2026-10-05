import { cp, mkdir, readFile, rm, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { gzipSync } from 'node:zlib';

const root = fileURLToPath(new URL('..', import.meta.url));
const target = resolve(root, 'dist');
const html = await readFile(resolve(root, 'index.html'), 'utf8');
const css = await readFile(resolve(root, 'src/styles.css'), 'utf8');
const references = [...html.matchAll(/(?:src|href)="\.\/([^"#]+)"/g)].map((match) => match[1]);
const fonts = [...css.matchAll(/url\('\.\.\/([^']+)'\)/g)].map((match) => match[1]);
for (const file of new Set([...references, ...fonts])) {
  if (!(await stat(resolve(root, file))).isFile()) throw new Error(`Не найден ресурс: ${file}`);
}
await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });
for (const file of ['index.html', 'src', 'assets']) await cp(resolve(root, file), resolve(target, file), { recursive: true });
const javascript = (await Promise.all(['app.js', 'booking.js', 'data.js'].map((name) => readFile(resolve(root, 'src', name), 'utf8')))).join('\n');
console.log(`Сайт собран в dist/\nJavaScript: ${(gzipSync(javascript).length / 1024).toFixed(1)} КБ gzip\nCSS: ${(gzipSync(css).length / 1024).toFixed(1)} КБ gzip\nБез внешних зависимостей и запросов к CDN.`);
