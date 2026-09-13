const stateStore = new Map<string, unknown>();

const listeners = new Set<() => void>();

let version = 0;

const notify = () => {
  version++;

  listeners.forEach((listener) => {
    listener();
  });
};

export const builderState = {
  get<T = unknown>(key: string, fallback?: T): T {
    if (!stateStore.has(key)) {
      return fallback as T;
    }

    return stateStore.get(key) as T;
  },

  set<T>(key: string, value: T): T {
    stateStore.set(key, value);
    notify();

    return value;
  },

  has(key: string) {
    return stateStore.has(key);
  },

  add(key: string, amount = 1) {
    const current = Number(stateStore.get(key) ?? 0);
    const next = (Number.isFinite(current) ? current : 0) + amount;

    stateStore.set(key, next);
    notify();

    return next;
  },

  toggle(key: string) {
    const next = !stateStore.get(key);

    stateStore.set(key, next);
    notify();

    return next;
  },

  remove(key: string) {
    const result = stateStore.delete(key);

    notify();

    return result;
  },

  reset() {
    stateStore.clear();

    notify();
  },

  all() {
    return Object.fromEntries(stateStore.entries());
  },

  getVersion() {
    return version;
  },

  subscribe(listener: () => void) {
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  },
};

export const resetBuilderState = () => {
  stateStore.clear();
  notify();
};
