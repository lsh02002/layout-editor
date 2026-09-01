import { useCallback, useRef, type ChangeEvent } from "react";
import { open, save } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import type {
  LayoutComponent,
  TemplateFile,
  CommitHistory,
} from "../../../types/types";
import {
  cloneComponent,
  findComponentRecursive,
  insertComponentRecursive,
  normalizeOrder,
} from "../utils/componentTree";
import { isObject, validateComponent } from "../utils/componentValidation";
import { convertComponentsForSave } from "../utils/projectUtils";
import { isTauri } from "../utils/projectUtils";

type Options = {
  components: LayoutComponent[];
  selectedComponentIds: string[];
  commitHistory: CommitHistory;
  setSelectedComponentIds: React.Dispatch<React.SetStateAction<string[]>>;
};

type SaveFilePickerOptions = {
  suggestedName?: string;

  types?: Array<{
    description?: string;
    accept: Record<string, string[]>;
  }>;
};

type FileSystemWritableFileStream = {
  write(data: string | Blob | BufferSource): Promise<void>;

  close(): Promise<void>;
};

type FileSystemFileHandle = {
  createWritable(): Promise<FileSystemWritableFileStream>;
};

type WindowWithSaveFilePicker = Window & {
  showSaveFilePicker?: (
    options?: SaveFilePickerOptions,
  ) => Promise<FileSystemFileHandle>;
};

const MAX_TEMPLATE_FILE_SIZE = 50 * 1024 * 1024;

