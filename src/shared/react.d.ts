declare module 'react' {
  export type ChangeEvent<T = Element> = { target: T };
  export type MouseEvent<T = Element> = {
    clientX: number;
    clientY: number;
    currentTarget: T;
    preventDefault(): void;
    stopPropagation(): void;
  };
  export function useEffect(effect: () => void | (() => void), deps?: unknown[]): void;
  export function useMemo<T>(factory: () => T, deps?: unknown[]): T;
  export function useState<T>(initialState: T | (() => T)): [T, (value: T | ((previous: T) => T)) => void];
  export const StrictMode: (props: { children?: unknown }) => unknown;
}

declare module 'react-dom/client' {
  export function createRoot(container: HTMLElement): { render(children: unknown): void };
}

declare namespace JSX {
  interface IntrinsicElements {
    [elementName: string]: unknown;
  }
}

declare module 'react/jsx-runtime' {
  export const jsx: unknown;
  export const jsxs: unknown;
  export const Fragment: unknown;
}
