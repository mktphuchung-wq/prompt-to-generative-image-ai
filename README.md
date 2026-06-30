# AI Visual Workflow Extension

Chrome Extension MVP foundation for a Side Panel-first workflow that helps content creative users build prompt templates, prepare final prompts, manage generated outputs, and approve artifacts.

## Tech stack

- Vite
- React
- TypeScript
- Chrome Extension Manifest V3

## Local development

Install dependencies:

```bash
npm install
```

Run the Vite dev server for browser UI development:

```bash
npm run dev
```

Create a production extension bundle:

```bash
npm run build
```

The compiled extension is emitted to `dist/`.

## Load unpacked in Chrome

1. Run `npm install` if dependencies are not installed.
2. Run `npm run build`.
3. Open Chrome and navigate to `chrome://extensions`.
4. Enable **Developer mode**.
5. Click **Load unpacked**.
6. Select the repository's `dist/` folder.
7. Click the extension icon and choose **Open Side Panel**, or use Chrome's side panel controls.

## MVP scope

Included:

- Manifest V3 configuration with Side Panel, popup, background service worker, and content script entries.
- Shared TypeScript types, constants, messaging helper, and `chrome.storage.local` wrapper.
- Basic Side Panel layout and popup status UI.

Not included yet:

- Node canvas implementation.
- Real ChatGPT, Gemini, Google Labs, or Google Flow automation.
