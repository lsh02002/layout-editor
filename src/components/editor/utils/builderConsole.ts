export type BuilderConsoleType = "log" | "warn" | "error";

export type BuilderConsoleMessage = {
  id: string;
  type: BuilderConsoleType;
  message: string;
  createdAt: number;
};

type Listener = (messages: BuilderConsoleMessage[]) => void;

let messages: BuilderConsoleMessage[] = [];
const listeners = new Set<Listener>();

const emit = () => {
  listeners.forEach((listener) => listener(messages));
};

const add = (type: BuilderConsoleType, message: unknown) => {
  const value =
    message instanceof Error
      ? message.stack || message.message
      : typeof message === "string"
        ? message
        : JSON.stringify(message, null, 2);
  messages = [
    ...messages,
    {
      id: crypto.randomUUID(),
      type,
      message: value,
      createdAt: Date.now(),
    },
  ];

  emit();
};

export const builderConsole = {
  log(message: unknown) {
    add("log", message);
  },
  warn(message: unknown) {
    add("warn", message);
  },
  error(message: unknown) {
    add("error", message);
  },
  clear() {
    messages = [];
    emit();
  },
  getMessages() {
    return messages;
  },
  subscribe(listener: Listener) {
    listeners.add(listener);
    listener(messages);

    return () => {
      listeners.delete(listener);
    };
  },
};

let consoleConnected = false;

export const connectBuilderConsole = () => {
  if (consoleConnected) {
    return;
  }

  consoleConnected = true;

  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;

  console.log = (...values: unknown[]) => {
    originalLog(...values);

    builderConsole.log(
      values
        .map((value) =>
          value instanceof Error
            ? value.stack || value.message
            : typeof value === "string"
              ? value
              : JSON.stringify(value, null, 2),
        )
        .join(" "),
    );
  };

  console.warn = (...values: unknown[]) => {
    originalWarn(...values);

    builderConsole.warn(
      values
        .map((value) =>
          value instanceof Error
            ? value.stack || value.message
            : typeof value === "string"
              ? value
              : JSON.stringify(value, null, 2),
        )
        .join(" "),
    );
  };

  console.error = (...values: unknown[]) => {
    originalError(...values);

    builderConsole.error(
      values
        .map((value) =>
          value instanceof Error
            ? value.stack || value.message
            : typeof value === "string"
              ? value
              : JSON.stringify(value, null, 2),
        )
        .join(" "),
    );
  };

  window.addEventListener("error", (event) => {
    builderConsole.error(event.error ?? event.message);
  });

  window.addEventListener("unhandledrejection", (event) => {
    builderConsole.error(
      event.reason instanceof Error ? event.reason : String(event.reason),
    );
  });
};
