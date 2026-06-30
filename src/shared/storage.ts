import { STORAGE_KEYS } from './constants';
import type { AppState } from './types';

export const DEFAULT_APP_STATE: AppState = {
  templates: [],
  artifacts: []
};

export async function getAppState(): Promise<AppState> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.appState);
  return (result[STORAGE_KEYS.appState] as AppState | undefined) ?? DEFAULT_APP_STATE;
}

export async function setAppState(state: AppState): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.appState]: state });
}

export async function resetAppState(): Promise<void> {
  await setAppState(DEFAULT_APP_STATE);
}
