import { useEffect, useMemo, useState } from 'react';
import { generateFinalPrompt } from '../shared/promptGraphEngine';
import type {
  PromptGraph,
  PromptGraphEdge,
  PromptGraphNode,
  PromptGraphNodeType,
  PromptNodeData,
  PromptNodeDataType,
  PromptSelectionMode,
  PromptTemplate,
  PromptVariant
} from '../shared/types';

type PromptCanvasProps = {
  template: PromptTemplate;
  onBack: () => void;
  onSave: (graph: PromptGraph) => Promise<PromptTemplate>;
  onCreatePromptRun: (data: {
    finalPrompt: string;
    selectedVariantIds: string[];
    includedNodeIds: string[];
    addToQueue: boolean;
  }) => Promise<void>;
};

const NODE_KINDS: { type: PromptGraphNodeType; label: string; description: string; dataType: PromptNodeDataType }[] = [
  { type: 'text', label: 'Text Node', description: 'Reusable prompt block with editable variants.', dataType: 'custom' },
  { type: 'variant', label: 'Variant Node', description: 'Switch between copy, style, or scene options.', dataType: 'scene_style' },
  { type: 'artifact_input', label: 'Artifact Input', description: 'Placeholder for selected project assets.', dataType: 'product' },
  { type: 'tool_action', label: 'Tool Action', description: 'Instruction for edit, motion, or critique flows.', dataType: 'edit_instruction' },
  { type: 'output', label: 'Output', description: 'Final prompt destination node.', dataType: 'output_format' }
];

const NODE_DATA_TYPES: { value: PromptNodeDataType; label: string }[] = [
  { value: 'product', label: 'Product' },
  { value: 'product_accuracy', label: 'Product accuracy' },
  { value: 'model', label: 'Model' },
  { value: 'pose', label: 'Pose' },
  { value: 'background', label: 'Background' },
  { value: 'event_context', label: 'Event context' },
  { value: 'scene_style', label: 'Scene style' },
  { value: 'camera_angle', label: 'Camera angle' },
  { value: 'lighting', label: 'Lighting' },
  { value: 'composition', label: 'Composition' },
  { value: 'brand_constraints', label: 'Brand constraints' },
  { value: 'negative_constraints', label: 'Negative constraints' },
  { value: 'output_format', label: 'Output format' },
  { value: 'edit_instruction', label: 'Edit instruction' },
  { value: 'motion_instruction', label: 'Motion instruction' },
  { value: 'critique_instruction', label: 'Critique instruction' },
  { value: 'custom', label: 'Custom' }
];

const SELECTION_MODES: { value: PromptSelectionMode; label: string }[] = [
  { value: 'single', label: 'Single' },
  { value: 'multiple', label: 'Multiple' },
  { value: 'manual', label: 'Manual' }
];

const createId = (prefix: string) => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

function defaultData(label: string, nodeType: PromptNodeDataType): PromptNodeData {
  return {
    name: label,
    nodeType,
    isEnabled: true,
    isRequired: false,
    selectionMode: 'single',
    variants: [
      { id: createId('variant'), label: 'Default', content: `Describe ${label.toLowerCase()} here.`, isSelected: true, order: 1 }
    ]
  };
}

function emptyGraph(template: PromptTemplate): PromptGraph {
  return { id: createId('graph'), templateId: template.id, nodes: [], edges: [] };
}

function normalizeGraph(template: PromptTemplate): PromptGraph {
  if (!template.graph) return emptyGraph(template);
  return {
    id: template.graph.id ?? createId('graph'),
    templateId: template.graph.templateId ?? template.id,
    nodes: template.graph.nodes.map((node, index) => ({
      id: node.id,
      type: node.type ?? 'text',
      position: node.position ?? { x: 64 + index * 24, y: 80 + index * 24 },
      data: node.data ?? defaultData(`Node ${index + 1}`, 'custom')
    })),
    edges: template.graph.edges ?? []
  };
}

