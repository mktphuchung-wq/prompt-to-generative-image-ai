import { useEffect, useMemo, useState } from 'react';
import { EXTENSION_NAME } from '../shared/constants';
import { sendPromptToTool } from '../shared/toolTabController';
import {
  addPromptRunToQueue,
  clearCompletedQueueItems,
  createPromptRun,
  createTemplate,
  deleteTemplate,
  duplicateTemplate,
  getAppState,
  updateQueueItem,
  updatePromptRun,
  updateTemplate
} from '../shared/storage';
import type {
  AppState,
  PromptGraph,
  PromptRun,
  PromptTemplate,
  PromptTemplateTargetTool,
  PromptTemplateUseCase,
  QueueItem,
  QueueItemStatus,
  SupportedToolId
} from '../shared/types';
import PromptCanvas from './PromptCanvas';

const USE_CASES: { value: PromptTemplateUseCase; label: string }[] = [
  { value: 'mockup_with_person', label: 'Mockup with person' },
  { value: 'mockup_without_person', label: 'Mockup without person' },
  { value: 'lifestyle_image', label: 'Lifestyle image' },
  { value: 'clean_ecommerce', label: 'Clean ecommerce' },
  { value: 'event_campaign', label: 'Event campaign' },
  { value: 'social_visual', label: 'Social visual' },
  { value: 'ad_creative', label: 'Ad creative' },
  { value: 'image_variation', label: 'Image variation' },
  { value: 'image_edit', label: 'Image edit' },
  { value: 'video_prompt', label: 'Video prompt' },
  { value: 'critique_prompt', label: 'Critique prompt' }
];

const TARGET_TOOLS: { value: PromptTemplateTargetTool; label: string }[] = [
  { value: 'chatgpt', label: 'ChatGPT' },
  { value: 'gemini', label: 'Gemini' },
  { value: 'google_flow', label: 'Google Flow' },
  { value: 'manual', label: 'Manual' }
];

const emptyForm = {
  name: '',
  description: '',
  useCase: 'mockup_with_person' as PromptTemplateUseCase,
  targetTool: 'chatgpt' as PromptTemplateTargetTool
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value));
}

