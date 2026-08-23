import { useCallback, useState, type ChangeEvent } from "react";

import type { LayoutComponent, TemplateFile } from "../../../types/types";

import {
  cloneComponent,
  findComponentRecursive,
  insertComponentRecursive,
  normalizeOrder,
} from "../utils/componentTree";

import { isObject, validateComponent } from "../utils/componentValidation";

import { convertComponentsForSave } from "../utils/projectUtils";

type CommitHistory = (
  updater: (prev: LayoutComponent[]) => LayoutComponent[],
) => void;

type Options = {
  components: LayoutComponent[];
  selectedComponentId: string | null;
  commitHistory: CommitHistory;
  setSelectedComponentId: (id: string | null) => void;
};

type TemplateSaveType = "project" | "component";

export const sanitizeFileName = (name: string) =>
  name
    .trim()
    .replace(/[\\/:*?"<>|]/g, "_")
    .replace(/\s+/g, "-") || "template";

const downloadTemplateFile = (data: TemplateFile, fileName: string) => {
  const json = JSON.stringify(data, null, 2);

  const blob = new Blob([json], {
    type: "application/json;charset=utf-8",
  });

  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = `${fileName}.pbtpl`;

  document.body.appendChild(anchor);

  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(url);
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
  selectedComponentId,
  commitHistory,
  setSelectedComponentId,
}: Options) => {
  const [showTemplateSaveModal, setShowTemplateSaveModal] = useState(false);

  const [templateSaveType, setTemplateSaveType] =
    useState<TemplateSaveType>("project");

  const [templateFileName, setTemplateFileName] = useState("");

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

        downloadTemplateFile(template, sanitizeFileName(name));

        setShowTemplateSaveModal(false);
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

      if (!selectedComponentId) {
        alert("먼저 컴포넌트를 선택해주세요.");
        return;
      }

      const component = findComponentRecursive(components, selectedComponentId);

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

        downloadTemplateFile(template, sanitizeFileName(name));

        setShowTemplateSaveModal(false);
      } catch (error) {
        console.error("컴포넌트 템플릿 저장 실패:", error);

        alert("템플릿 저장 중 오류가 발생했습니다.");
      }
    },
    [components, selectedComponentId],
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

        setSelectedComponentId(null);
        return;
      }

      commitHistory((prev) => normalizeOrder([...prev, ...cloned]));
    },
    [commitHistory, setSelectedComponentId],
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

      if (!selectedComponentId) {
        commitHistory((prev) => normalizeOrder([...prev, cloned]));

        setSelectedComponentId(cloned.id);
        return;
      }

      const selected = findComponentRecursive(components, selectedComponentId);

      if (selected && selected.type === "container") {
        commitHistory((prev) =>
          insertComponentRecursive(
            prev,
            selected.id,
            selected.children.length,
            cloned,
          ),
        );

        setSelectedComponentId(cloned.id);
        return;
      }

      commitHistory((prev) => normalizeOrder([...prev, cloned]));

      setSelectedComponentId(cloned.id);
    },
    [commitHistory, components, selectedComponentId, setSelectedComponentId],
  );

  const loadTemplateFile = useCallback(
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

      const reader = new FileReader();

      reader.onload = () => {
        try {
          const text = String(reader.result ?? "");

          if (!text.trim()) {
            throw new Error("빈 템플릿 파일입니다.");
          }

          const parsed: unknown = JSON.parse(text);

          const validation = validateTemplateFile(parsed);

          if (!validation.valid) {
            throw new Error(validation.error);
          }

          if (validation.template.templateType === "project") {
            applyLoadedProjectTemplate(validation.template);
          } else {
            applyLoadedComponentTemplate(validation.template);
          }
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
    [applyLoadedComponentTemplate, applyLoadedProjectTemplate],
  );

  const saveTemplateFromModal = useCallback(() => {
    if (!templateFileName.trim()) {
      alert("템플릿 이름을 입력해주세요.");
      return;
    }

    if (templateSaveType === "project") {
      void saveProjectAsTemplateFile(templateFileName);
      return;
    }

    void saveSelectedComponentAsTemplateFile(templateFileName);
  }, [
    saveProjectAsTemplateFile,
    saveSelectedComponentAsTemplateFile,
    templateFileName,
    templateSaveType,
  ]);

  const openProjectTemplateSaveModal = useCallback(() => {
    setTemplateSaveType("project");
    setTemplateFileName("새 프로젝트 템플릿");
    setShowTemplateSaveModal(true);
  }, []);

  const openSelectedTemplateSaveModal = useCallback(() => {
    setTemplateSaveType("component");

    const component = selectedComponentId
      ? findComponentRecursive(components, selectedComponentId)
      : undefined;

    setTemplateFileName(component?.name?.trim() || "새 컴포넌트 템플릿");

    setShowTemplateSaveModal(true);
  }, [components, selectedComponentId]);

  return {
    showTemplateSaveModal,
    setShowTemplateSaveModal,
    templateSaveType,
    templateFileName,
    setTemplateFileName,
    loadTemplateFile,
    saveTemplateFromModal,
    openProjectTemplateSaveModal,
    openSelectedTemplateSaveModal,
  };
};
