# AI Visual Workflow Extension

Chrome Extension MVP for building reusable prompt workflows, sending final prompts to generative AI tools, reviewing generated outputs, and saving approved artifacts for reuse.

The MVP is designed to be usable immediately after install. A fresh workspace starts with a default Project and eight starter templates:

- Product Mockup With Person
- Product Mockup Without Person
- Lifestyle Product Image
- Event Campaign Visual
- Image Edit Request
- Image Variation Request
- Google Flow Video Prompt
- Gemini Visual Critique Prompt

Each starter template includes a simple connected prompt graph with Product, Model/No Model, Background, Style/Lighting, Product Accuracy, Negative Constraints, Output Format, and Output nodes.

## MVP feature list

- Side Panel-first Chrome Extension UI.
- Starter template library seeded for new users.
- Prompt canvas with add, edit, delete, drag, and connect node controls.
- Final prompt preview generated from selected graph variants.
- Copy prompt, send prompt to supported tool tabs, save PromptRun, and add PromptRun to queue.
- Manual queue statuses for semi-automated creative workflows.
- Output upload/review flow with image preview and review checklist.
- Artifact Library for approved outputs and reusable source placeholders.
- Empty, loading, and error states for major screens.
- Delete/approval confirmation prompts for destructive or irreversible actions.

## Local development

Install dependencies:

```bash
npm install
```

Run TypeScript checks:

```bash
npm run typecheck
```

Run the test script:

```bash
npm test
```

Create a production extension bundle:

```bash
npm run build
```

The compiled extension is emitted to `dist/`.

## Load unpacked extension

1. Run `npm install` if dependencies are not installed.
2. Run `npm run build`.
3. Open Chrome and navigate to `chrome://extensions`.
4. Enable **Developer mode**.
5. Click **Load unpacked**.
6. Select this repository's `dist/` folder.
7. Click the extension icon and choose **Open Side Panel**.

## How to use the MVP

1. Open the Side Panel.
2. Choose a starter template from the Template Library.
3. Open it in Canvas.
4. Edit node variants or add/connect nodes.
5. Review the Final Prompt Preview.
6. Copy the prompt, send it to a supported tool, save it as a PromptRun, or add it to the queue.
7. Upload generated output images in Outputs.
8. Approve strong outputs into the Artifact Library.
9. Reference approved artifacts in future prompts with placeholders such as `{{approved_product_artifact}}`.

## Known limitations

- Project creation/selection remains minimal for the MVP; a default Project is created automatically.
- Prompt graph editing is intentionally lightweight and does not use a full graph library.
- Tool automation is semi-automatic: prompts may be copied when direct paste is blocked by the target site.
- Queue processing requires manual status updates.
- Output upload is image-focused for the MVP.
- Artifact reuse buttons are placeholders for workflow intent and do not yet auto-inject selected artifact data.

## Security limitations

- Data is stored locally in `chrome.storage.local`; it is not end-to-end encrypted by this extension.
- Image outputs are stored as small data URLs for the MVP, which is not suitable for large files or sensitive assets.
- The extension can open/signal supported AI tool tabs, but users remain responsible for reviewing prompts and outputs before submission or publication.
- Do not store confidential, regulated, or customer-sensitive creative assets in the MVP build.

## Manual test checklist

See [`docs/manual-test-checklist.md`](docs/manual-test-checklist.md) for the release checklist covering project, template, canvas, prompt, queue, output, artifact, and reuse-placeholder flows.
