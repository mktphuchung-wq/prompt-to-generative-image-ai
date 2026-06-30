import { copyFile, cp, mkdir, readFile, writeFile } from 'node:fs/promises';

const toolMatches = [
  'https://chatgpt.com/*',
  'https://gemini.google.com/*',
  'https://labs.google/*',
  'https://flow.google/*',
];

const manifest = {
  manifest_version: 3,
  name: 'AI Visual Workspace',
  description: 'Project workspace for prompt-to-generative-image workflows.',
  version: '0.1.0',
  permissions: ['storage', 'tabs', 'scripting', 'sidePanel'],
  host_permissions: toolMatches,
  background: {
    service_worker: 'assets/background/service-worker.js',
    type: 'module',
  },
  content_scripts: [
    {
      matches: toolMatches,
      js: ['assets/content/index.js'],
    },
  ],
  side_panel: {
    default_path: 'sidepanel/index.html',
  },
  action: {
    default_title: 'AI Visual Workspace',
    default_popup: 'popup/index.html',
  },
};

const writeJson = (path, data) => writeFile(path, `${JSON.stringify(data, null, 2)}\n`);

await mkdir('dist/assets', { recursive: true });
await mkdir('dist/assets/sidepanel', { recursive: true });
await mkdir('dist/assets/popup', { recursive: true });
await mkdir('dist/sidepanel', { recursive: true });
await mkdir('dist/popup', { recursive: true });

await writeJson('dist/manifest.json', manifest);
await writeJson('manifest.json', manifest);

await cp('src/styles.css', 'dist/assets/styles.css');
await cp('src/sidepanel/styles.css', 'dist/assets/sidepanel/styles.css');
await copyFile('dist/assets/sidepanel/main.js', 'dist/assets/sidepanel/index.js');
await copyFile('dist/assets/popup/main.js', 'dist/assets/popup/index.js');

const rootHtml = await readFile('index.html', 'utf8');
await writeFile(
  'dist/index.html',
  rootHtml.replace('/src/main.ts', './assets/main.js').replace('/src/styles.css', './assets/styles.css'),
);

const sidepanelHtml = await readFile('src/sidepanel/index.html', 'utf8');
await writeFile(
  'dist/sidepanel/index.html',
  sidepanelHtml.replace('/src/sidepanel/main.tsx', '../assets/sidepanel/index.js'),
);

const popupHtml = await readFile('src/popup/index.html', 'utf8');
await writeFile(
  'dist/popup/index.html',
  popupHtml.replace('/src/popup/main.tsx', '../assets/popup/index.js'),
);
