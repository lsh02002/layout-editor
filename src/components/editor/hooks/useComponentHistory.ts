import { useCallback, useEffect, useState } from "react";

import type {
  ComponentsUpdater,
  HistoryState,
  LayoutComponent,
} from "../../../types/types";

type HistoryUpdater = (prev: LayoutComponent[]) => LayoutComponent[];

export const useComponentHistory = (initialComponents: LayoutComponent[]) => {
  const [history, setHistory] = useState<HistoryState>(() => ({
    past: [],
    present: initialComponents,
    future: [],
  }));

  const commitHistory = useCallback((updater: HistoryUpdater) => {
    setHistory((prev) => {
      const next = updater(prev.present);

      return {
        past: [...prev.past, prev.present],
        present: next,
        future: [],
      };
    });
  }, []);

  const setComponents = useCallback(
    (updater: ComponentsUpdater, recordHistory = true) => {
      setHistory((prev) => {
        const nextComponents =
          typeof updater === "function" ? updater(prev.present) : updater;

        if (!recordHistory) {
          return {
            ...prev,
            present: nextComponents,
          };
        }

        return {
          past: [...prev.past, prev.present],
          present: nextComponents,
          future: [],
        };
      });
    },
    [],
  );

  const resetHistory = useCallback((components: LayoutComponent[]) => {
    setHistory({
      past: [],
      present: components,
      future: [],
    });
  }, []);

  const undo = useCallback(() => {
    setHistory((prev) => {
      if (prev.past.length === 0) {
        return prev;
      }

      const previous = prev.past[prev.past.length - 1];

      return {
        past: prev.past.slice(0, -1),
        present: previous,
        future: [prev.present, ...prev.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory((prev) => {
      if (prev.future.length === 0) {
        return prev;
      }

      const next = prev.future[0];

      return {
        past: [...prev.past, prev.present],
        present: next,
        future: prev.future.slice(1),
      };
    });
  }, []);

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const ctrlOrMeta = event.ctrlKey || event.metaKey;

      if (!ctrlOrMeta) {
        return;
      }

      const key = event.key.toLowerCase();
      const target = event.target as HTMLElement | null;

      if (target) {
        const tag = target.tagName.toLowerCase();

        if (
          tag === "input" ||
          tag === "textarea" ||
          tag === "select" ||
          target.isContentEditable ||
          !!target.closest(".ql-editor")
        ) {
          return;
        }
      }

      if (key === "z" && !event.shiftKey && canUndo) {
        event.preventDefault();
        undo();
        return;
      }

      if ((key === "y" || (key === "z" && event.shiftKey)) && canRedo) {
        event.preventDefault();
        redo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [canUndo, canRedo, undo, redo]);

  return {
    history,
    components: history.present,
    commitHistory,
    setComponents,
    resetHistory,
    undo,
    redo,
    canUndo,
    canRedo,
  };
};
