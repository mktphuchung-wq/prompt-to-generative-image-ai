export type SupportedTool = 'chatgpt' | 'gemini' | 'google-labs' | 'google-flow';

export type ArtifactStatus = 'draft' | 'generated' | 'approved' | 'rejected';

export interface PromptTemplate {
  id: string;
  name: string;
  description?: string;
  prompt: string;
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
  templates: PromptTemplate[];
  artifacts: GeneratedArtifact[];
  activeTool?: SupportedTool;
}

export type ExtensionMessage =
  | { type: 'OPEN_SIDE_PANEL' }
  | { type: 'CONTENT_SCRIPT_READY'; url: string }
  | { type: 'APP_STATE_UPDATED'; state: AppState };
