import { STORAGE_KEYS } from './constants';
import type {
  AppState,
  Artifact,
  ArtifactType,
  Output,
  OutputStatus,
  PromptRun,
  PromptRunStatus,
  PromptTemplate,
  PromptTemplateUseCase,
  PromptTemplateTargetTool,
  Project,
  QueueItem,
  QueueItemStatus
} from './types';

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
  promptRuns: [],
  queueItems: [],
  outputs: [],
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
    promptRuns: state?.promptRuns ?? [],
    queueItems: state?.queueItems ?? [],
    outputs: state?.outputs ?? [],
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

export type CreatePromptRunInput = {
  projectId: string;
  templateId: string;
  finalPrompt: string;
  selectedVariantIds: string[];
  includedNodeIds: string[];
  targetTool: PromptTemplateTargetTool;
  status?: PromptRunStatus;
};

export async function getPromptRuns(projectId: string): Promise<PromptRun[]> {
  const state = await getAppState();
  return state.promptRuns.filter((run) => run.projectId === projectId);
}

export async function createPromptRun(data: CreatePromptRunInput): Promise<PromptRun> {
  const state = await getAppState();
  const timestamp = now();
  const promptRun: PromptRun = {
    id: createId('prompt_run'),
    projectId: data.projectId,
    templateId: data.templateId,
    finalPrompt: data.finalPrompt,
    selectedVariantIds: data.selectedVariantIds,
    includedNodeIds: data.includedNodeIds,
    targetTool: data.targetTool,
    status: data.status ?? 'draft',
    createdAt: timestamp,
    updatedAt: timestamp
  };

  await setAppState({ ...state, promptRuns: [promptRun, ...state.promptRuns] });
  return promptRun;
}

export async function updatePromptRun(id: string, patch: Partial<Omit<PromptRun, 'id' | 'createdAt'>>): Promise<PromptRun> {
  const state = await getAppState();
  let updatedPromptRun: PromptRun | undefined;
  const promptRuns = state.promptRuns.map((run) => {
    if (run.id !== id) return run;
    updatedPromptRun = { ...run, ...patch, updatedAt: now() };
    return updatedPromptRun;
  });

  if (!updatedPromptRun) throw new Error('Prompt run not found');
  await setAppState({ ...state, promptRuns });
  return updatedPromptRun;
}

export async function getQueueItems(projectId: string): Promise<QueueItem[]> {
  const state = await getAppState();
  return state.queueItems
    .filter((item) => item.projectId === projectId)
    .sort((a, b) => a.order - b.order || a.createdAt.localeCompare(b.createdAt));
}

