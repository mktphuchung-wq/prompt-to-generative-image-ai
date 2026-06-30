import { useState } from 'react';
import { EXTENSION_NAME } from '../shared/constants';
import { sendMessage } from '../shared/messaging';

type Status = 'Ready' | 'Opening side panel…' | 'Side panel opened' | 'Unable to open side panel';

export default function Popup() {
  const [status, setStatus] = useState<Status>('Ready');

  async function openSidePanel() {
    setStatus('Opening side panel…');
    try {
      await sendMessage({ type: 'OPEN_SIDE_PANEL' });
      setStatus('Side panel opened');
      window.close();
    } catch (error) {
      console.error(error);
      setStatus('Unable to open side panel');
    }
  }

  return (
    <main className="app-shell" style={{ width: 320, minHeight: 'auto' }}>
      <section className="panel-card">
        <p className="eyebrow">Extension status</p>
        <h1>{EXTENSION_NAME}</h1>
        <p>{status}</p>
        <button className="primary-button" type="button" onClick={openSidePanel}>
          Open Side Panel
        </button>
      </section>
    </main>
  );
}
