# Technical Architecture

## Extension Architecture

The product is a Chrome Extension centered on the Side Panel. The architecture should separate UI state, project storage, prompt graph processing, tool adapters, and file handling.

## Suggested Modules

- Side Panel UI shell.
- Project service for the 5-Project limit and project selection.
- Prompt Template service for node-based templates.
- Prompt Graph Engine for connected-node compilation.
- Prompt Run service for generated prompts and run history.
- Tool Adapter layer for ChatGPT, Gemini, and Google Flow handoff.
- Output and Artifact services for review and approval lifecycle.
- Storage and file handling layer for metadata and image references.
- Permissions and security layer for least-privilege extension behavior.

## MVP Automation Boundary

The MVP should support semi-automatic workflows only. It may assist with prompt transfer and context capture, but users must control account actions, submission, captcha handling, and compliance-sensitive interactions.
