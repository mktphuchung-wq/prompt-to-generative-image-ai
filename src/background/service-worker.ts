import { addMessageListener } from '../shared/messaging';

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

addMessageListener(async (message, sender) => {
  if (message.type !== 'OPEN_SIDE_PANEL') {
    return { ok: true };
  }

  const windowId = sender.tab?.windowId ?? (await chrome.windows.getCurrent()).id;

  if (!windowId) {
    return { ok: false, error: 'No active Chrome window was found.' };
  }

  await chrome.sidePanel.open({ windowId });
  return { ok: true };
});
