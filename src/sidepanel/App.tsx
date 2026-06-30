import { useEffect, useState } from 'react';
import { EXTENSION_NAME } from '../shared/constants';
import { getAppState } from '../shared/storage';
import type { AppState } from '../shared/types';

export default function App() {
  const [state, setState] = useState<AppState | null>(null);

  useEffect(() => {
    getAppState().then(setState).catch(() => setState({ templates: [], artifacts: [] }));
  }, []);

  return (
    <main className="app-shell">
      <header className="hero">
        <p className="eyebrow">Chrome Side Panel MVP</p>
        <h1>{EXTENSION_NAME}</h1>
        <p>
          Build reusable prompt workflows, prepare final prompts, track generated outputs, and review
          artifacts from one browser-native workspace.
        </p>
      </header>

      <section className="status-grid" aria-label="Workflow status">
        <article>
          <span className="metric">{state?.templates.length ?? '—'}</span>
          <strong>Prompt templates</strong>
          <p>Node canvas is intentionally deferred for a later milestone.</p>
        </article>
        <article>
          <span className="metric">{state?.artifacts.length ?? '—'}</span>
          <strong>Artifacts</strong>
          <p>Output approval tracking is scaffolded, not automated yet.</p>
        </article>
      </section>

      <section className="panel-card">
        <h2>MVP foundation</h2>
        <ul>
          <li>Manifest V3 extension shell</li>
          <li>Side Panel React application</li>
          <li>Popup entry point for status and quick access</li>
          <li>Background service worker, content script, storage, and messaging helpers</li>
        </ul>
      </section>
    </main>
  );
}
