export type SupportedTool = 'chatgpt' | 'gemini' | 'google-labs' | 'google-flow';

export type ArtifactStatus = 'draft' | 'generated' | 'approved' | 'rejected';

export type PromptTemplateUseCase =
  | 'mockup_with_person'
  | 'mockup_without_person'
  | 'lifestyle_image'
  | 'clean_ecommerce'
  | 'event_campaign'
  | 'social_visual'
  | 'ad_creative'
  | 'image_variation'
  | 'image_edit'
  | 'video_prompt'
  | 'critique_prompt';

export type PromptTemplateTargetTool = 'chatgpt' | 'gemini' | 'google_flow' | 'manual';

export type PromptGraphNodeType = 'text' | 'variant' | 'artifact_input' | 'tool_action' | 'output';

export type PromptNodeDataType =
  | 'product'
  | 'product_accuracy'
  | 'model'
  | 'pose'
  | 'background'
  | 'event_context'
  | 'scene_style'
  | 'camera_angle'
  | 'lighting'
  | 'composition'
  | 'brand_constraints'
  | 'negative_constraints'
  | 'output_format'
  | 'edit_instruction'
  | 'motion_instruction'
  | 'critique_instruction'
  | 'custom';

export type PromptSelectionMode = 'single' | 'multiple' | 'manual';

export type PromptVariant = {
  id: string;
  label: string;
  content: string;
  isSelected: boolean;
  order: number;
};

export type PromptNodeData = {
  name: string;
  nodeType: PromptNodeDataType;
  isEnabled: boolean;
  isRequired?: boolean;
  selectionMode: PromptSelectionMode;
  manualText?: string;
  variants: PromptVariant[];
};

export interface PromptGraphNode {
  id: string;
  type: PromptGraphNodeType;
  position: { x: number; y: number };
  data: PromptNodeData;
}

export interface PromptGraphEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface PromptGraph {
  id: string;
  templateId: string;
  nodes: PromptGraphNode[];
  edges: PromptGraphEdge[];
}

export interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface PromptTemplate {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  useCase: PromptTemplateUseCase;
  targetTool: PromptTemplateTargetTool;
  graph?: PromptGraph;
  createdAt: string;
  updatedAt: string;
}

export interface GeneratedArtifact {
  id: string;
  promptId: string;
  tool: SupportedTool;
  status: ArtifactStatus;
  previewUrl?: string;
  createdAt: string;
}

export interface AppState {
  projects: Project[];
  activeProjectId: string;
  templates: PromptTemplate[];
  artifacts: GeneratedArtifact[];
  activeTool?: SupportedTool;
}

export type ExtensionMessage =
  | { type: 'OPEN_SIDE_PANEL' }
  | { type: 'CONTENT_SCRIPT_READY'; url: string }
  | { type: 'APP_STATE_UPDATED'; state: AppState };
