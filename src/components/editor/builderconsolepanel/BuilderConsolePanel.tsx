import { useEffect, useRef, useState } from "react";
import {
  builderConsole,
  connectBuilderConsole,
  type BuilderConsoleMessage,
} from "../utils/builderConsole";

export default function BuilderConsolePanel() {
  const [messages, setMessages] = useState<BuilderConsoleMessage[]>([]);
  const [open, setOpen] = useState(true);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    connectBuilderConsole();
    return builderConsole.subscribe(setMessages);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const element = bodyRef.current;

    if (!element) {
      return;
    }

    element.scrollTop = element.scrollHeight;
  }, [messages, open]);

  const errorCount = messages.filter(
    (message) => message.type === "error",
  ).length;

  const warnCount = messages.filter(
    (message) => message.type === "warn",
  ).length;

  return (
    <div
      style={{
        width: "100%",
        height: open ? "150px" : "70px",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        background: "white",
        color: "black",
        border: "4px solid gray",
        fontFamily: "Consolas, Monaco, monospace",
        fontSize: "18px",
        padding: "4px",
      }}
    >
      <div
        style={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "12px 12px",
          borderBottom: open ? "1px solid gray" : undefined,
        }}
      >
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary text-dark"
          onClick={() => setOpen((current) => !current)}
        >
          JsAction Console
        </button>

        {errorCount > 0 && (
          <span
            style={{
              color: "black",
            }}
          >
            {errorCount} errors
          </span>
        )}

        {warnCount > 0 && (
          <span
            style={{
              color: "black",
            }}
          >
            {warnCount} warnings
          </span>
        )}

        <div
          style={{
            flex: 1,
          }}
        />

        <button
          type="button"
          className="btn btn-sm btn-outline-secondary text-dark"
          onClick={() => builderConsole.clear()}
        >
          Clear
        </button>
      </div>

      {open && (
        <div
          ref={bodyRef}
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
          }}
        >
          {messages.length === 0 && (
            <div
              style={{
                padding: "12px",
                color: "black",
              }}
            >
              No messages
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              style={{
                display: "flex",
                gap: "10px",
                padding: "6px 12px",
                borderBottom: "1px solid gray",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                color:
                  message.type === "error"
                    ? "red"
                    : message.type === "warn"
                      ? "orange"
                      : "black",
              }}
            >
              <span
                style={{
                  flexShrink: 0,
                  opacity: 0.6,
                }}
              >
                {new Date(message.createdAt).toLocaleTimeString()}
              </span>

              <span
                style={{
                  flex: 1,
                }}
              >
                {message.message}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
