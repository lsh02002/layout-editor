import { useCallback, useEffect, useState, type ChangeEvent } from "react";

import type { LayoutComponent } from "../../../types/types";

import { isObject, validateComponent } from "../utils/componentValidation";

import { downloadProjectFile } from "../utils/projectUtils";

type Options = {
  components: LayoutComponent[];
  projectCustomCss: string;
  setProjectCustomCss: (value: string) => void;
  resetHistory: (components: LayoutComponent[]) => void;
  setSelectedComponentId: (id: string | null) => void;
  setAutoSaveBaseline: (value: string) => void;
};

type ProjectValidation =
  | {
      valid: true;
      components: LayoutComponent[];
      projectCustomCss: string;
    }
  | {
      valid: false;
      error: string;
    };

const validateProjectFile = (value: unknown): ProjectValidation => {
  if (!isObject(value)) {
    return {
      valid: false,
      error: "프로젝트 파일 형식이 올바르지 않습니다.",
    };
  }

  if (value.version !== undefined && value.version !== 1) {
    return {
      valid: false,
      error: `지원하지 않는 프로젝트 버전입니다. (${String(value.version)})`,
    };
  }

  if (
    value.projectCustomCss !== undefined &&
    typeof value.projectCustomCss !== "string"
  ) {
    return {
      valid: false,
      error: "projectCustomCss가 올바르지 않습니다.",
    };
  }

  if (!Array.isArray(value.components)) {
    return {
      valid: false,
      error: "components가 존재하지 않거나 배열이 아닙니다.",
    };
  }

  const ids = new Set<string>();

  const checkIds = (items: unknown[], path = "components"): string | null => {
    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];

      if (!isObject(item)) {
        continue;
      }

      if (typeof item.id === "string") {
        if (ids.has(item.id)) {
          return `${path}[${index}]: 중복된 component id입니다. (${item.id})`;
        }

        ids.add(item.id);
      }

      if (item.type === "container" && Array.isArray(item.children)) {
        const error = checkIds(item.children, `${path}[${index}].children`);

        if (error) {
          return error;
        }
      }
    }

    return null;
  };

  for (let index = 0; index < value.components.length; index += 1) {
    const error = validateComponent(
      value.components[index],
      `components[${index}]`,
    );

    if (error) {
      return {
        valid: false,
        error,
      };
    }
  }

  const duplicateError = checkIds(value.components);

  if (duplicateError) {
    return {
      valid: false,
      error: duplicateError,
    };
  }

  return {
    valid: true,
    components: value.components as LayoutComponent[],
    projectCustomCss:
      typeof value.projectCustomCss === "string" ? value.projectCustomCss : "",
  };
};

export const useProjectFiles = ({
  components,
  projectCustomCss,
  setProjectCustomCss,
  resetHistory,
  setSelectedComponentId,
  setAutoSaveBaseline,
}: Options) => {
  const [lastSavedSnapshot, setLastSavedSnapshot] = useState(() =>
    JSON.stringify({
      components,
      projectCustomCss,
    }),
  );

  const currentSnapshot = JSON.stringify({
    components,
    projectCustomCss,
  });

  const hasUnsavedChanges = currentSnapshot !== lastSavedSnapshot;

  const saveProjectFile = useCallback(async () => {
    await downloadProjectFile(
      components,
      projectCustomCss,
      setAutoSaveBaseline,
    );

    setLastSavedSnapshot(
      JSON.stringify({
        components,
        projectCustomCss,
      }),
    );
  }, [components, projectCustomCss, setAutoSaveBaseline]);

  const loadProjectFile = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];

      if (!file) {
        return;
      }

      if (!file.name.toLowerCase().endsWith(".json")) {
        alert("JSON 프로젝트 파일만 불러올 수 있습니다.");
        event.target.value = "";
        return;
      }

      const MAX_FILE_SIZE = 50 * 1024 * 1024;

      if (file.size > MAX_FILE_SIZE) {
        alert("프로젝트 파일이 너무 큽니다.");
        event.target.value = "";
        return;
      }

      const reader = new FileReader();

      reader.onload = () => {
        try {
          const text = String(reader.result ?? "");

          if (!text.trim()) {
            throw new Error("파일 내용이 비어 있습니다.");
          }

          let parsed: unknown;

          try {
            parsed = JSON.parse(text);
          } catch {
            throw new Error("JSON 형식이 깨져 있습니다.");
          }

          const validation = validateProjectFile(parsed);

          if (!validation.valid) {
            throw new Error(validation.error);
          }

          resetHistory(validation.components);

          setProjectCustomCss(validation.projectCustomCss);

          setLastSavedSnapshot(
            JSON.stringify({
              components: validation.components,
              projectCustomCss: validation.projectCustomCss,
            }),
          );

          setSelectedComponentId(null);
        } catch (error) {
          console.error("프로젝트 불러오기 실패:", error);

          const message =
            error instanceof Error ? error.message : "알 수 없는 오류입니다.";

          alert(`프로젝트 파일을 불러올 수 없습니다.\n\n${message}`);
        } finally {
          event.target.value = "";
        }
      };

      reader.onerror = () => {
        alert("파일을 읽는 중 오류가 발생했습니다.");
        event.target.value = "";
      };

      reader.readAsText(file);
    },
    [resetHistory, setProjectCustomCss, setSelectedComponentId],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const ctrlOrMeta = event.ctrlKey || event.metaKey;

      if (!ctrlOrMeta || event.key.toLowerCase() !== "s") {
        return;
      }

      event.preventDefault();

      if (event.repeat) {
        return;
      }

      void saveProjectFile();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [saveProjectFile]);

  return {
    hasUnsavedChanges,
    saveProjectFile,
    loadProjectFile,
  };
};
