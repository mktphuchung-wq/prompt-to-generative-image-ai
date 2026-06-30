import type { SupportedTool, SupportedToolId } from './types';

export const GOOGLE_FLOW_DEFAULT_URL = 'https://labs.google/fx/tools/flow';

export const SUPPORTED_TOOLS: SupportedTool[] = [
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    baseUrls: ['https://chatgpt.com/'],
    defaultUrl: 'https://chatgpt.com/',
    isEnabled: true
  },
  {
    id: 'gemini',
    name: 'Gemini',
    baseUrls: ['https://gemini.google.com/'],
    defaultUrl: 'https://gemini.google.com/',
    isEnabled: true
  },
  {
    id: 'google_flow',
    name: 'Google Flow',
    baseUrls: ['https://labs.google/', 'https://flow.google/'],
    defaultUrl: GOOGLE_FLOW_DEFAULT_URL,
    isEnabled: true
  }
];

export function getSupportedTool(toolId: SupportedToolId): SupportedTool {
  const tool = SUPPORTED_TOOLS.find((item) => item.id === toolId);
  if (!tool) throw new Error(`Unsupported tool: ${toolId}`);
  return tool;
}

export function isSupportedToolId(value: string): value is SupportedToolId {
  return SUPPORTED_TOOLS.some((tool) => tool.id === value);
}
