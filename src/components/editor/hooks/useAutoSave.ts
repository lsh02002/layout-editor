import { useCallback, useEffect, useState } from "react";

import {
  AUTOSAVE_KEY,
  type AutoSaveData,
  type LayoutComponent,
} from "../../../types/types";

import { getAutoSaveSnapshot, readAutoSaveData } from "../utils/projectUtils";

type Options = {
  components: LayoutComponent[];
  projectCustomCss: string;
  delay?: number;
  resetHistory: (components: LayoutComponent[]) => void;
  setProjectCustomCss: (css: string) => void;
  setSelectedComponentId: (id: string | null) => void;
};

export const useAutoSave = ({
  components,
  projectCustomCss,
  delay = 3000,
  resetHistory,
  setProjectCustomCss,
  setSelectedComponentId,
}: Options) => {
  const [lastAutoSavedAt, setLastAutoSavedAt] = useState<string | null>(null);

  const [restoreData, setRestoreData] = useState<AutoSaveData | null>(() =>
    readAutoSaveData(),
  );

  const [autoSaveBaseline, setAutoSaveBaselineState] = useState(() =>
    getAutoSaveSnapshot(components, projectCustomCss),
  );

  const [hasUnsavedAutoSave, setHasUnsavedAutoSave] = useState(
    () => restoreData !== null,
  );

  const showRestoreModal = restoreData !== null;

  useEffect(() => {
    const currentSnapshot = getAutoSaveSnapshot(components, projectCustomCss);

    if (currentSnapshot === autoSaveBaseline) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      try {
        const data: AutoSaveData = {
          version: 1,
          savedAt: new Date().toISOString(),
          components,
          projectCustomCss,
        };

        localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(data));

        setAutoSaveBaselineState(currentSnapshot);
        setLastAutoSavedAt(data.savedAt);
        setHasUnsavedAutoSave(true);
      } catch (error) {
        console.error("자동 저장 실패:", error);
      }
    }, delay);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [components, projectCustomCss, autoSaveBaseline, delay]);

  useEffect(() => {
    if (!hasUnsavedAutoSave) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedAutoSave]);

  const setAutoSaveBaseline = useCallback((snapshot: string) => {
    setAutoSaveBaselineState(snapshot);
    setHasUnsavedAutoSave(false);
  }, []);

  const discardAutoSave = useCallback(() => {
    localStorage.removeItem(AUTOSAVE_KEY);

    setRestoreData(null);
    setHasUnsavedAutoSave(false);
  }, []);

  const consumeRestoreData = useCallback((data: AutoSaveData) => {
    localStorage.removeItem(AUTOSAVE_KEY);

    setAutoSaveBaselineState(
      getAutoSaveSnapshot(data.components, data.projectCustomCss ?? ""),
    );

    setRestoreData(null);
    setHasUnsavedAutoSave(false);
  }, []);

  const restoreAutoSave = useCallback(() => {
    if (!restoreData) {
      return;
    }

    const restoredCss = restoreData.projectCustomCss ?? "";

    resetHistory(restoreData.components);

    setProjectCustomCss(restoredCss);

    setSelectedComponentId(null);

    consumeRestoreData({
      ...restoreData,
      projectCustomCss: restoredCss,
    });
  }, [
    restoreData,
    resetHistory,
    setProjectCustomCss,
    setSelectedComponentId,
    consumeRestoreData,
  ]);

  return {
    lastAutoSavedAt,
    restoreData,
    showRestoreModal,
    autoSaveBaseline,
    hasUnsavedAutoSave,
    setAutoSaveBaseline,
    discardAutoSave,
    consumeRestoreData,
    restoreAutoSave,
  };
};
