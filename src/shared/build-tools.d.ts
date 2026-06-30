declare const __dirname: string;

declare module 'node:path' {
  export function resolve(...paths: string[]): string;
}

declare module 'vite' {
  export function defineConfig(config: unknown): unknown;
}
