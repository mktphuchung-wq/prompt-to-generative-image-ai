import type { PromptGraph, PromptGraphNode } from './types';

export type PromptGraphWarningCode = 'required_missing_variant' | 'no_output_node' | 'no_connected_enabled_nodes' | 'cycle_detected';

export type PromptGraphWarning = {
  code: PromptGraphWarningCode;
  message: string;
  nodeId?: string;
};

export type PromptGraphResult = {
  finalPrompt: string;
  includedNodeIds: string[];
  includedVariantIds: string[];
  warnings: PromptGraphWarning[];
};

const byCanvasPosition = (a: PromptGraphNode, b: PromptGraphNode) => a.position.x - b.position.x || a.position.y - b.position.y || a.id.localeCompare(b.id);
const cleanPart = (value: string) => value.trim().replace(/\n{3,}/g, '\n\n');

function getNodeMap(graph: PromptGraph) {
  return new Map(graph.nodes.map((node) => [node.id, node]));
}

function topologicalOrder(graph: PromptGraph, nodeIds: Set<string>): string[] {
  const nodeMap = getNodeMap(graph);
  const indegree = new Map<string, number>();
  const outgoing = new Map<string, string[]>();
  nodeIds.forEach((id) => {
    indegree.set(id, 0);
    outgoing.set(id, []);
  });

  graph.edges.forEach((edge) => {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) return;
    outgoing.get(edge.source)?.push(edge.target);
    indegree.set(edge.target, (indegree.get(edge.target) ?? 0) + 1);
  });

  const queue = [...nodeIds]
    .filter((id) => (indegree.get(id) ?? 0) === 0)
    .sort((a, b) => byCanvasPosition(nodeMap.get(a)!, nodeMap.get(b)!));
  const ordered: string[] = [];

  while (queue.length > 0) {
    const id = queue.shift()!;
    ordered.push(id);
    const targets = outgoing.get(id) ?? [];
    targets.forEach((targetId) => {
      indegree.set(targetId, (indegree.get(targetId) ?? 0) - 1);
      if ((indegree.get(targetId) ?? 0) === 0) {
        queue.push(targetId);
        queue.sort((a, b) => byCanvasPosition(nodeMap.get(a)!, nodeMap.get(b)!));
      }
    });
  }

  if (ordered.length !== nodeIds.size) {
    return graph.nodes.filter((node) => nodeIds.has(node.id)).sort(byCanvasPosition).map((node) => node.id);
  }
  return ordered;
}

export function getConnectedPromptPath(graph: PromptGraph): PromptGraphNode[] {
  const nodeMap = getNodeMap(graph);
  const outputNodes = graph.nodes.filter((node) => node.type === 'output');
  const connectedIds = new Set<string>();

  if (outputNodes.length > 0) {
    const reverse = new Map<string, string[]>();
    graph.edges.forEach((edge) => {
      if (!nodeMap.has(edge.source) || !nodeMap.has(edge.target)) return;
      reverse.set(edge.target, [...(reverse.get(edge.target) ?? []), edge.source]);
    });
    const stack = outputNodes.map((node) => node.id);
    while (stack.length > 0) {
      const id = stack.pop()!;
      if (connectedIds.has(id)) continue;
      connectedIds.add(id);
      stack.push(...(reverse.get(id) ?? []));
    }
  } else {
    graph.edges.forEach((edge) => {
      if (nodeMap.has(edge.source) && nodeMap.has(edge.target)) {
        connectedIds.add(edge.source);
        connectedIds.add(edge.target);
      }
    });
  }

  return topologicalOrder(graph, connectedIds).map((id) => nodeMap.get(id)!).filter(Boolean);
}

export function detectCycles(graph: PromptGraph): string[][] {
  const nodeIds = new Set(graph.nodes.map((node) => node.id));
  const outgoing = new Map<string, string[]>();
  nodeIds.forEach((id) => outgoing.set(id, []));
  graph.edges.forEach((edge) => {
    if (nodeIds.has(edge.source) && nodeIds.has(edge.target)) outgoing.get(edge.source)?.push(edge.target);
  });

  const visiting = new Set<string>();
  const visited = new Set<string>();
  const stack: string[] = [];
  const cycles: string[][] = [];

  const visit = (id: string) => {
    if (visiting.has(id)) {
      cycles.push(stack.slice(stack.indexOf(id)).concat(id));
      return;
    }
    if (visited.has(id)) return;
    visiting.add(id);
    stack.push(id);
    (outgoing.get(id) ?? []).forEach(visit);
    stack.pop();
    visiting.delete(id);
    visited.add(id);
  };

  graph.nodes.forEach((node) => visit(node.id));
  return cycles;
}

function selectedContentForNode(node: PromptGraphNode) {
  if (node.data.selectionMode === 'manual') {
    const manualText = cleanPart(node.data.manualText ?? '');
    return { parts: manualText ? [manualText] : [], variantIds: [] };
  }
  const selected = node.data.variants
    .filter((variant) => variant.isSelected)
    .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
  const variants = node.data.selectionMode === 'single' ? selected.slice(0, 1) : selected;
  return {
    parts: variants.map((variant) => cleanPart(variant.content)).filter(Boolean),
    variantIds: variants.map((variant) => variant.id)
  };
}

export function validateGraph(graph: PromptGraph): PromptGraphWarning[] {
  const warnings: PromptGraphWarning[] = [];
  const path = getConnectedPromptPath(graph);
  if (!graph.nodes.some((node) => node.type === 'output')) warnings.push({ code: 'no_output_node', message: 'No output node exists. Using connected nodes in canvas order.' });
  graph.nodes.forEach((node) => {
    const hasSelection = selectedContentForNode(node).parts.length > 0;
    if (node.data.isRequired && node.data.isEnabled && !hasSelection) warnings.push({ code: 'required_missing_variant', nodeId: node.id, message: `${node.data.name} is required but has no selected prompt content.` });
  });
  if (!path.some((node) => node.data.isEnabled && selectedContentForNode(node).parts.length > 0)) warnings.push({ code: 'no_connected_enabled_nodes', message: 'Graph has no connected enabled nodes with prompt content.' });
  if (detectCycles(graph).length > 0) warnings.push({ code: 'cycle_detected', message: 'Graph contains a cycle. Prompt order falls back to canvas position.' });
  return warnings;
}

export function generateFinalPrompt(graph: PromptGraph): PromptGraphResult {
  const includedNodeIds: string[] = [];
  const includedVariantIds: string[] = [];
  const parts: string[] = [];

  getConnectedPromptPath(graph).forEach((node) => {
    if (!node.data.isEnabled) return;
    const selected = selectedContentForNode(node);
    if (selected.parts.length === 0) return;
    includedNodeIds.push(node.id);
    includedVariantIds.push(...selected.variantIds);
    parts.push(...selected.parts);
  });

  return {
    finalPrompt: parts.join('\n\n'),
    includedNodeIds,
    includedVariantIds,
    warnings: validateGraph(graph)
  };
}
