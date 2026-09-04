import { useCallback, useEffect, useState } from "react";

import type {
  ComponentsUpdater,
  HistoryState,
  LayoutComponent,
} from "../../../types/types";
import { findComponentRecursive } from "../utils/componentTree";

type HistoryUpdater = (prev: LayoutComponent[]) => LayoutComponent[];

type Options = {
  selectedComponentIds: string[];
  setSelectedComponentIds: React.Dispatch<React.SetStateAction<string[]>>;
  initialComponents: LayoutComponent[];
};

export const useComponentHistory = ({
  initialComponents,
  selectedComponentIds,
  setSelectedComponentIds,
}: Options) => {
  const [history, setHistory] = useState<HistoryState>(() => ({
    past: [],
    present: initialComponents,
    future: [],
  }));

  const syncSelection = useCallback(
    (nextComponents: LayoutComponent[]) => {
      if (selectedComponentIds.length === 0) {
        return;
      }

      const nextSelectedIds = selectedComponentIds.filter((id) =>
        Boolean(findComponentRecursive(nextComponents, id)),
      );

      if (nextSelectedIds.length === selectedComponentIds.length) {
        return;
      }

      setSelectedComponentIds(nextSelectedIds);
    },
    [selectedComponentIds, setSelectedComponentIds],
  );

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
    if (history.past.length === 0) {
      return;
    }

    const previous = history.past[history.past.length - 1];

    syncSelection(previous);

    setHistory({
      past: history.past.slice(0, -1),
      present: previous,
      future: [history.present, ...history.future],
    });
  }, [history, syncSelection]);

  const redo = useCallback(() => {
    if (history.future.length === 0) {
      return;
    }

    const next = history.future[0];

    syncSelection(next);

    setHistory({
      past: [...history.past, history.present],
      present: next,
      future: history.future.slice(1),
    });
  }, [history, syncSelection]);

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
