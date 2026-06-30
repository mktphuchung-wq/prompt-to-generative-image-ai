import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';

await mkdir('dist', { recursive: true });
await cp('manifest.json', 'dist/manifest.json');
await cp('src/styles.css', 'dist/assets/styles.css');

const html = await readFile('index.html', 'utf8');
await writeFile(
  'dist/index.html',
  html.replace('/src/main.ts', './assets/main.js').replace('/src/styles.css', './assets/styles.css'),
);