export async function addPromptRunToQueue(promptRunId: string): Promise<QueueItem> {
  const state = await getAppState();
  const promptRun = state.promptRuns.find((run) => run.id === promptRunId);
  if (!promptRun) throw new Error('Prompt run not found');

  const timestamp = now();
  const projectQueue = state.queueItems.filter((item) => item.projectId === promptRun.projectId);
  const nextOrder = projectQueue.reduce((max, item) => Math.max(max, item.order), 0) + 1;
  const queueItem: QueueItem = {
    id: createId('queue_item'),
    projectId: promptRun.projectId,
    promptRunId: promptRun.id,
    targetTool: promptRun.targetTool,
    status: 'pending',
    order: nextOrder,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  const promptRuns = state.promptRuns.map((run) => run.id === promptRun.id ? { ...run, status: 'queued' as PromptRunStatus, updatedAt: timestamp } : run);
  await setAppState({ ...state, promptRuns, queueItems: [...state.queueItems, queueItem] });
  return queueItem;
}

export async function updateQueueItem(id: string, patch: Partial<Omit<QueueItem, 'id' | 'createdAt'>>): Promise<QueueItem> {
  const state = await getAppState();
  let updatedQueueItem: QueueItem | undefined;
  const timestamp = now();
  const queueItems = state.queueItems.map((item) => {
    if (item.id !== id) return item;
    updatedQueueItem = { ...item, ...patch, updatedAt: timestamp };
    return updatedQueueItem;
  });

  if (!updatedQueueItem) throw new Error('Queue item not found');
  await setAppState({ ...state, queueItems });
  return updatedQueueItem;
}

export async function runNextQueueItem(projectId: string): Promise<QueueItem | undefined> {
  const state = await getAppState();
  const timestamp = now();
  const next = state.queueItems
    .filter((item) => item.projectId === projectId && item.status === 'pending')
    .sort((a, b) => a.order - b.order || a.createdAt.localeCompare(b.createdAt))[0];

  if (!next) return undefined;

  let updatedQueueItem: QueueItem | undefined;
  const queueItems = state.queueItems.map((item) => {
    if (item.projectId === projectId && item.status === 'active') {
      return { ...item, status: 'pending' as QueueItemStatus, updatedAt: timestamp };
    }
    if (item.id === next.id) {
      updatedQueueItem = { ...item, status: 'active', updatedAt: timestamp };
      return updatedQueueItem;
    }
    return item;
  });
  const promptRuns = state.promptRuns.map((run) => run.id === next.promptRunId ? { ...run, status: 'running' as PromptRunStatus, updatedAt: timestamp } : run);

  await setAppState({ ...state, promptRuns, queueItems });
  return updatedQueueItem;
}

export async function clearCompletedQueueItems(projectId: string): Promise<void> {
  const state = await getAppState();
  await setAppState({
    ...state,
    queueItems: state.queueItems.filter((item) => item.projectId !== projectId || !['done', 'skipped'].includes(item.status))
  });
}


export type CreateOutputInput = {
  projectId: string;
  promptRunId?: string;
  parentOutputId?: string;
  fileName: string;
  fileType: Output['fileType'];
  dataUrl?: string;
  sourceTool: Output['sourceTool'];
  originalPrompt?: string;
  editPrompt?: string;
};

export type CreateArtifactInput = {
  outputId: string;
  name?: string;
  type?: ArtifactType;
  tags?: string[];
};

export async function createOutput(data: CreateOutputInput): Promise<Output> {
  const state = await getAppState();
  const timestamp = now();
  // TODO: Move larger binary payloads to IndexedDB; chrome.storage.local dataUrl storage is MVP-only for small images.
  const output: Output = {
    id: createId('output'),
    projectId: data.projectId,
    promptRunId: data.promptRunId || undefined,
    parentOutputId: data.parentOutputId,
    fileName: data.fileName,
    fileType: data.fileType,
    dataUrl: data.dataUrl,
    sourceTool: data.sourceTool,
    status: 'needs_review',
    originalPrompt: data.originalPrompt?.trim() || undefined,
    editPrompt: data.editPrompt?.trim() || undefined,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  await setAppState({ ...state, outputs: [output, ...state.outputs] });
  return output;
}

export async function updateOutput(id: string, patch: Partial<Omit<Output, 'id' | 'createdAt'>>): Promise<Output> {
  const state = await getAppState();
  let updatedOutput: Output | undefined;
  const timestamp = now();
  const outputs = state.outputs.map((output) => {
    if (output.id !== id) return output;
    updatedOutput = { ...output, ...patch, updatedAt: timestamp };
    return updatedOutput;
  });

  if (!updatedOutput) throw new Error('Output not found');
  await setAppState({ ...state, outputs });
  return updatedOutput;
}

export async function approveOutputAsArtifact(data: CreateArtifactInput): Promise<Artifact> {
  const state = await getAppState();
  const output = state.outputs.find((item) => item.id === data.outputId);
  if (!output) throw new Error('Output not found');

  const timestamp = now();
  const promptRun = output.promptRunId ? state.promptRuns.find((run) => run.id === output.promptRunId) : undefined;
  const existingArtifact = state.artifacts.find((artifact) => artifact.sourceOutputId === output.id);
  const artifact: Artifact = existingArtifact ? {
    ...existingArtifact,
    name: data.name?.trim() || existingArtifact.name,
    type: data.type ?? existingArtifact.type,
    tags: data.tags ?? existingArtifact.tags,
    updatedAt: timestamp
  } : {
    id: createId('artifact'),
    projectId: output.projectId,
    sourceOutputId: output.id,
    name: data.name?.trim() || output.fileName.replace(/\.[^/.]+$/, '') || 'Approved artifact',
    type: data.type ?? 'other',
    tags: data.tags ?? [],
    fileName: output.fileName,
    fileType: output.fileType,
    dataUrl: output.dataUrl,
    sourceTool: output.sourceTool,
    originalPrompt: output.originalPrompt ?? promptRun?.finalPrompt,
    selectedVariantIds: promptRun?.selectedVariantIds,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  const outputs = state.outputs.map((item) => item.id === output.id ? { ...item, status: 'approved' as OutputStatus, updatedAt: timestamp } : item);
  const artifacts = existingArtifact
    ? state.artifacts.map((item) => item.id === artifact.id ? artifact : item)
    : [artifact, ...state.artifacts];
  await setAppState({ ...state, outputs, artifacts });
  return artifact;
}

export async function updateArtifact(id: string, patch: Partial<Omit<Artifact, 'id' | 'createdAt'>>): Promise<Artifact> {
  const state = await getAppState();
  let updatedArtifact: Artifact | undefined;
  const artifacts = state.artifacts.map((artifact) => {
    if (artifact.id !== id) return artifact;
    updatedArtifact = {
      ...artifact,
      ...patch,
      name: patch.name?.trim() || artifact.name,
      tags: patch.tags ?? artifact.tags,
      updatedAt: now()
    };
    return updatedArtifact;
  });

  if (!updatedArtifact) throw new Error('Artifact not found');
  await setAppState({ ...state, artifacts });
  return updatedArtifact;
}
