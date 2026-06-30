import { STORAGE_KEYS } from './constants';
import type { AppState, PromptTemplate, PromptTemplateUseCase, PromptTemplateTargetTool, Project } from './types';

const now = () => new Date().toISOString();
const createId = (prefix: string) => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;

const defaultProject: Project = {
  id: 'default-project',
  name: 'Default Project',
  createdAt: now(),
  updatedAt: now()
};

export const DEFAULT_APP_STATE: AppState = {
  projects: [defaultProject],
  activeProjectId: defaultProject.id,
  templates: [],
  artifacts: []
};

type LegacyAppState = Partial<AppState>;

function normalizeState(state?: LegacyAppState): AppState {
  const projects = state?.projects?.length ? state.projects : DEFAULT_APP_STATE.projects;
  const activeProjectId = state?.activeProjectId && projects.some((project) => project.id === state.activeProjectId)
    ? state.activeProjectId
    : projects[0].id;

  return {
    projects,
    activeProjectId,
    templates: state?.templates ?? [],
    artifacts: state?.artifacts ?? [],
    activeTool: state?.activeTool
  };
}

export async function getAppState(): Promise<AppState> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.appState);
  return normalizeState(result[STORAGE_KEYS.appState] as LegacyAppState | undefined);
}

export async function setAppState(state: AppState): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.appState]: normalizeState(state) });
}

export async function resetAppState(): Promise<void> {
  await setAppState(DEFAULT_APP_STATE);
}

export type CreatePromptTemplateInput = {
  name: string;
  description?: string;
  useCase: PromptTemplateUseCase;
  targetTool: PromptTemplateTargetTool;
};

export type UpdatePromptTemplatePatch = Partial<CreatePromptTemplateInput> & {
  graph?: PromptTemplate['graph'];
};

export async function getTemplates(projectId: string): Promise<PromptTemplate[]> {
  const state = await getAppState();
  return state.templates.filter((template) => template.projectId === projectId);
}

export async function createTemplate(projectId: string, data: CreatePromptTemplateInput): Promise<PromptTemplate> {
  const state = await getAppState();
  const timestamp = now();
  const template: PromptTemplate = {
    id: createId('template'),
    projectId,
    name: data.name.trim(),
    description: data.description?.trim() || undefined,
    useCase: data.useCase,
    targetTool: data.targetTool,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  await setAppState({ ...state, templates: [template, ...state.templates] });
  return template;
}

export async function updateTemplate(id: string, patch: UpdatePromptTemplatePatch): Promise<PromptTemplate> {
  const state = await getAppState();
  let updatedTemplate: PromptTemplate | undefined;
  const templates = state.templates.map((template) => {
    if (template.id !== id) return template;
    updatedTemplate = {
      ...template,
      ...patch,
      name: patch.name?.trim() ?? template.name,
      description: 'description' in patch ? patch.description?.trim() || undefined : template.description,
      updatedAt: now()
    };
    return updatedTemplate;
  });

  if (!updatedTemplate) throw new Error('Template not found');
  await setAppState({ ...state, templates });
  return updatedTemplate;
}

export async function duplicateTemplate(id: string): Promise<PromptTemplate> {
  const state = await getAppState();
  const source = state.templates.find((template) => template.id === id);
  if (!source) throw new Error('Template not found');

  const timestamp = now();
  const duplicated: PromptTemplate = {
    ...source,
    id: createId('template'),
    name: `${source.name} Copy`,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  await setAppState({ ...state, templates: [duplicated, ...state.templates] });
  return duplicated;
}

export async function deleteTemplate(id: string): Promise<void> {
  const state = await getAppState();
  await setAppState({ ...state, templates: state.templates.filter((template) => template.id !== id) });
}
