import { sendMessage } from '../shared/messaging';

sendMessage({ type: 'CONTENT_SCRIPT_READY', url: window.location.href }).catch((error: unknown) => {
  console.debug('AI Visual Workflow content script registration failed', error);
});
