# Storage and File Handling

The extension stores lightweight Project data, prompt structures, run metadata, image references, Outputs, Source Images, and approved Artifacts.

## Storage Goals

- Keep Project data local-first for the MVP where practical.
- Enforce the maximum of 5 Projects.
- Preserve the Output-to-Artifact approval lifecycle.
- Make generated Outputs temporary until explicitly approved.
- Keep Source Images separate from generated Outputs and approved Artifacts.

## File Handling Goals

- Allow users to attach generated images to Prompt Runs.
- Allow users to promote approved Outputs into the Artifact Library.
- Track filenames, tool source, prompt run source, timestamps, and user notes.
- Avoid storing more external page data than needed for the workflow.
