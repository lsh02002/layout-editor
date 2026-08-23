import { useCallback, useState } from "react";
import type {
  ComponentsUpdater,
  HistoryState,
  LayoutComponent,
} from "../types/types";

export function useHistoryState(initial: LayoutComponent[]) {
  const [history, setHistory] = useState<HistoryState>(() => ({
    past: [],
    present: initial,
    future: [],
  }));

  const commit = useCallback(
    (updater: (prev: LayoutComponent[]) => LayoutComponent[]) => {
      setHistory((prev) => ({
        past: [...prev.past, prev.present],
        present: updater(prev.present),
        future: [],
      }));
    },
    [],
  );

  const setComponents = useCallback(
    (updater: ComponentsUpdater, recordHistory = true) => {
      setHistory((prev) => {
        const present =
          typeof updater === "function" ? updater(prev.present) : updater;
        return recordHistory
          ? { past: [...prev.past, prev.present], present, future: [] }
          : { ...prev, present };
      });
    },
    [],
  );

  const undo = useCallback(() => {
    setHistory((prev) => {
      if (prev.past.length === 0) return prev;
      const present = prev.past[prev.past.length - 1];
      return {
        past: prev.past.slice(0, -1),
        present,
        future: [prev.present, ...prev.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory((prev) => {
      if (prev.future.length === 0) return prev;
      const [present, ...future] = prev.future;
      return { past: [...prev.past, prev.present], present, future };
    });
  }, []);

  return {
    history,
    setHistory,
    components: history.present,
    commit,
    setComponents,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
  };
}
