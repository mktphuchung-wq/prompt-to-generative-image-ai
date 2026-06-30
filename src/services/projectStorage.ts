import type { Project } from '../types/project';

const PROJECTS_KEY = 'projects';
export const MAX_PROJECTS = 5;

type ProjectPatch = Partial<Pick<Project, 'name' | 'isActive'>>;

type ChromeLocalStorage = NonNullable<NonNullable<typeof chrome.storage>['local']>;

const memoryStore: Record<string, unknown> = {};

const getChromeStorage = (): ChromeLocalStorage | undefined => {
  if (typeof chrome === 'undefined') {
    return undefined;
  }

  return chrome.storage?.local;
};

const storageGet = async <T>(key: string): Promise<T | undefined> => {
  const chromeStorage = getChromeStorage();
  if (!chromeStorage) {
    return memoryStore[key] as T | undefined;
  }

  const result = await chromeStorage.get(key);
  return result[key] as T | undefined;
};

const storageSet = async (values: Record<string, unknown>): Promise<void> => {
  const chromeStorage = getChromeStorage();
  if (!chromeStorage) {
    Object.assign(memoryStore, values);
    return;
  }

  await chromeStorage.set(values);
};

const normalizeProjects = (projects: Project[]): Project[] => {
  const activeIndex = projects.findIndex((project) => project.isActive);

  if (activeIndex === -1) {
    return projects;
  }

  return projects.map((project, index) => ({
    ...project,
    isActive: index === activeIndex,
  }));
};

const saveProjects = async (projects: Project[]): Promise<Project[]> => {
  const normalizedProjects = normalizeProjects(projects);
  await storageSet({ [PROJECTS_KEY]: normalizedProjects });
  return normalizedProjects;
};

const createProjectId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `project-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

export const getProjects = async (): Promise<Project[]> => {
  const projects = await storageGet<Project[]>(PROJECTS_KEY);
  return Array.isArray(projects) ? normalizeProjects(projects) : [];
};

export const createProject = async (name: string): Promise<Project> => {
  const projects = await getProjects();

  if (projects.length >= MAX_PROJECTS) {
    throw new Error(`Project limit reached: ${MAX_PROJECTS}/${MAX_PROJECTS}`);
  }

  const now = new Date().toISOString();
  const project: Project = {
    id: createProjectId(),
    name: name.trim() || `Project ${projects.length + 1}`,
    createdAt: now,
    updatedAt: now,
    isActive: projects.length === 0,
  };

  await saveProjects([...projects, project]);
  return project;
};

export const updateProject = async (
  id: string,
  patch: ProjectPatch,
): Promise<Project | undefined> => {
  const projects = await getProjects();
  const existingProject = projects.find((project) => project.id === id);

  if (!existingProject) {
    return undefined;
  }

  const now = new Date().toISOString();
  const nextProjects = projects.map((project) => {
    if (project.id !== id) {
      return patch.isActive ? { ...project, isActive: false } : project;
    }

    return {
      ...project,
      ...patch,
      name: patch.name !== undefined ? patch.name.trim() || project.name : project.name,
      updatedAt: now,
    };
  });

  const savedProjects = await saveProjects(nextProjects);
  return savedProjects.find((project) => project.id === id);
};

export const deleteProject = async (id: string): Promise<void> => {
  const projects = await getProjects();
  const projectToDelete = projects.find((project) => project.id === id);
  const remainingProjects = projects.filter((project) => project.id !== id);

  if (projectToDelete?.isActive && remainingProjects.length > 0) {
    remainingProjects[0] = { ...remainingProjects[0], isActive: true };
  }

  await saveProjects(remainingProjects);
};

export const setActiveProject = async (id: string): Promise<Project | undefined> => {
  const projects = await getProjects();

  if (!projects.some((project) => project.id === id)) {
    return undefined;
  }

  const now = new Date().toISOString();
  const nextProjects = projects.map((project) => ({
    ...project,
    isActive: project.id === id,
    updatedAt: project.id === id ? now : project.updatedAt,
  }));

  const savedProjects = await saveProjects(nextProjects);
  return savedProjects.find((project) => project.id === id);
};

export const getActiveProject = async (): Promise<Project | undefined> => {
  const projects = await getProjects();
  return projects.find((project) => project.isActive);
};
