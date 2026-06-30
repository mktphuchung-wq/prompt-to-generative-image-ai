import {
  createProject,
  deleteProject,
  getProjects,
  MAX_PROJECTS,
  setActiveProject,
  updateProject,
} from './services/projectStorage.js';
import type { Project } from './types/project.js';

let projects: Project[] = [];

const getElement = <T extends HTMLElement>(id: string): T => {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Missing element: ${id}`);
  }
  return element as T;
};

const selector = getElement<HTMLSelectElement>('project-selector');
const newProjectNameInput = getElement<HTMLInputElement>('new-project-name');
const createProjectButton = getElement<HTMLButtonElement>('create-project');
const limitMessage = getElement<HTMLParagraphElement>('limit-message');
const loadingState = getElement<HTMLElement>('loading-state');
const emptyState = getElement<HTMLElement>('empty-state');
const activeProjectCard = getElement<HTMLElement>('active-project-card');
const activeProjectName = getElement<HTMLHeadingElement>('active-project-name');
const projectCount = getElement<HTMLSpanElement>('project-count');
const renameProjectButton = getElement<HTMLButtonElement>('rename-project');
const deleteProjectButton = getElement<HTMLButtonElement>('delete-project');
const statusMessage = getElement<HTMLParagraphElement>('status-message');

const getActiveProjectFromState = (): Project | undefined =>
  projects.find((project) => project.isActive);

const setStatus = (message: string): void => {
  statusMessage.textContent = message;
};

const render = (): void => {
  const activeProject = getActiveProjectFromState();
  const isProjectLimitReached = projects.length >= MAX_PROJECTS;

  selector.innerHTML = '';

  if (projects.length === 0) {
    selector.add(new Option('No project', ''));
  } else {
    projects.forEach((project) => {
      selector.add(new Option(project.name, project.id, false, project.id === activeProject?.id));
    });
  }

  selector.disabled = projects.length === 0;
  createProjectButton.disabled = isProjectLimitReached;
  newProjectNameInput.disabled = isProjectLimitReached;
  limitMessage.hidden = !isProjectLimitReached;

  loadingState.hidden = true;
  emptyState.hidden = projects.length > 0;
  activeProjectCard.hidden = projects.length === 0;

  activeProjectName.textContent = activeProject?.name ?? '';
  projectCount.textContent = `${projects.length}/${MAX_PROJECTS}`;
};

const refreshProjects = async (): Promise<void> => {
  projects = await getProjects();
  render();
};

createProjectButton.addEventListener('click', async () => {
  if (projects.length >= MAX_PROJECTS) {
    setStatus(`Project limit reached: ${MAX_PROJECTS}/${MAX_PROJECTS}`);
    return;
  }

  const project = await createProject(newProjectNameInput.value);
  newProjectNameInput.value = '';
  setStatus(`Created ${project.name}.`);
  await refreshProjects();
});

selector.addEventListener('change', async () => {
  const project = await setActiveProject(selector.value);
  setStatus(project ? `Switched to ${project.name}.` : 'Project not found.');
  await refreshProjects();
});

renameProjectButton.addEventListener('click', async () => {
  const activeProject = getActiveProjectFromState();
  if (!activeProject) {
    return;
  }

  const nextName = window.prompt('Rename project', activeProject.name);
  if (!nextName || nextName.trim() === activeProject.name) {
    return;
  }

  const project = await updateProject(activeProject.id, { name: nextName });
  setStatus(project ? `Renamed to ${project.name}.` : 'Project not found.');
  await refreshProjects();
});

deleteProjectButton.addEventListener('click', async () => {
  const activeProject = getActiveProjectFromState();
  if (!activeProject) {
    return;
  }

  const confirmed = window.confirm(
    `Delete "${activeProject.name}"? This will remove the project workspace from local storage.`,
  );

  if (!confirmed) {
    return;
  }

  await deleteProject(activeProject.id);
  setStatus(`Deleted ${activeProject.name}.`);
  await refreshProjects();
});

refreshProjects().catch((error: unknown) => {
  loadingState.hidden = true;
  setStatus(error instanceof Error ? error.message : 'Unable to load projects.');
});