export default function App() {
  const [state, setState] = useState<AppState | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [useCaseFilter, setUseCaseFilter] = useState<'all' | PromptTemplateUseCase>('all');
  const [canvasTemplate, setCanvasTemplate] = useState<PromptTemplate | null>(null);
  const [screen, setScreen] = useState<'templates' | 'queue'>('templates');
  const [queueMessage, setQueueMessage] = useState('');

  const refreshState = () => getAppState().then(setState);

  useEffect(() => {
    refreshState().catch(() =>
      setState({ projects: [], activeProjectId: '', templates: [], promptRuns: [], queueItems: [], artifacts: [] })
    );
  }, []);

  const activeProject = state?.projects.find((project) => project.id === state.activeProjectId);
  const activePromptRuns = state?.promptRuns.filter((run) => run.projectId === state.activeProjectId) ?? [];
  const activeQueueItems = useMemo(() => {
    return (state?.queueItems.filter((item) => item.projectId === state.activeProjectId) ?? [])
      .sort((a, b) => a.order - b.order || a.createdAt.localeCompare(b.createdAt));
  }, [state]);
  const activeTemplates = useMemo(() => {
    const templates = state?.templates.filter((template) => template.projectId === state.activeProjectId) ?? [];
    const query = search.trim().toLowerCase();

    return templates.filter((template) => {
      const matchesSearch = !query || template.name.toLowerCase().includes(query);
      const matchesUseCase = useCaseFilter === 'all' || template.useCase === useCaseFilter;
      return matchesSearch && matchesUseCase;
    });
  }, [search, state, useCaseFilter]);

  const submitTemplate = async (event: { preventDefault: () => void }) => {
    event.preventDefault();
    if (!state?.activeProjectId || !form.name.trim()) return;

    if (editingId) {
      await updateTemplate(editingId, form);
    } else {
      await createTemplate(state.activeProjectId, form);
    }

    setForm(emptyForm);
    setEditingId(null);
    await refreshState();
  };

  const startEditing = (template: PromptTemplate) => {
    setEditingId(template.id);
    setForm({
      name: template.name,
      description: template.description ?? '',
      useCase: template.useCase,
      targetTool: template.targetTool
    });
  };

  const duplicate = async (id: string) => {
    await duplicateTemplate(id);
    await refreshState();
  };

  const remove = async (id: string) => {
    await deleteTemplate(id);
    if (editingId === id) {
      setEditingId(null);
      setForm(emptyForm);
    }
    await refreshState();
  };

  if (canvasTemplate) {
    return (
      <PromptCanvas
        template={canvasTemplate}
        onBack={() => setCanvasTemplate(null)}
        onSave={async (graph: PromptGraph) => {
          const updated = await updateTemplate(canvasTemplate.id, { graph });
          setCanvasTemplate(updated);
          await refreshState();
          return updated;
        }}
        onCreatePromptRun={async (data) => {
          const promptRun = await createPromptRun({
            projectId: canvasTemplate.projectId,
            templateId: canvasTemplate.id,
            finalPrompt: data.finalPrompt,
            selectedVariantIds: data.selectedVariantIds,
            includedNodeIds: data.includedNodeIds,
            targetTool: canvasTemplate.targetTool
          });
          if (data.addToQueue) {
            await addPromptRunToQueue(promptRun.id);
          }
          await refreshState();
        }}
      />
    );
  }

  const runQueueItem = async (item: QueueItem) => {
    const promptRun = activePromptRuns.find((run) => run.id === item.promptRunId);
    if (!promptRun) {
      await updateQueueItem(item.id, { status: 'failed', error: 'Prompt run not found.' });
      setQueueMessage('Prompt run not found.');
      await refreshState();
      return;
    }

    if (item.targetTool === 'manual') {
      await updateQueueItem(item.id, { status: 'waiting_user', error: 'Manual target selected. Prompt copied. Paste manually if auto-paste did not work.' });
      await updatePromptRun(item.promptRunId, { status: 'waiting_user' });
      await navigator.clipboard.writeText(promptRun.finalPrompt);
      setQueueMessage('Prompt copied. Paste manually if auto-paste did not work.');
      await refreshState();
      return;
    }

    const response = await sendPromptToTool(item.targetTool as SupportedToolId, promptRun.finalPrompt);
    const nextStatus: QueueItemStatus = response.pasted ? 'sent' : 'waiting_user';
    await updateQueueItem(item.id, {
      status: nextStatus,
      error: response.pasted ? undefined : 'Prompt copied. Paste manually if auto-paste did not work.'
    });
    await updatePromptRun(item.promptRunId, { status: response.pasted ? 'sent' : 'waiting_user' });
    setQueueMessage('Prompt copied. Paste manually if auto-paste did not work.');
    await refreshState();
  };

  const runNextQueuedPrompt = async () => {
    const next = activeQueueItems.find((item) => item.status === 'pending') ?? activeQueueItems.find((item) => item.status === 'active');
    if (!next) {
      setQueueMessage('No pending queue item to run.');
      return;
    }
    await runQueueItem(next);
  };

  const setQueueStatus = async (item: QueueItem, status: QueueItemStatus) => {
    await updateQueueItem(item.id, { status, error: undefined });
    const promptRunStatusByQueueStatus: Partial<Record<QueueItemStatus, PromptRun['status']>> = {
      sent: 'sent',
      waiting_user: 'waiting_user',
      waiting_output: 'waiting_output',
      output_ready: 'output_ready',
      done: 'approved',
      failed: 'failed',
      skipped: 'rejected'
    };
    const promptRunStatus = promptRunStatusByQueueStatus[status];
    if (promptRunStatus) {
      await updatePromptRun(item.promptRunId, { status: promptRunStatus });
    }
    await refreshState();
  };

  const renderQueue = () => (
    <main className="app-shell">
      <header className="hero">
        <p className="eyebrow">Run Queue</p>
        <h1>Process prompt runs</h1>
        <p>Queue items are scoped to <strong>{activeProject?.name ?? 'the active Project'}</strong> and persist in local extension storage.</p>
        <div className="hero-actions">
          <button className="text-button" type="button" onClick={() => setScreen('templates')}>← Template Library</button>
          <button className="primary-button compact" type="button" onClick={runNextQueuedPrompt}>Run Next</button>
          <button className="text-button" type="button" onClick={async () => { await clearCompletedQueueItems(state?.activeProjectId ?? ''); await refreshState(); }}>Clear Completed</button>
        </div>
      </header>
      <section className="panel-card">
        <div className="section-heading"><div><h2>Queued tasks</h2><p>Use these manual controls to move each prompt through the semi-auto workflow.</p></div></div>
        {queueMessage && <p className="copy-status">{queueMessage}</p>}
        <div className="queue-list">
          {activeQueueItems.length === 0 && <p className="empty-state">No prompt runs are queued for this Project yet.</p>}
          {activeQueueItems.map((item) => {
            const promptRun = activePromptRuns.find((run) => run.id === item.promptRunId);
            return (
              <article className="queue-card" key={item.id}>
                <div className="queue-card-header">
                  <div><h3>#{item.order} · {promptRun?.templateId === undefined ? 'Missing prompt run' : 'Prompt run'}</h3><p>{promptRun?.finalPrompt.slice(0, 220) || 'Prompt run not found.'}</p></div>
                  <span className={`status-pill status-${item.status}`}>{item.status.replace('_', ' ')}</span>
                </div>
                <dl className="metadata-grid">
                  <div><dt>Target tool</dt><dd>{item.targetTool.replace('_', ' ')}</dd></div>
                  <div><dt>Updated</dt><dd>{formatDate(item.updatedAt)}</dd></div>
                </dl>
                <div className="queue-actions">
                  <button type="button" onClick={() => runQueueItem(item)} disabled={!promptRun}>Run Next</button><button type="button" onClick={() => setQueueStatus(item, 'sent')}>Mark Sent</button>
                  <button type="button" onClick={() => setQueueStatus(item, 'waiting_output')}>Mark Waiting Output</button>
                  <button type="button" onClick={() => setQueueStatus(item, 'output_ready')}>Mark Output Ready</button>
                  <button type="button" onClick={() => setQueueStatus(item, 'pending')}>Retry</button>
                  <button type="button" onClick={() => setQueueStatus(item, 'skipped')}>Skip</button>
                  <button type="button" onClick={() => setQueueStatus(item, 'done')}>Done</button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );

  if (screen === 'queue') return renderQueue();

  return (
    <main className="app-shell">
      <header className="hero">
        <p className="eyebrow">Template Library</p>
        <h1>{EXTENSION_NAME}</h1>
        <p>
          Manage reusable prompt workflows for <strong>{activeProject?.name ?? 'the active Project'}</strong>.
          Templates shown here are scoped to the active Project only.
        </p>
        <div className="hero-actions">
          <button className="primary-button compact" type="button" onClick={() => setScreen('queue')}>Open Run Queue</button>
        </div>
      </header>

      <section className="status-grid" aria-label="Workflow status">
        <article>
          <span className="metric">{activeTemplates.length}</span>
          <strong>Visible templates</strong>
          <p>Filtered by search, use case, and active Project.</p>
        </article>
        <article>
          <span className="metric">{state?.templates.length ?? '—'}</span>
          <strong>Total stored</strong>
          <p>All Projects remain in local extension storage.</p>
        </article>
        <article>
          <span className="metric">{activeQueueItems.length}</span>
          <strong>Queue items</strong>
          <p>Pending and completed prompt runs for this Project.</p>
        </article>
      </section>

      <section className="panel-card">
        <div className="section-heading">
          <div>
            <h2>{editingId ? 'Edit Template' : 'Create Template'}</h2>
            <p>Name the workflow, choose its use case, and pick the intended target tool.</p>
          </div>
          {editingId && (
            <button className="text-button" type="button" onClick={() => { setEditingId(null); setForm(emptyForm); }}>
              Cancel edit
            </button>
          )}
        </div>
        <form className="template-form" onSubmit={submitTemplate}>
          <label>
            Name
            <input value={form.name} onChange={(event: { target: HTMLInputElement }) => setForm({ ...form, name: event.target.value })} required />
          </label>
          <label>
            Description
            <textarea value={form.description} onChange={(event: { target: HTMLTextAreaElement }) => setForm({ ...form, description: event.target.value })} rows={3} />
          </label>
          <div className="form-row">
            <label>
              Use case
              <select value={form.useCase} onChange={(event: { target: HTMLSelectElement }) => setForm({ ...form, useCase: event.target.value as PromptTemplateUseCase })}>
                {USE_CASES.map((useCase) => <option key={useCase.value} value={useCase.value}>{useCase.label}</option>)}
              </select>
            </label>
            <label>
              Target tool
              <select value={form.targetTool} onChange={(event: { target: HTMLSelectElement }) => setForm({ ...form, targetTool: event.target.value as PromptTemplateTargetTool })}>
                {TARGET_TOOLS.map((tool) => <option key={tool.value} value={tool.value}>{tool.label}</option>)}
              </select>
            </label>
          </div>
          <button className="primary-button" type="submit">{editingId ? 'Save Template' : 'Create Template'}</button>
        </form>
      </section>

      <section className="panel-card">
        <div className="section-heading">
          <div>
            <h2>Templates</h2>
            <p>Search and filter the active Project library.</p>
          </div>
        </div>
        <div className="filters">
          <input aria-label="Search templates by name" placeholder="Search by name" value={search} onChange={(event: { target: HTMLInputElement }) => setSearch(event.target.value)} />
          <select aria-label="Filter by use case" value={useCaseFilter} onChange={(event: { target: HTMLSelectElement }) => setUseCaseFilter(event.target.value as 'all' | PromptTemplateUseCase)}>
            <option value="all">All use cases</option>
            {USE_CASES.map((useCase) => <option key={useCase.value} value={useCase.value}>{useCase.label}</option>)}
          </select>
        </div>

        <div className="template-list">
          {activeTemplates.length === 0 && <p className="empty-state">No templates match this Project, search, and filter.</p>}
          {activeTemplates.map((template: PromptTemplate) => {
            const useCase = USE_CASES.find((item) => item.value === template.useCase)?.label ?? template.useCase;
            const targetTool = TARGET_TOOLS.find((item) => item.value === template.targetTool)?.label ?? template.targetTool;
            const nodeCount = template.graph?.nodes.length;

            return (
              <article className="template-card" key={template.id}>
                <div>
                  <h3>{template.name}</h3>
                  {template.description && <p>{template.description}</p>}
                </div>
                <dl className="metadata-grid">
                  <div><dt>Use case</dt><dd>{useCase}</dd></div>
                  <div><dt>Target tool</dt><dd>{targetTool}</dd></div>
                  <div><dt>Nodes</dt><dd>{nodeCount === undefined ? 'No graph yet' : nodeCount}</dd></div>
                  <div><dt>Last updated</dt><dd>{formatDate(template.updatedAt)}</dd></div>
                </dl>
                <div className="card-actions">
                  <button type="button" onClick={() => setCanvasTemplate(template)}>Open in Canvas</button>
                  <button type="button" onClick={() => startEditing(template)}>Edit</button>
                  <button type="button" onClick={() => duplicate(template.id)}>Duplicate</button>
                  <button className="danger-button" type="button" onClick={() => remove(template.id)}>Delete</button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
