import { addMessageListener, sendMessage } from '../shared/messaging';
import type { PastePromptResponse } from '../shared/types';

function isEditable(element: Element | null): element is HTMLElement {
  if (!(element instanceof HTMLElement)) return false;
  if (element.isContentEditable) return true;
  return element instanceof HTMLTextAreaElement || element instanceof HTMLInputElement;
}

function pasteIntoEditable(prompt: string): PastePromptResponse {
  const target = document.activeElement;
  if (!isEditable(target)) {
    return { ok: false, error: 'No active editable input was found.' };
  }

  target.focus();

  if (target instanceof HTMLTextAreaElement || target instanceof HTMLInputElement) {
    const start = target.selectionStart ?? target.value.length;
    const end = target.selectionEnd ?? target.value.length;
    target.setRangeText(prompt, start, end, 'end');
    target.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: prompt }));
    target.dispatchEvent(new Event('change', { bubbles: true }));
    return { ok: true };
  }

  const inserted = document.execCommand('insertText', false, prompt);
  if (!inserted) return { ok: false, error: 'Browser refused to insert text into the active editable field.' };
  target.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: prompt }));
  return { ok: true };
}

addMessageListener(async (message) => {
  if (message.type !== 'PASTE_PROMPT') return { ok: true };
  return pasteIntoEditable(message.prompt);
});

sendMessage({ type: 'CONTENT_SCRIPT_READY', url: window.location.href }).catch((error: unknown) => {
  console.debug('AI Visual Workflow content script registration failed', error);
});