export default function PromptCanvas({ template, onBack, onSave, onCreatePromptRun }: PromptCanvasProps) {
  const [graph, setGraph] = useState<PromptGraph>(() => normalizeGraph(template));
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [manualPrompt, setManualPrompt] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState('');

  useEffect(() => {
    setGraph(normalizeGraph(template));
    setSelectedNodeId(null);
    setConnectingFrom(null);
    setManualPrompt(null);
  }, [template.id]);

  useEffect(() => {
    if (!dragging) return undefined;
    const move = (event: globalThis.MouseEvent) => {
      setGraph((current) => ({
        ...current,
        nodes: current.nodes.map((node) => node.id === dragging.id
          ? { ...node, position: { x: Math.max(8, event.clientX - dragging.offsetX), y: Math.max(8, event.clientY - dragging.offsetY) } }
          : node)
      }));
    };
    const up = () => setDragging(null);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
  }, [dragging]);

  const selectedNode = graph.nodes.find((node) => node.id === selectedNodeId) ?? null;
  const nodeCenters = useMemo(() => Object.fromEntries(graph.nodes.map((node) => [node.id, { x: node.position.x + 110, y: node.position.y + 42 }])), [graph.nodes]);
  const promptResult = useMemo(() => generateFinalPrompt(graph), [graph]);
  const promptPreview = manualPrompt ?? promptResult.finalPrompt;
  const manualEditsActive = manualPrompt !== null;

  const addNode = (kind: (typeof NODE_KINDS)[number]) => {
    const id = createId('node');
    const node: PromptGraphNode = {
      id,
      type: kind.type,
      position: { x: 80 + graph.nodes.length * 28, y: 80 + graph.nodes.length * 24 },
      data: defaultData(kind.label, kind.dataType)
    };
    setGraph((current) => ({ ...current, nodes: [...current.nodes, node] }));
    setSelectedNodeId(id);
  };

  const updateSelectedData = (patch: Partial<PromptNodeData>) => {
    if (!selectedNode) return;
    setGraph((current) => ({ ...current, nodes: current.nodes.map((node) => node.id === selectedNode.id ? { ...node, data: { ...node.data, ...patch } } : node) }));
  };

  const updateVariant = (variantId: string, patch: Partial<PromptVariant>) => {
    if (!selectedNode) return;
    updateSelectedData({ variants: selectedNode.data.variants.map((variant) => variant.id === variantId ? { ...variant, ...patch } : variant) });
  };

  const deleteNode = (id: string) => {
    setGraph((current) => ({ ...current, nodes: current.nodes.filter((node) => node.id !== id), edges: current.edges.filter((edge) => edge.source !== id && edge.target !== id) }));
    setSelectedNodeId((current) => current === id ? null : current);
  };

  const connectTo = (targetId: string) => {
    if (!connectingFrom || connectingFrom === targetId) return;
    const id = `edge_${connectingFrom}_${targetId}`;
    setGraph((current) => current.edges.some((edge) => edge.id === id) ? current : { ...current, edges: [...current.edges, { id, source: connectingFrom, target: targetId, sourceHandle: 'out', targetHandle: 'in' }] });
    setConnectingFrom(null);
  };

  const copyPrompt = async () => {
    if (!promptPreview) return;
    await navigator.clipboard.writeText(promptPreview);
    setCopyStatus('Copied');
    window.setTimeout(() => setCopyStatus(''), 1600);
  };

  const savePromptRun = async (addToQueue = false) => {
    if (!promptPreview.trim()) return;
    await onCreatePromptRun({
      finalPrompt: promptPreview,
      selectedVariantIds: promptResult.includedVariantIds,
      includedNodeIds: promptResult.includedNodeIds,
      addToQueue
    });
    setCopyStatus(addToQueue ? 'Prompt run added to queue.' : 'Prompt run saved.');
    window.setTimeout(() => setCopyStatus(''), 2400);
  };

  const save = async () => {
    setIsSaving(true);
    const saved = await onSave(graph);
    setGraph(normalizeGraph(saved));
    setIsSaving(false);
  };

  return (
    <main className="canvas-shell">
      <header className="canvas-topbar">
        <button className="text-button" type="button" onClick={onBack}>← Back</button>
        <div><p className="eyebrow">Prompt Canvas</p><h1>{template.name}</h1></div>
        <button className="primary-button compact" type="button" onClick={save} disabled={isSaving}>{isSaving ? 'Saving…' : 'Save graph'}</button>
      </header>
      <section className="canvas-layout">
        <aside className="node-library"><h2>Node Library</h2>{NODE_KINDS.map((kind) => <button key={kind.type} type="button" onClick={() => addNode(kind)}><strong>{kind.label}</strong><span>{kind.description}</span></button>)}</aside>
        <section className="flow-board" aria-label="Prompt node canvas">
          <svg className="edge-layer">{graph.edges.map((edge: PromptGraphEdge) => <line key={edge.id} x1={nodeCenters[edge.source]?.x ?? 0} y1={nodeCenters[edge.source]?.y ?? 0} x2={nodeCenters[edge.target]?.x ?? 0} y2={nodeCenters[edge.target]?.y ?? 0} />)}</svg>
          {graph.nodes.map((node) => <article key={node.id} className={`prompt-node ${selectedNodeId === node.id ? 'selected' : ''} ${!node.data.isEnabled ? 'disabled' : ''}`} style={{ left: node.position.x, top: node.position.y }} onMouseDown={(event: any) => { setSelectedNodeId(node.id); setDragging({ id: node.id, offsetX: event.clientX - node.position.x, offsetY: event.clientY - node.position.y }); }}>
            <button className="node-handle input" type="button" aria-label="Connect to this node" onMouseDown={(event: any) => event.stopPropagation()} onClick={() => connectTo(node.id)} />
            <p className="node-type">{node.type.replace('_', ' ')}</p><h3>{node.data.name}</h3><small>{node.data.nodeType.replace('_', ' ')} · {node.data.variants.length} variants</small>
            <div className="node-actions"><button type="button" onMouseDown={(event: any) => event.stopPropagation()} onClick={() => setConnectingFrom(node.id)}>{connectingFrom === node.id ? 'Pick target' : 'Connect'}</button><button type="button" onMouseDown={(event: any) => event.stopPropagation()} onClick={() => deleteNode(node.id)}>Delete</button></div>
            <button className="node-handle output" type="button" aria-label="Start connection" onMouseDown={(event: any) => event.stopPropagation()} onClick={() => setConnectingFrom(node.id)} />
          </article>)}
          {graph.nodes.length === 0 && <p className="canvas-empty">Add a node from the library to start building this prompt template.</p>}
        </section>
        <aside className="node-inspector"><h2>Node Inspector</h2>{selectedNode ? <div className="inspector-form">
          <label>Name<input value={selectedNode.data.name} onChange={(event: any) => updateSelectedData({ name: event.target.value })} /></label>
          <label>Node type<select value={selectedNode.data.nodeType} onChange={(event: any) => updateSelectedData({ nodeType: event.target.value as PromptNodeDataType })}>{NODE_DATA_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}</select></label>
          <label>Selection mode<select value={selectedNode.data.selectionMode} onChange={(event: any) => updateSelectedData({ selectionMode: event.target.value as PromptSelectionMode })}>{SELECTION_MODES.map((mode) => <option key={mode.value} value={mode.value}>{mode.label}</option>)}</select></label>
          {selectedNode.data.selectionMode === 'manual' && <label>Manual text<textarea rows={4} value={selectedNode.data.manualText ?? ''} onChange={(event: any) => updateSelectedData({ manualText: event.target.value })} /></label>}
          <label className="check-row"><input type="checkbox" checked={selectedNode.data.isEnabled} onChange={(event: any) => updateSelectedData({ isEnabled: event.target.checked })} /> Enabled</label>
          <label className="check-row"><input type="checkbox" checked={Boolean(selectedNode.data.isRequired)} onChange={(event: any) => updateSelectedData({ isRequired: event.target.checked })} /> Required</label>
          <div className="variant-header"><h3>Variants</h3><button type="button" onClick={() => updateSelectedData({ variants: [...selectedNode.data.variants, { id: createId('variant'), label: 'New variant', content: '', isSelected: false, order: selectedNode.data.variants.length + 1 }] })}>Add</button></div>
          {selectedNode.data.variants.map((variant) => <div className="variant-card" key={variant.id}><label>Label<input value={variant.label} onChange={(event: any) => updateVariant(variant.id, { label: event.target.value })} /></label><label>Content<textarea rows={3} value={variant.content} onChange={(event: any) => updateVariant(variant.id, { content: event.target.value })} /></label><div className="variant-actions"><label className="check-row"><input type="checkbox" checked={variant.isSelected} onChange={(event: any) => updateVariant(variant.id, { isSelected: event.target.checked })} /> Selected</label><button type="button" onClick={() => updateSelectedData({ variants: selectedNode.data.variants.filter((item) => item.id !== variant.id) })}>Delete</button></div></div>)}
        </div> : <p>Select a node to edit its prompt metadata and variants.</p>}</aside>
      </section>
      <footer className="prompt-preview"><div><p className="eyebrow">Final Prompt Preview</p><h2>{manualEditsActive ? 'Manual edits active' : 'Live graph preview'}</h2><div className="preview-actions"><button type="button" onClick={copyPrompt} disabled={!promptPreview}>Copy Prompt</button><button type="button" onClick={() => savePromptRun(false)} disabled={!promptPreview}>Save Prompt Run</button><button type="button" onClick={() => savePromptRun(true)} disabled={!promptPreview}>Add to Queue</button>{manualEditsActive ? <button type="button" onClick={() => setManualPrompt(null)}>Reset manual edits</button> : <button type="button" onClick={() => setManualPrompt(promptResult.finalPrompt)}>Manual Edit</button>}</div>{copyStatus && <p className="copy-status">{copyStatus}</p>}{promptResult.warnings.length > 0 && <ul className="prompt-warnings">{promptResult.warnings.map((warning, index) => <li key={`${warning.code}-${warning.nodeId ?? index}`}>{warning.message}</li>)}</ul>}</div>{manualEditsActive ? <textarea className="manual-prompt-editor" rows={8} value={promptPreview} onChange={(event: any) => setManualPrompt(event.target.value)} /> : <pre>{promptPreview || 'Connect enabled nodes to build the final prompt.'}</pre>}</footer>
    </main>
  );
}
