# Manual Test Checklist

Use this checklist before an MVP release build.

## Setup

- [ ] Run `npm install`.
- [ ] Run `npm run build`.
- [ ] Load the `dist/` folder as an unpacked Chrome extension.
- [ ] Open the extension Side Panel.

## Required MVP flow

- [ ] Create/open first Project: verify a new user sees the default Project and starter templates.
- [ ] Create template: add a custom template with name, description, use case, and target tool.
- [ ] Add nodes: open a template in Canvas and add at least one new node.
- [ ] Connect nodes: connect a source node to a target node and verify the edge appears.
- [ ] Generate final prompt: select/edit variants and confirm the Final Prompt Preview updates.
- [ ] Copy prompt: click **Copy Prompt** and paste into a text field to verify clipboard contents.
- [ ] Send to ChatGPT: choose a ChatGPT-targeted template and verify the extension opens or focuses ChatGPT and copies/pastes the prompt when possible.
- [ ] Add to queue: click **Add to Queue** and verify the Run Queue contains the prompt run.
- [ ] Attach output: upload a generated image in Outputs and verify it appears in the review queue.
- [ ] Approve artifact: approve the output and verify it appears in the Artifact Library.
- [ ] Reuse artifact placeholder: create or edit a prompt that references an approved artifact placeholder such as `{{approved_product_artifact}}`.

## UI and resilience checks

- [ ] Empty states are visible for no matching templates, no queued prompt runs, no outputs, and no artifacts.
- [ ] Loading state appears while local storage is read.
- [ ] Errors are shown as visible messages instead of silent failures.
- [ ] Delete actions show confirmation dialogs.
- [ ] Side Panel layout remains usable at narrow widths.
