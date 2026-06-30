declare const chrome: {
  storage?: {
    local?: {
      get: (key: string) => Promise<Record<string, unknown>>;
      set: (values: Record<string, unknown>) => Promise<void>;
    };
  };
};
