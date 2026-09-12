const stateStore = new Map<string, unknown>();

export const builderState = {
  get<T = unknown>(key: string, fallback?: T): T {
    if (!stateStore.has(key)) {
      return fallback as T;
    }

    return stateStore.get(key) as T;
  },

  set<T>(key: string, value: T): T {
    stateStore.set(key, value);

    return value;
  },

  has(key: string) {
    return stateStore.has(key);
  },

  add(key: string, amount = 1) {
    const current = Number(stateStore.get(key) ?? 0);

    const next = (Number.isFinite(current) ? current : 0) + amount;

    stateStore.set(key, next);

    return next;
  },

  toggle(key: string) {
    const next = !stateStore.get(key);

    stateStore.set(key, next);

    return next;
  },

  remove(key: string) {
    return stateStore.delete(key);
  },

  reset() {
    stateStore.clear();
  },

  all() {
    return Object.fromEntries(stateStore.entries());
  },
};

export const resetBuilderState = () => {
  stateStore.clear();
};
