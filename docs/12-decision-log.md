# Decision Log

## Approved Product Decisions

- Use the Chrome Extension Side Panel as the main UI.
- Do not build a full Campaign Manager.
- Use lightweight Projects instead of campaign-management concepts.
- Limit the extension to a maximum of 5 Projects.
- Each Project stores Prompt Templates, Prompt Runs, Outputs, Source Images, and Artifact Library.
- Prompt Templates are node-based.
- Users connect prompt nodes on a canvas to generate a final prompt.
- The MVP should be semi-auto, not full automation.
- Output and Artifact are different concepts.
- A generated image is an Output first and becomes an Artifact only after explicit user approval.
- Supported initial tools are ChatGPT, Gemini, and Google Flow.
- Do not implement captcha bypass.
- Do not implement account automation.
- Do not implement behavior that violates external tool Terms of Service.

## Open Decisions

- Exact storage backend and quota handling.
- Image file retention and cleanup policy for temporary Outputs.
- Level of content script involvement for each supported tool.
- Prompt graph validation rules and variable syntax.
