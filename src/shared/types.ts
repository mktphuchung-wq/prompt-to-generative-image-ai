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

export interface PromptGraphNode {
  id: string;
  type?: string;
  label?: string;
  data?: Record<string, unknown>;
}

export interface PromptGraphEdge {
  id: string;
  source: string;
  target: string;
}

export interface PromptGraph {
  nodes: PromptGraphNode[];
  edges?: PromptGraphEdge[];
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
