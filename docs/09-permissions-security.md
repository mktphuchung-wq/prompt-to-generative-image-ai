# Permissions and Security

The extension should use least-privilege permissions and make user control explicit.

## Security Principles

- Request only permissions required for the Side Panel, storage, active tab context, and supported tool handoff.
- Keep sensitive data local where possible in the MVP.
- Do not collect unnecessary account or page data from ChatGPT, Gemini, or Google Flow.
- Do not implement captcha bypass.
- Do not implement account automation.
- Do not automate behavior that violates external tool Terms of Service.

## User Trust

Users should understand when a prompt is generated, when it is handed off, when an image is attached as an Output, and when an Output is approved into an Artifact.
