# Tool Adapters

Tool Adapters provide semi-automatic handoff from the extension to external AI tools.

## Initial Supported Tools

- ChatGPT
- Gemini
- Google Flow

## Adapter Responsibilities

- Identify supported tool pages where appropriate.
- Help transfer or prepare the final prompt for user submission.
- Associate user-attached generated images with the correct Prompt Run.
- Avoid account automation, captcha bypass, and Terms of Service violations.

## Automation Boundary

Adapters must not submit prompts without user control, bypass captchas, scrape private account data unnecessarily, or perform actions that external tools prohibit. The user remains responsible for tool access and final submission.
