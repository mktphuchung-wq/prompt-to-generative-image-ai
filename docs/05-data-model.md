# Data Model

## Project

A lightweight workspace. The extension supports at most 5 Projects.

Contains:

- Prompt Templates
- Prompt Runs
- Outputs
- Source Images
- Artifact Library

## Prompt Template

A reusable node-based prompt structure. It contains prompt nodes, connections, ordering rules, and template metadata.

## Prompt Node

A structured prompt block such as product details, style, brand constraints, image composition, camera settings, negative prompts, or output format.

## Prompt Run

A record of a generated final prompt, target tool, execution notes, timestamps, and attached Outputs.

## Output

A temporary generated image or result attached to a Prompt Run. Outputs are not final reusable assets until approved.

## Artifact

A user-approved reusable asset promoted from an Output into the Project Artifact Library.

## Source Image

A user-provided reference image used as context for prompt creation, variation generation, or visual review.
