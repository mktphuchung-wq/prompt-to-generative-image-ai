import type { PromptGraph, PromptGraphNode, PromptNodeDataType, PromptTemplate, PromptTemplateTargetTool, PromptTemplateUseCase } from './types';

const timestamp = '2026-01-01T00:00:00.000Z';

type StarterTemplate = {
  id: string;
  name: string;
  description: string;
  useCase: PromptTemplateUseCase;
  targetTool: PromptTemplateTargetTool;
  modelLabel: string;
  modelContent: string;
  backgroundContent: string;
  styleContent: string;
  outputContent: string;
};

const starters: StarterTemplate[] = [
  { id: 'starter-product-mockup-with-person', name: 'Product Mockup With Person', description: 'Place a product with a realistic person/model while preserving product accuracy.', useCase: 'mockup_with_person', targetTool: 'chatgpt', modelLabel: 'Model', modelContent: 'Include a natural-looking person holding, wearing, or interacting with the product in a believable pose.', backgroundContent: 'Use a clean environment that supports the product story without distracting from the product.', styleContent: 'Use premium commercial photography, soft natural light, realistic shadows, and crisp focus.', outputContent: 'Return one polished product mockup image prompt ready for an image generation model.' },
  { id: 'starter-product-mockup-without-person', name: 'Product Mockup Without Person', description: 'Create a product-only mockup in a controlled scene.', useCase: 'mockup_without_person', targetTool: 'chatgpt', modelLabel: 'No Model', modelContent: 'Do not include people, hands, faces, bodies, or mannequins.', backgroundContent: 'Place the product on a clean surface or simple studio set with appropriate props.', styleContent: 'Use studio product photography, balanced lighting, realistic reflections, and sharp details.', outputContent: 'Return one product-only mockup prompt ready for image generation.' },
  { id: 'starter-lifestyle-product-image', name: 'Lifestyle Product Image', description: 'Show the product in a lifestyle setting that communicates context and desirability.', useCase: 'lifestyle_image', targetTool: 'chatgpt', modelLabel: 'Model or No Model', modelContent: 'Use people only if they improve the lifestyle story; keep focus on product usage and context.', backgroundContent: 'Use an aspirational real-world setting that matches the target customer and product category.', styleContent: 'Use editorial lifestyle photography, warm lighting, authentic details, and natural composition.', outputContent: 'Return a lifestyle image prompt with clear scene, product, and mood guidance.' },
  { id: 'starter-event-campaign-visual', name: 'Event Campaign Visual', description: 'Build a campaign hero visual for launches, sales, seasonal events, or announcements.', useCase: 'event_campaign', targetTool: 'chatgpt', modelLabel: 'Model or No Model', modelContent: 'Include a person only when relevant to the campaign audience or event emotion.', backgroundContent: 'Use an event-specific backdrop with campaign cues, space for headline text, and brand-safe composition.', styleContent: 'Use bold campaign lighting, high contrast, vivid but controlled color, and clear focal hierarchy.', outputContent: 'Return a campaign visual prompt suitable for a hero banner or social ad.' },
  { id: 'starter-image-edit-request', name: 'Image Edit Request', description: 'Write precise edit instructions for an existing image.', useCase: 'image_edit', targetTool: 'chatgpt', modelLabel: 'Model or No Model', modelContent: 'Preserve any existing person/model unless the edit explicitly asks to remove or change them.', backgroundContent: 'Keep the original background unless instructed; blend edits naturally into the scene.', styleContent: 'Match the original lighting, perspective, shadows, texture, and camera style.', outputContent: 'Return a concise image edit request that clearly states what to change and what to preserve.' },
  { id: 'starter-image-variation-request', name: 'Image Variation Request', description: 'Request controlled variations from an existing approved output or artifact.', useCase: 'image_variation', targetTool: 'chatgpt', modelLabel: 'Model or No Model', modelContent: 'Preserve the subject/model treatment unless exploring a model/no-model variant.', backgroundContent: 'Create a variation of the scene while keeping the product and core concept recognizable.', styleContent: 'Maintain the visual quality and brand tone while changing composition, angle, or setting.', outputContent: 'Return a variation prompt that explains what should stay consistent and what may vary.' },
  { id: 'starter-google-flow-video-prompt', name: 'Google Flow Video Prompt', description: 'Turn a product scene into a short video prompt for Google Flow-style generation.', useCase: 'video_prompt', targetTool: 'google_flow', modelLabel: 'Model or No Model', modelContent: 'If a person appears, describe simple natural motion that supports the product story.', backgroundContent: 'Use a video-friendly setting with depth, clear subject separation, and minimal clutter.', styleContent: 'Use cinematic lighting, smooth camera motion, realistic movement, and stable product visibility.', outputContent: 'Return a 5-8 second video prompt with scene, motion, camera, and ending frame.' },
  { id: 'starter-gemini-visual-critique-prompt', name: 'Gemini Visual Critique Prompt', description: 'Ask Gemini to critique an output for quality, product accuracy, and reuse potential.', useCase: 'critique_prompt', targetTool: 'gemini', modelLabel: 'Model or No Model', modelContent: 'Assess whether any person/model depiction is realistic, brand-safe, and helpful to the image.', backgroundContent: 'Assess whether the background supports the product and avoids distractions or artifacts.', styleContent: 'Evaluate lighting, composition, realism, visual defects, and commercial polish.', outputContent: 'Return a structured critique with pass/fail notes, recommended edits, and artifact reuse suggestions.' }
];

