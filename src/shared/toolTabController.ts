import { sendMessage } from './messaging';
import type { SendPromptToToolResponse, SupportedToolId } from './types';

export async function findToolTab(toolId: SupportedToolId): Promise<chrome.tabs.Tab | undefined> {
  return sendMessage<chrome.tabs.Tab | undefined>({ type: 'FIND_TOOL_TAB', toolId });
}

export async function openToolTab(toolId: SupportedToolId): Promise<chrome.tabs.Tab> {
  return sendMessage<chrome.tabs.Tab>({ type: 'OPEN_TOOL_TAB', toolId });
}

export async function activateToolTab(tabId: number): Promise<chrome.tabs.Tab> {
  return sendMessage<chrome.tabs.Tab>({ type: 'ACTIVATE_TOOL_TAB', tabId });
}

export async function openOrActivateTool(toolId: SupportedToolId): Promise<chrome.tabs.Tab> {
  return sendMessage<chrome.tabs.Tab>({ type: 'OPEN_OR_ACTIVATE_TOOL', toolId });
}

export async function copyPromptToClipboard(prompt: string): Promise<void> {
  await navigator.clipboard.writeText(prompt);
}

export async function sendPromptToTool(toolId: SupportedToolId, prompt: string): Promise<SendPromptToToolResponse> {
  await copyPromptToClipboard(prompt);
  return sendMessage<SendPromptToToolResponse>({ type: 'SEND_PROMPT_TO_TOOL', toolId, prompt });
}
