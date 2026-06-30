function assertEqual(actual: unknown, expected: unknown) {
  if (actual !== expected) throw new Error(`Expected ${JSON.stringify(actual)} to equal ${JSON.stringify(expected)}`);
}

function assertDeepEqual(actual: unknown, expected: unknown) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`Expected ${JSON.stringify(actual)} to deep equal ${JSON.stringify(expected)}`);
}

function assertOk(value: unknown) {
  if (!value) throw new Error('Expected value to be truthy');
}

import { generateFinalPrompt, detectCycles } from './promptGraphEngine.js';
import type { PromptGraph, PromptGraphNode } from './types.js';

function node(id: string, x: number, content: string, options: Partial<PromptGraphNode['data']> = {}): PromptGraphNode {
  return {
    id,
    type: id === 'out' ? 'output' : 'text',
    position: { x, y: 0 },
    data: {
      name: id,
      nodeType: 'custom',
      isEnabled: true,
      selectionMode: 'single',
      variants: [{ id: `${id}-v`, label: id, content, isSelected: true, order: 1 }],
      ...options
    }
  };
}

function graph(nodes: PromptGraphNode[], edges: PromptGraph['edges']): PromptGraph {
  return { id: 'g', templateId: 't', nodes, edges };
}

const base = graph(
  [node('a', 0, 'A'), node('b', 100, 'B', { variants: [{ id: 'b2', label: 'B2', content: 'B2', isSelected: true, order: 2 }, { id: 'b1', label: 'B1', content: 'B1', isSelected: true, order: 1 }], selectionMode: 'multiple' }), node('out', 200, 'OUT'), node('x', 50, 'X')],
  [{ id: 'ab', source: 'a', target: 'b' }, { id: 'bo', source: 'b', target: 'out' }]
);
const result = generateFinalPrompt(base);
assertEqual(result.finalPrompt, 'A\n\nB1\n\nB2\n\nOUT');
assertDeepEqual(result.includedNodeIds, ['a', 'b', 'out']);
assertDeepEqual(result.includedVariantIds, ['a-v', 'b1', 'b2', 'out-v']);

const disabled = generateFinalPrompt(graph([node('a', 0, 'A', { isEnabled: false }), node('out', 100, 'OUT')], [{ id: 'ao', source: 'a', target: 'out' }]));
assertEqual(disabled.finalPrompt, 'OUT');
assertDeepEqual(disabled.includedNodeIds, ['out']);

const manual = generateFinalPrompt(graph([node('a', 0, 'A', { selectionMode: 'manual', manualText: 'Manual copy' }), node('out', 100, 'OUT')], [{ id: 'ao', source: 'a', target: 'out' }]));
assertEqual(manual.finalPrompt, 'Manual copy\n\nOUT');

const missingRequired = generateFinalPrompt(graph([node('a', 0, '', { isRequired: true, variants: [] }), node('out', 100, 'OUT')], [{ id: 'ao', source: 'a', target: 'out' }]));
assertOk(missingRequired.warnings.some((warning) => warning.code === 'required_missing_variant'));

const noOutput = generateFinalPrompt(graph([node('a', 0, 'A'), node('b', 100, 'B'), node('x', 50, 'X')], [{ id: 'ab', source: 'a', target: 'b' }]));
assertEqual(noOutput.finalPrompt, 'A\n\nB');
assertOk(noOutput.warnings.some((warning) => warning.code === 'no_output_node'));

assertEqual(detectCycles(graph([node('a', 0, 'A'), node('b', 100, 'B')], [{ id: 'ab', source: 'a', target: 'b' }, { id: 'ba', source: 'b', target: 'a' }])).length, 1);
console.log('promptGraphEngine tests passed');
