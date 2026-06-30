import type { ExtensionMessage } from './types';

export function sendMessage<TResponse = unknown>(message: ExtensionMessage): Promise<TResponse> {
  return chrome.runtime.sendMessage(message) as Promise<TResponse>;
}

export function addMessageListener(
  handler: (
    message: ExtensionMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: unknown) => void
  ) => void | boolean | Promise<unknown>
): void {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const result = handler(message as ExtensionMessage, sender, sendResponse);

    if (result instanceof Promise) {
      result.then(sendResponse).catch((error: unknown) => {
        sendResponse({ ok: false, error: String(error) });
      });
      return true;
    }

    return result;
  });
}
