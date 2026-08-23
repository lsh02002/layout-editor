import { useEffect, useState } from "react";

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
};

export const useAutoSave = ({
  components,
  projectCustomCss,
  delay = 3000,
}: Options) => {
  const [lastAutoSavedAt, setLastAutoSavedAt] = useState<string | null>(null);

  const [restoreData, setRestoreData] = useState<AutoSaveData | null>(() =>
    readAutoSaveData(),
  );

  const [autoSaveBaseline, setAutoSaveBaseline] = useState(() =>
    getAutoSaveSnapshot(components, projectCustomCss),
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

        setAutoSaveBaseline(currentSnapshot);

        setLastAutoSavedAt(data.savedAt);
      } catch (error) {
        console.error("자동 저장 실패:", error);
      }
    }, delay);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [components, projectCustomCss, autoSaveBaseline, delay]);

  const discardAutoSave = () => {
    localStorage.removeItem(AUTOSAVE_KEY);

    setRestoreData(null);
  };

  const consumeRestoreData = (data: AutoSaveData) => {
    localStorage.removeItem(AUTOSAVE_KEY);

    setAutoSaveBaseline(
      getAutoSaveSnapshot(data.components, data.projectCustomCss ?? ""),
    );

    setRestoreData(null);
  };

  return {
    lastAutoSavedAt,
    restoreData,
    showRestoreModal,
    autoSaveBaseline,
    setAutoSaveBaseline,
    discardAutoSave,
    consumeRestoreData,
  };
};
