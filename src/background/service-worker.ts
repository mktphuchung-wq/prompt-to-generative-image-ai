import { addMessageListener } from '../shared/messaging';
import { getSupportedTool } from '../shared/toolConfig';
import type { PastePromptResponse, SendPromptToToolResponse, SupportedToolId } from '../shared/types';

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((error: unknown) => {
    console.warn('Unable to set side panel behavior', error);
  });
});

chrome.action.onClicked.addListener(async (tab) => {
  if (tab.windowId) {
    await chrome.sidePanel.open({ windowId: tab.windowId });
  }
});

function urlMatchesTool(url: string | undefined, toolId: SupportedToolId): boolean {
  if (!url) return false;
  const tool = getSupportedTool(toolId);
  return tool.baseUrls.some((baseUrl) => url.startsWith(baseUrl));
}

export async function findToolTab(toolId: SupportedToolId): Promise<chrome.tabs.Tab | undefined> {
  const tool = getSupportedTool(toolId);
  const tabs = await chrome.tabs.query({});
  return tabs.find((tab) => tool.baseUrls.some((baseUrl) => tab.url?.startsWith(baseUrl)));
}

export async function openToolTab(toolId: SupportedToolId): Promise<chrome.tabs.Tab> {
  const tool = getSupportedTool(toolId);
  return chrome.tabs.create({ url: tool.defaultUrl, active: true });
}

export async function activateToolTab(tabId: number): Promise<chrome.tabs.Tab> {
  return chrome.tabs.update(tabId, { active: true });
}

export async function openOrActivateTool(toolId: SupportedToolId): Promise<chrome.tabs.Tab> {
  const existingTab = await findToolTab(toolId);
  if (existingTab?.id) {
    return activateToolTab(existingTab.id);
  }
  return openToolTab(toolId);
}

export async function copyPromptToClipboard(_prompt: string): Promise<void> {
  // The side panel copies with navigator.clipboard before asking the service worker
  // to open/activate the tool tab. Service workers do not have reliable clipboard
  // access across Chrome versions, so this function documents the controller step.
  return Promise.resolve();
}

export async function sendPromptToTool(toolId: SupportedToolId, prompt: string): Promise<SendPromptToToolResponse> {
  await copyPromptToClipboard(prompt);
  const tab = await openOrActivateTool(toolId);
  if (!tab.id) return { ok: false, pasted: false, error: 'Tool tab was opened but no tab id was returned.' };

  if (!urlMatchesTool(tab.url, toolId) && tab.pendingUrl === undefined) {
    return { ok: true, tabId: tab.id, pasted: false, error: 'Tool tab is still loading. Prompt copied. Paste manually if auto-paste did not work.' };
  }

  try {
    const response = await chrome.tabs.sendMessage<PastePromptResponse>(tab.id, { type: 'PASTE_PROMPT', prompt });
    return { ok: true, tabId: tab.id, pasted: Boolean(response?.ok), error: response?.error };
  } catch (error) {
    return { ok: true, tabId: tab.id, pasted: false, error: error instanceof Error ? error.message : String(error) };
  }
}

addMessageListener(async (message, sender) => {
  if (message.type === 'OPEN_SIDE_PANEL') {
    const windowId = sender.tab?.windowId ?? (await chrome.windows.getCurrent()).id;

    if (!windowId) {
      return { ok: false, error: 'No active Chrome window was found.' };
    }

    await chrome.sidePanel.open({ windowId });
    return { ok: true };
  }

  if (message.type === 'FIND_TOOL_TAB') {
    return findToolTab(message.toolId);
  }

  if (message.type === 'OPEN_TOOL_TAB') {
    return openToolTab(message.toolId);
  }

  if (message.type === 'ACTIVATE_TOOL_TAB') {
    return activateToolTab(message.tabId);
  }

  if (message.type === 'OPEN_OR_ACTIVATE_TOOL') {
    return openOrActivateTool(message.toolId);
  }

  if (message.type === 'SEND_PROMPT_TO_TOOL') {
    return sendPromptToTool(message.toolId, message.prompt);
  }

  return { ok: true };
});