export const sanitizeFileName = (name: string) =>
  name
    .trim()
    .replace(/[\\/:*?"<>|]/g, "_")
    .replace(/\s+/g, "-") || "template";

const downloadTemplateFileWeb = async (
  data: TemplateFile,
  fileName: string,
): Promise<boolean> => {
  const json = JSON.stringify(data, null, 2);

  const safeFileName = `${fileName}.pbtpl`;

  try {
    const browserWindow = window as WindowWithSaveFilePicker;

    if (typeof browserWindow.showSaveFilePicker === "function") {
      const fileHandle = await browserWindow.showSaveFilePicker({
        suggestedName: safeFileName,

        types: [
          {
            description: "Page Builder Template",

            accept: {
              "application/json": [".pbtpl"],
            },
          },
        ],
      });

      const writable = await fileHandle.createWritable();

      await writable.write(json);
      await writable.close();

      return true;
    }

    const blob = new Blob([json], {
      type: "application/json;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);

    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = safeFileName;

    document.body.appendChild(anchor);

    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return false;
    }

    throw error;
  }
};

const downloadTemplateFileTauri = async (
  data: TemplateFile,
  fileName: string,
): Promise<boolean> => {
  const json = JSON.stringify(data, null, 2);

  const filePath = await save({
    title: "템플릿 저장",

    defaultPath: `${fileName}.pbtpl`,

    filters: [
      {
        name: "Page Builder Template",
        extensions: ["pbtpl"],
      },
    ],
  });

  if (!filePath) {
    return false;
  }

  await writeTextFile(filePath, json);

  return true;
};

const downloadTemplateFile = async (
  data: TemplateFile,
  fileName: string,
): Promise<boolean> => {
  if (isTauri()) {
    return downloadTemplateFileTauri(data, fileName);
  }

  return downloadTemplateFileWeb(data, fileName);
};

const validateTemplateFile = (
  value: unknown,
):
  | {
      valid: true;
      template: TemplateFile;
    }
  | {
      valid: false;
      error: string;
    } => {
  if (!isObject(value)) {
    return {
      valid: false,
      error: "템플릿 파일 형식이 올바르지 않습니다.",
    };
  }

  if (value.version !== 1) {
    return {
      valid: false,
      error: `지원하지 않는 템플릿 버전입니다. (${String(value.version)})`,
    };
  }

  if (value.templateType !== "project" && value.templateType !== "component") {
    return {
      valid: false,
      error: "templateType이 올바르지 않습니다.",
    };
  }

  if (typeof value.name !== "string" || !value.name.trim()) {
    return {
      valid: false,
      error: "템플릿 이름이 올바르지 않습니다.",
    };
  }

  if (value.templateType === "project") {
    if (!Array.isArray(value.components)) {
      return {
        valid: false,
        error: "components가 올바르지 않습니다.",
      };
    }

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
  }

  if (value.templateType === "component") {
    const error = validateComponent(value.component, "component");

    if (error) {
      return {
        valid: false,
        error,
      };
    }
  }

  return {
    valid: true,
    template: value as TemplateFile,
  };
};

export const useTemplates = ({
  components,
  selectedComponentIds,
  commitHistory,
  setSelectedComponentIds,
}: Options) => {
  const primarySelectedId = selectedComponentIds?.at(-1) ?? null;

  const isLoadingTemplateRef = useRef(false);

  const saveProjectAsTemplateFile = useCallback(
    async (templateName: string) => {
      const name = templateName.trim();

      if (!name) {
        alert("템플릿 이름을 입력해주세요.");

        return;
      }

      if (components.length === 0) {
        alert("저장할 컴포넌트가 없습니다.");

        return;
      }

      try {
        const savedComponents = await convertComponentsForSave(components);

        const template: TemplateFile = {
          version: 1,
          templateType: "project",
          name,
          createdAt: new Date().toISOString(),
          components: savedComponents,
        };

        const saved = await downloadTemplateFile(
          template,
          sanitizeFileName(name),
        );

        if (!saved) {
          return;
        }
      } catch (error) {
        console.error("프로젝트 템플릿 저장 실패:", error);

        alert("템플릿 저장 중 오류가 발생했습니다.");
      }
    },
    [components],
  );

  const saveSelectedComponentAsTemplateFile = useCallback(
    async (templateName: string) => {
      const name = templateName.trim();

      if (!name) {
        alert("템플릿 이름을 입력해주세요.");

        return;
      }

      if (!primarySelectedId) {
        alert("먼저 컴포넌트를 선택해주세요.");

        return;
      }

      const component = findComponentRecursive(components, primarySelectedId);

      if (!component) {
        alert("선택한 컴포넌트를 찾을 수 없습니다.");

        return;
      }

      try {
        const [savedComponent] = await convertComponentsForSave([component]);

        const template: TemplateFile = {
          version: 1,
          templateType: "component",
          name,
          createdAt: new Date().toISOString(),
          component: savedComponent,
        };

        const saved = await downloadTemplateFile(
          template,
          sanitizeFileName(name),
        );

        if (!saved) {
          return;
        }
      } catch (error) {
        console.error("컴포넌트 템플릿 저장 실패:", error);

        alert("템플릿 저장 중 오류가 발생했습니다.");
      }
    },
    [components, primarySelectedId],
  );

  const applyLoadedProjectTemplate = useCallback(
    (
      template: Extract<
        TemplateFile,
        {
          templateType: "project";
        }
      >,
    ) => {
      const replace = window.confirm(
        `"${template.name}" 템플릿을 불러왔습니다.\n\n` +
          `확인: 현재 프로젝트 교체\n` +
          `취소: 현재 프로젝트 뒤에 추가`,
      );

      const cloned = template.components.map(cloneComponent);

      if (replace) {
        commitHistory(() => normalizeOrder(cloned));

        setSelectedComponentIds([]);

        return;
      }

      commitHistory((prev) => normalizeOrder([...prev, ...cloned]));
    },
    [commitHistory, setSelectedComponentIds],
  );

  const applyLoadedComponentTemplate = useCallback(
    (
      template: Extract<
        TemplateFile,
        {
          templateType: "component";
        }
      >,
    ) => {
      const cloned = cloneComponent(template.component);

      if (!primarySelectedId) {
        commitHistory((prev) => normalizeOrder([...prev, cloned]));

        setSelectedComponentIds([cloned.id]);

        return;
      }

      const selected = findComponentRecursive(components, primarySelectedId);

      if (selected && selected.type === "container") {
        commitHistory((prev) =>
          insertComponentRecursive(
            prev,
            selected.id,
            selected.children.length,
            cloned,
          ),
        );

        setSelectedComponentIds([cloned.id]);

        return;
      }

      commitHistory((prev) => normalizeOrder([...prev, cloned]));

      setSelectedComponentIds([cloned.id]);
    },
    [commitHistory, components, primarySelectedId, setSelectedComponentIds],
  );

  const applyTemplateText = useCallback(
    (text: string) => {
      if (!text.trim()) {
        throw new Error("빈 템플릿 파일입니다.");
      }

      let parsed: unknown;

      try {
        parsed = JSON.parse(text);
      } catch {
        throw new Error("JSON 형식이 깨져 있습니다.");
      }

      const validation = validateTemplateFile(parsed);

      if (!validation.valid) {
        throw new Error(validation.error);
      }

      if (validation.template.templateType === "project") {
        applyLoadedProjectTemplate(validation.template);
      } else {
        applyLoadedComponentTemplate(validation.template);
      }
    },
    [applyLoadedComponentTemplate, applyLoadedProjectTemplate],
  );

  const loadTemplateFileWeb = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];

      if (!file) {
        return;
      }

      const lowerName = file.name.toLowerCase();

      if (!lowerName.endsWith(".pbtpl") && !lowerName.endsWith(".json")) {
        alert("템플릿 파일만 불러올 수 있습니다.");

        event.target.value = "";

        return;
      }

      if (file.size > MAX_TEMPLATE_FILE_SIZE) {
        alert("템플릿 파일이 너무 큽니다.");

        event.target.value = "";

        return;
      }

      const reader = new FileReader();

      reader.onload = () => {
        try {
          const text = String(reader.result ?? "");

          applyTemplateText(text);
        } catch (error) {
          console.error("템플릿 불러오기 실패:", error);

          const message =
            error instanceof Error ? error.message : "알 수 없는 오류입니다.";

          alert(`템플릿을 불러올 수 없습니다.\n\n${message}`);
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
    [applyTemplateText],
  );

  const loadTemplateFileTauri = useCallback(async () => {
    try {
      const filePath = await open({
        title: "템플릿 불러오기",

        multiple: false,
        directory: false,

        filters: [
          {
            name: "Page Builder Template",
            extensions: ["pbtpl", "json"],
          },
        ],
      });

      if (!filePath) {
        return;
      }

      const text = await readTextFile(filePath);

      if (text.length > MAX_TEMPLATE_FILE_SIZE) {
        alert("템플릿 파일이 너무 큽니다.");

        return;
      }

      applyTemplateText(text);
    } catch (error) {
      console.error("템플릿 불러오기 실패:", error);

      const message =
        error instanceof Error ? error.message : "알 수 없는 오류입니다.";

      alert(`템플릿을 불러올 수 없습니다.\n\n${message}`);
    }
  }, [applyTemplateText]);

  const openTemplateFile = useCallback(async () => {
    if (isLoadingTemplateRef.current) {
      return;
    }

    isLoadingTemplateRef.current = true;

    try {
      await loadTemplateFileTauri();
    } finally {
      isLoadingTemplateRef.current = false;
    }
  }, [loadTemplateFileTauri]);

  const loadTemplateFile = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      loadTemplateFileWeb(event);
    },
    [loadTemplateFileWeb],
  );

  const saveProjectTemplate = useCallback(() => {
    void saveProjectAsTemplateFile("새 프로젝트 템플릿");
  }, [saveProjectAsTemplateFile]);

  const saveSelectedTemplate = useCallback(() => {
    if (!primarySelectedId) {
      alert("먼저 컴포넌트를 선택해주세요.");
      return;
    }

    const component = findComponentRecursive(components, primarySelectedId);

    if (!component) {
      alert("선택한 컴포넌트를 찾을 수 없습니다.");
      return;
    }

    const templateName = component.name?.trim() || "새 컴포넌트 템플릿";

    void saveSelectedComponentAsTemplateFile(templateName);
  }, [components, primarySelectedId, saveSelectedComponentAsTemplateFile]);

  return {
    loadTemplateFile,
    openTemplateFile,
    saveProjectTemplate,
    saveSelectedTemplate,
  };
};