const node = (templateId: string, order: number, name: string, nodeType: PromptNodeDataType, content: string, x: number, y: number): PromptGraphNode => ({
  id: `${templateId}-node-${order}`,
  type: name === 'Output' ? 'output' : name.includes('Model') || name === 'No Model' ? 'variant' : 'text',
  position: { x, y },
  data: {
    name,
    nodeType,
    isEnabled: true,
    isRequired: ['Product', 'Product Accuracy', 'Negative Constraints', 'Output Format', 'Output'].includes(name),
    selectionMode: 'single',
    variants: [{ id: `${templateId}-variant-${order}`, label: 'Default', content, isSelected: true, order: 1 }]
  }
});

const buildGraph = (starter: StarterTemplate): PromptGraph => {
  const nodes = [
    node(starter.id, 1, 'Product', 'product', 'Describe the product precisely: name, category, colors, materials, logo/label placement, packaging, and any reference artifact placeholder such as {{approved_product_artifact}}.', 40, 60),
    node(starter.id, 2, starter.modelLabel, 'model', starter.modelContent, 300, 60),
    node(starter.id, 3, 'Background', 'background', starter.backgroundContent, 560, 60),
    node(starter.id, 4, 'Style/Lighting', 'lighting', starter.styleContent, 820, 60),
    node(starter.id, 5, 'Product Accuracy', 'product_accuracy', 'Preserve product shape, proportions, color, texture, branding, text, and packaging exactly. Do not invent alternate labels or product features.', 40, 220),
    node(starter.id, 6, 'Negative Constraints', 'negative_constraints', 'Avoid distorted product geometry, misspelled text, extra logos, warped labels, low resolution, blurry details, extra fingers, duplicate products, and unsafe or misleading claims.', 300, 220),
    node(starter.id, 7, 'Output Format', 'output_format', 'Use a clear structured prompt with subject, scene, style, constraints, and final output requirements. Prefer 1:1 or 4:5 unless another format is specified.', 560, 220),
    node(starter.id, 8, 'Output', 'output_format', starter.outputContent, 820, 220)
  ];

  return {
    id: `${starter.id}-graph`,
    templateId: starter.id,
    nodes,
    edges: nodes.slice(0, -1).map((source, index) => ({ id: `${starter.id}-edge-${index + 1}`, source: source.id, target: nodes[index + 1].id, sourceHandle: 'out', targetHandle: 'in' }))
  };
};

export function createStarterTemplates(projectId: string): PromptTemplate[] {
  return starters.map((starter) => ({
    id: starter.id,
    projectId,
    name: starter.name,
    description: starter.description,
    useCase: starter.useCase,
    targetTool: starter.targetTool,
    graph: buildGraph(starter),
    createdAt: timestamp,
    updatedAt: timestamp
  }));
}
