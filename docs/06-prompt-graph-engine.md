# Prompt Graph Engine

The Prompt Graph Engine compiles connected prompt nodes into a final prompt.

## Responsibilities

- Store node definitions and connections.
- Validate that connected nodes can produce an ordered prompt.
- Combine node content into a readable final prompt.
- Preserve user-editable prompt preview before handoff.
- Track which Prompt Template and nodes produced each Prompt Run.

## MVP Behavior

The MVP should keep graph behavior understandable and deterministic. Users connect nodes on a canvas, review the generated final prompt, optionally edit it, and then send or copy it to a supported AI tool.

## Future Considerations

Future versions may add reusable node libraries, graph validation hints, variable substitution, prompt scoring, and prompt diffing between runs.
