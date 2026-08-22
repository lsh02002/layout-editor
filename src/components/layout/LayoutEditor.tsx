import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";

import DivBox from "./DivBox";
import {
  type ComponentLayout,
  type LayoutComponent,
  type ComponentType,
  type ContainerDirection,
  type HistoryState,
  type ComponentsUpdater,
  type LinkType,
  type TemplateFile,
  type FavoriteComponent,
  type AutoSaveData,
  AUTOSAVE_KEY,
} from "../../types/types";

import { data } from "../../data/data";
import QuillEditorSimpleInput from "../form/QuillEditorSimpleInput";

const compressImageUrl = async (
  src: string,
  maxWidth = 1600,
  maxHeight = 1600,
  quality = 0.8,
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      let width = img.naturalWidth;
      let height = img.naturalHeight;

      // 비율 유지하면서 축소
      const ratio = Math.min(maxWidth / width, maxHeight / height, 1);

      width = Math.round(width * ratio);
      height = Math.round(height * ratio);

      const canvas = document.createElement("canvas");

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Canvas context를 생성할 수 없습니다."));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      try {
        // HTML 용량 절감을 위해 WebP
        const dataUrl = canvas.toDataURL("image/webp", quality);

        resolve(dataUrl);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error("이미지를 불러올 수 없습니다."));
    };

    img.src = src;
  });
};

const convertComponentsForSave = async (
  items: LayoutComponent[],
): Promise<LayoutComponent[]> => {
  return Promise.all(
    items.map(async (component) => {
      if (component.type === "image") {
        let exportImageUrl = component.props.urls?.[0] ?? "";

        if (exportImageUrl) {
          try {
            exportImageUrl = await compressImageUrl(
              exportImageUrl,
              1600,
              1600,
              0.8,
            );
          } catch (error) {
            console.error("이미지 압축 실패:", error);

            exportImageUrl = component.props.urls?.[0] ?? "";
          }
        }

        return {
          ...component,

          props: {
            ...component.props,

            urls: exportImageUrl ? [exportImageUrl] : [],

            maxCount: 1,
          },
        };
      }

      if (component.type === "container") {
        return {
          ...component,

          children: await convertComponentsForSave(component.children),
        };
      }

      return component;
    }),
  );
};

const getAutoSaveSnapshot = (components: LayoutComponent[], css: string) => {
  return JSON.stringify({
    components,
    projectCustomCss: css,
  });
};

const downloadProjectFile = async (
  components: LayoutComponent[],
  projectCustomCss: string,
  setAutoSaveBaseline: React.Dispatch<React.SetStateAction<string>>,
) => {
  try {
    const savedComponents = await convertComponentsForSave(components);

    const projectData = {
      version: 1,

      components: savedComponents,

      projectCustomCss,

      savedAt: new Date().toISOString(),
    };

    const json = JSON.stringify(projectData, null, 2);

    const blob = new Blob([json], {
      type: "application/json;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);

    const anchor = document.createElement("a");

    anchor.href = url;

    anchor.download = "page-builder-project.json";

    document.body.appendChild(anchor);

    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(url);

    localStorage.removeItem(AUTOSAVE_KEY);

    setAutoSaveBaseline(getAutoSaveSnapshot(components, projectCustomCss));
  } catch (error) {
    console.error("프로젝트 저장 실패:", error);

    alert("프로젝트 저장 중 오류가 발생했습니다.");

    throw error;
  }
};

const normalizeOrder = (items: LayoutComponent[]): LayoutComponent[] => {
  return items.map((item, index) => ({
    ...item,
    order: index,
  }));
};

function hasComponentType(
  items: LayoutComponent[],
  type: ComponentType,
): boolean {
  for (const component of items) {
    if (component.type === type) {
      return true;
    }

    if (
      component.type === "container" &&
      hasComponentType(component.children, type)
    ) {
      return true;
    }
  }

  return false;
}

const removeComponentRecursive = (
  items: LayoutComponent[],
  id: string,
): { items: LayoutComponent[]; removed: LayoutComponent | null } => {
  const directIndex = items.findIndex((item) => item.id === id);

  if (directIndex >= 0) {
    const next = [...items];
    const [removed] = next.splice(directIndex, 1);

    return {
      items: normalizeOrder(next),
      removed,
    };
  }

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];

    if (item.type !== "container") {
      continue;
    }

    const result = removeComponentRecursive(item.children, id);

    if (result.removed) {
      const next = [...items];

      next[index] = {
        ...item,
        children: result.items,
      };

      return {
        items: normalizeOrder(next),
        removed: result.removed,
      };
    }
  }

  return {
    items,
    removed: null,
  };
};

const readAutoSaveData = (): AutoSaveData | null => {
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY);

    if (!raw) {
      return null;
    }

    const parsed: unknown = JSON.parse(raw);

    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    const value = parsed as Partial<AutoSaveData>;

    if (value.version !== 1 || !Array.isArray(value.components)) {
      return null;
    }

    return {
      version: 1,

      savedAt:
        typeof value.savedAt === "string"
          ? value.savedAt
          : new Date().toISOString(),

      components: value.components,

      projectCustomCss:
        typeof value.projectCustomCss === "string"
          ? value.projectCustomCss
          : "",
    };
  } catch (error) {
    console.error("자동 저장본 읽기 실패:", error);

    return null;
  }
};

const cloneComponent = (component: LayoutComponent): LayoutComponent => {
  const newId = crypto.randomUUID();

  if (component.type === "image") {
    return {
      ...component,
      id: newId,

      props: {
        ...component.props,
        urls: [...component.props.urls],
      },

      style: component.style
        ? {
            ...component.style,
          }
        : undefined,

      contentStyle: component.contentStyle
        ? {
            ...component.contentStyle,
          }
        : undefined,

      layout: component.layout
        ? {
            ...component.layout,
          }
        : undefined,
    };
  }

  if (component.type === "container") {
    return {
      ...component,
      id: newId,

      props: {
        ...component.props,
      },

      style: component.style
        ? {
            ...component.style,
          }
        : undefined,

      contentStyle: component.contentStyle
        ? {
            ...component.contentStyle,
          }
        : undefined,

      layout: component.layout
        ? {
            ...component.layout,
          }
        : undefined,

      children: component.children.map((child) => cloneComponent(child)),
    };
  }

  return {
    ...component,
    id: newId,

    props: {
      ...component.props,
    },

    style: component.style
      ? {
          ...component.style,
        }
      : undefined,

    contentStyle: component.contentStyle
      ? {
          ...component.contentStyle,
        }
      : undefined,

    layout: component.layout
      ? {
          ...component.layout,
        }
      : undefined,
  } as LayoutComponent;
};

const insertComponentRecursive = (
  items: LayoutComponent[],
  parentId: string | null,
  index: number,
  component: LayoutComponent,
): LayoutComponent[] => {
  if (parentId === null) {
    const next = [...items];
    const safeIndex = Math.max(0, Math.min(index, next.length));

    next.splice(safeIndex, 0, component);

    return normalizeOrder(next);
  }

  return items.map((item) => {
    if (item.type === "container" && item.id === parentId) {
      const children = [...item.children];
      const safeIndex = Math.max(0, Math.min(index, children.length));

      children.splice(safeIndex, 0, component);

      return {
        ...item,
        children: normalizeOrder(children),
      };
    }

    if (item.type === "container") {
      return {
        ...item,
        children: insertComponentRecursive(
          item.children,
          parentId,
          index,
          component,
        ),
      };
    }

    return item;
  });
};

const findComponentLocation = (
  items: LayoutComponent[],
  id: string,
  parentId: string | null = null,
): { parentId: string | null; index: number } | null => {
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];

    if (item.id === id) {
      return { parentId, index };
    }

    if (item.type === "container") {
      const found = findComponentLocation(item.children, id, item.id);

      if (found) {
        return found;
      }
    }
  }

  return null;
};

const findComponentRecursive = (
  items: LayoutComponent[],
  id: string,
): LayoutComponent | undefined => {
  for (const item of items) {
    if (item.id === id) {
      return item;
    }

    if (item.type === "container") {
      const found = findComponentRecursive(item.children, id);

      if (found) {
        return found;
      }
    }
  }

  return undefined;
};

function LayoutEditor() {
  const [history, setHistory] = useState<HistoryState>(() => ({
    past: [],
    present: data,
    future: [],
  }));

  const [showCreateModal, setShowCreateModal] = useState(false);

  const [newType, setNewType] = useState<ComponentType>("textarea");

  const [newTitle, setNewTitle] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newPlaceholder, setNewPlaceholder] = useState("");

  const [newDirection, setNewDirection] =
    useState<ContainerDirection>("column");

  const [newImagePreviewUrl, setNewImagePreviewUrl] = useState("");

  const [newLinkType, setNewLinkType] = useState<LinkType>("url");
  const [newLinkNewWindow, setNewLinkNewWindow] = useState(false);

  const [newComponentName, setNewComponentName] = useState("");

  const [newHeadingText, setNewHeadingText] = useState("");

  const [newHeadingLevel, setNewHeadingLevel] = useState<1 | 2 | 3 | 4 | 5 | 6>(
    2,
  );

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingComponentId, setEditingComponentId] = useState<string | null>(
    null,
  );

  const [editType, setEditType] = useState<ComponentType>("textarea");

  const [editTitle, setEditTitle] = useState("");
  const [editValue, setEditValue] = useState("");

  const [editPlaceholder, setEditPlaceholder] = useState("");

  const [editDirection, setEditDirection] = useState<"row" | "column">(
    "column",
  );

  const [editDisabled, setEditDisabled] = useState(false);

  const [editStyle, setEditStyle] = useState<CSSProperties>({});
  const [editContentStyle, setEditContentStyle] = useState<CSSProperties>({});

  const [editCustomCss, setEditCustomCss] = useState("");

  const [editTab, setEditTab] = useState<"basic" | "style" | "css">("basic");

  const [editImageUrl, setEditImageUrl] = useState("");

  const [editImagePreviewUrl, setEditImagePreviewUrl] = useState("");

  const [editLinkType, setEditLinkType] = useState<LinkType>("url");
  const [editLinkNewWindow, setEditLinkNewWindow] = useState(false);

  const [editComponentName, setEditComponentName] = useState("");

  const [editHeadingLevel, setEditHeadingLevel] = useState<
    1 | 2 | 3 | 4 | 5 | 6
  >(2);

  const [snapEnabled, setSnapEnabled] = useState(true);
  const [gridSize, setGridSize] = useState(10);

  const [lastSavedSnapshot, setLastSavedSnapshot] = useState(() =>
    JSON.stringify({ components: history.present, projectCustomCss: "" }),
  );

  const [insertTarget, setInsertTarget] = useState<{
    parentId: string | null;
    index: number;
  } | null>(null);

  // Drag & Drop 상태
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const draggingIdRef = useRef<string | null>(null);

  const [activeDropTarget, setActiveDropTarget] = useState<{
    parentId: string | null;
    index: number;
    area: "canvas" | "layer";
  } | null>(null);

  const [showLayerPanel, setShowLayerPanel] = useState(true);

  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(
    null,
  );

  const [layerSearch, setLayerSearch] = useState("");

  const [showTemplateSaveModal, setShowTemplateSaveModal] = useState(false);

  const [templateSaveType, setTemplateSaveType] = useState<
    "project" | "component"
  >("project");

  const [templateFileName, setTemplateFileName] = useState("");

  const [favoriteComponents, setFavoriteComponents] = useState<
    FavoriteComponent[]
  >([]);

  const [showFavoritePanel, setShowFavoritePanel] = useState(false);

  const [projectCustomCss, setProjectCustomCss] = useState("");

  const [showProjectCssModal, setShowProjectCssModal] = useState(false);

  const [projectCssDraft, setProjectCssDraft] = useState("");

  const [lastAutoSavedAt, setLastAutoSavedAt] = useState<string | null>(null);

  const [restoreData, setRestoreData] = useState<AutoSaveData | null>(() =>
    readAutoSaveData(),
  );

  const showRestoreModal = restoreData !== null;

  const [autoSaveBaseline, setAutoSaveBaseline] = useState(() =>
    getAutoSaveSnapshot(history.present, projectCustomCss),
  );

  const copiedComponentRef = useRef<LayoutComponent | null>(null);

  const historyActionRef = useRef<{
    active: boolean;
    snapshot: LayoutComponent[] | null;
  }>({
    active: false,
    snapshot: null,
  });

  const VALID_COMPONENT_TYPES = [
    "button",
    "heading",
    "textarea",
    "quill",
    "image",
    "link",
    "container",
    "scrollToTopButton",
  ] as const;

  const restoreAutoSave = () => {
    if (!restoreData) {
      return;
    }

    const restoredCss = restoreData.projectCustomCss ?? "";

    setHistory({
      past: [],
      present: restoreData.components,
      future: [],
    });

    setProjectCustomCss(restoredCss);

    setSelectedComponentId(null);

    /*
     * 중요:
     * 현재 복구에 사용한 AutoSave는 제거
     */
    localStorage.removeItem(AUTOSAVE_KEY);

    /*
     * 복구 직후 같은 내용이
     * 다시 AutoSave 되는 것을 방지
     */
    setAutoSaveBaseline(
      getAutoSaveSnapshot(restoreData.components, restoredCss),
    );

    /*
     * 복구 모달 종료
     */
    setRestoreData(null);
  };

  const discardAutoSave = () => {
    localStorage.removeItem(AUTOSAVE_KEY);

    setRestoreData(null);
  };

  useEffect(() => {
    const currentSnapshot = getAutoSaveSnapshot(
      history.present,
      projectCustomCss,
    );

    /*
     * 마지막 AutoSave 기준과
     * 현재 상태가 같으면 저장 안 함
     */
    if (currentSnapshot === autoSaveBaseline) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      try {
        const data: AutoSaveData = {
          version: 1,

          savedAt: new Date().toISOString(),

          components: history.present,

          projectCustomCss,
        };

        localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(data));

        /*
         * 현재 내용을 새로운 기준점으로
         */
        setAutoSaveBaseline(currentSnapshot);

        setLastAutoSavedAt(data.savedAt);
      } catch (error) {
        console.error("자동 저장 실패:", error);
      }
    }, 3000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [history.present, projectCustomCss, autoSaveBaseline]);

  const addSelectedComponentToFavorites = () => {
    if (!selectedComponentId) {
      return;
    }

    const component = findComponentRecursive(
      history.present,
      selectedComponentId,
    );

    if (!component) {
      return;
    }

    if (
      component.type === "scrollToTopButton" &&
      hasComponentType(history.present, component.type)
    ) {
      alert("Scroll To Top Button은 한번만 등록 가능합니다.");

      return;
    }

    const alreadyExists = favoriteComponents.some(
      (favorite) => favorite.sourceComponentId === component.id,
    );

    if (alreadyExists) {
      alert("이미 즐겨찾기에 등록된 컴포넌트입니다.");
      return;
    }

    setFavoriteComponents((prev) => [
      ...prev,

      {
        id: crypto.randomUUID(),

        sourceComponentId: component.id,

        name: component.name?.trim() || component.type,

        component: structuredClone(component),
      },
    ]);
  };

  const insertFavoriteComponent = (favorite: FavoriteComponent) => {
    const cloned = cloneComponent(favorite.component);

    /*
     * 선택 없음
     */
    if (!selectedComponentId) {
      commitHistory((prev) => normalizeOrder([...prev, cloned]));

      setSelectedComponentId(cloned.id);

      return;
    }

    const selected = findComponentRecursive(
      history.present,
      selectedComponentId,
    );

    /*
     * Container 선택
     * → 내부 마지막
     */
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

    /*
     * 일반 컴포넌트 선택
     * → 선택 컴포넌트 바로 다음
     */
    const location = findComponentLocation(
      history.present,
      selectedComponentId,
    );

    if (!location) {
      return;
    }

    commitHistory((prev) =>
      insertComponentRecursive(
        prev,

        location.parentId,

        location.index + 1,

        cloned,
      ),
    );

    setSelectedComponentId(cloned.id);
  };

  const removeFavoriteComponent = (favoriteId: string) => {
    setFavoriteComponents((prev) =>
      prev.filter((favorite) => favorite.id !== favoriteId),
    );
  };

  const sanitizeFileName = (name: string) => {
    return (
      name
        .trim()
        .replace(/[\\/:*?"<>|]/g, "_")
        .replace(/\s+/g, "-") || "template"
    );
  };

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

  const saveProjectAsTemplateFile = async (templateName: string) => {
    const name = templateName.trim();

    if (!name) {
      alert("템플릿 이름을 입력해주세요.");
      return;
    }

    if (history.present.length === 0) {
      alert("저장할 컴포넌트가 없습니다.");
      return;
    }

    try {
      const components = await convertComponentsForSave(history.present);

      const template: TemplateFile = {
        version: 1,
        templateType: "project",
        name,
        createdAt: new Date().toISOString(),
        components,
      };

      downloadTemplateFile(template, sanitizeFileName(name));

      setShowTemplateSaveModal(false);
    } catch (error) {
      console.error("프로젝트 템플릿 저장 실패:", error);

      alert("템플릿 저장 중 오류가 발생했습니다.");
    }
  };

  const saveSelectedComponentAsTemplateFile = async (templateName: string) => {
    const name = templateName.trim();

    if (!name) {
      alert("템플릿 이름을 입력해주세요.");
      return;
    }

    if (!selectedComponentId) {
      alert("먼저 컴포넌트를 선택해주세요.");
      return;
    }

    const component = findComponentRecursive(
      history.present,
      selectedComponentId,
    );

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

    if (
      value.templateType !== "project" &&
      value.templateType !== "component"
    ) {
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

    /*
     * 프로젝트 템플릿
     */
    if (value.templateType === "project") {
      if (!Array.isArray(value.components)) {
        return {
          valid: false,
          error: "components가 올바르지 않습니다.",
        };
      }

      for (let index = 0; index < value.components.length; index++) {
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

    /*
     * 컴포넌트 템플릿
     */
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

  const applyLoadedProjectTemplate = (
    template: Extract<TemplateFile, { templateType: "project" }>,
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
  };

  const applyLoadedComponentTemplate = (
    template: Extract<TemplateFile, { templateType: "component" }>,
  ) => {
    const cloned = cloneComponent(template.component);

    /*
     * 아무것도 선택 안 됨
     * → Root 끝에 추가
     */
    if (!selectedComponentId) {
      commitHistory((prev) => normalizeOrder([...prev, cloned]));

      setSelectedComponentId(cloned.id);

      return;
    }

    const selected = findComponentRecursive(
      history.present,
      selectedComponentId,
    );

    /*
     * 선택 컴포넌트가 Container면
     * → Container 내부 마지막에 추가
     */
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

    /*
     * 일반 컴포넌트 선택 상태
     * → 일단 Root 마지막에 추가
     */
    commitHistory((prev) => normalizeOrder([...prev, cloned]));

    setSelectedComponentId(cloned.id);
  };

  const applyLoadedTemplate = (template: TemplateFile) => {
    if (template.templateType === "project") {
      applyLoadedProjectTemplate(template);

      return;
    }

    applyLoadedComponentTemplate(template);
  };

  const loadTemplateFile = (event: React.ChangeEvent<HTMLInputElement>) => {
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

        applyLoadedTemplate(validation.template);
      } catch (error) {
        console.error("템플릿 불러오기 실패:", error);

        const message =
          error instanceof Error ? error.message : "알 수 없는 오류입니다.";

        alert(`템플릿을 불러올 수 없습니다.\n\n${message}`);
      } finally {
        // 같은 파일 다시 선택 가능
        event.target.value = "";
      }
    };

    reader.onerror = () => {
      alert("파일을 읽는 중 오류가 발생했습니다.");

      event.target.value = "";
    };

    reader.readAsText(file);
  };

  const beginHistoryAction = () => {
    if (historyActionRef.current.active) {
      return;
    }

    historyActionRef.current = {
      active: true,

      // 액션 시작 직전 상태
      snapshot: history.present,
    };
  };

  const updateHistoryAction = (
    updater: (prev: LayoutComponent[]) => LayoutComponent[],
  ) => {
    setHistory((prev) => ({
      ...prev,

      // past는 건드리지 않고
      // 현재 화면만 계속 업데이트
      present: updater(prev.present),

      // 새로운 수정이 시작됐으므로 redo 제거
      future: [],
    }));
  };

  const endHistoryAction = () => {
    const action = historyActionRef.current;

    if (!action.active || !action.snapshot) {
      return;
    }

    setHistory((prev) => {
      /*
       * 실제 변화가 없으면
       * history 추가 안 함
       */
      if (JSON.stringify(action.snapshot) === JSON.stringify(prev.present)) {
        return prev;
      }

      return {
        past: [
          ...prev.past,

          // 액션 시작 전 상태를 딱 한 번 저장
          action.snapshot!,
        ],

        present: prev.present,

        future: [],
      };
    });

    historyActionRef.current = {
      active: false,
      snapshot: null,
    };
  };

  const isObject = (value: unknown): value is Record<string, unknown> => {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  };

  const isValidComponentType = (value: unknown): value is ComponentType => {
    return (
      typeof value === "string" &&
      VALID_COMPONENT_TYPES.includes(
        value as (typeof VALID_COMPONENT_TYPES)[number],
      )
    );
  };

  const components = history.present;

  const currentSnapshot = JSON.stringify({
    components: history.present,
    projectCustomCss,
  });

  const hasUnsavedChanges = currentSnapshot !== lastSavedSnapshot;

  const snapNumber = (value: number, size: number) => {
    return Math.round(value / size) * size;
  };

  const snapLayout = (
    layout: Partial<ComponentLayout>,
  ): Partial<ComponentLayout> => {
    if (!snapEnabled) {
      return layout;
    }

    const next = {
      ...layout,
    };

    Object.entries(next).forEach(([key, value]) => {
      if (typeof value !== "number") {
        return;
      }

      (next as Record<string, unknown>)[key] = snapNumber(value, gridSize);
    });

    return next;
  };

  const getLinkHref = (
    component: Extract<LayoutComponent, { type: "link" }>,
  ) => {
    const value = component.props.value?.trim() ?? "";

    if (!value) {
      return "#";
    }

    switch (component.props.linkType) {
      case "tel": {
        // 공백 제거
        const phone = value.replace(/\s+/g, "");

        return `tel:${phone}`;
      }

      case "email":
        return `mailto:${value}`;

      case "url":
      default:
        // http:// 또는 https://가 없으면
        // https:// 자동 추가
        if (/^https?:\/\//i.test(value)) {
          return value;
        }

        return `https://${value}`;
    }
  };

  const getComponentSearchText = (component: LayoutComponent) => {
    const type = component.type.toLowerCase();

    const componentName = component.name ?? "";

    let content = "";

    switch (component.type) {
      case "button":
        content = component.props.title ?? "";
        break;

      case "heading":
        content = [
          component.props.text,
          `h${component.props.level}`,
          "heading",
          "제목",
        ]
          .filter(Boolean)
          .join(" ");

        break;

      case "textarea":
        content = [component.props.value, component.props.placeholder]
          .filter(Boolean)
          .join(" ");
        break;

      case "quill":
        content = [
          component.props.value
            ?.replace(/<[^>]*>/g, " ")
            .replace(/\s+/g, " ")
            .trim(),

          component.props.placeholder,
        ]
          .filter(Boolean)
          .join(" ");
        break;

      case "image":
        content = "image 이미지";
        break;

      case "container":
        content = "container 컨테이너";
        break;

      case "scrollToTopButton":
        content = [component.props.title, "scrollToTop", "scroll top", "맨위로"]
          .filter(Boolean)
          .join(" ");
        break;

      case "link":
        content = [
          component.props.title,
          component.props.value,
          component.props.linkType,
          "link",
          "링크",
        ]
          .filter(Boolean)
          .join(" ");
        break;
    }

    return `${componentName} ${type} ${content}`.toLowerCase();
  };

  const normalizeSearchText = (value: string) => {
    return value
      .toLowerCase()
      .replace(/\u00A0/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
  };

  const filterLayerComponents = (
    items: LayoutComponent[],
    search: string,
  ): LayoutComponent[] => {
    /*
     * 검색어도 동일하게 정규화
     */
    const keyword = normalizeSearchText(search);

    if (!keyword) {
      return items;
    }

    const filterRecursive = (
      component: LayoutComponent,
    ): LayoutComponent | null => {
      /*
       * 컴포넌트 검색 문자열도
       * 동일하게 정규화
       */
      const searchText = normalizeSearchText(getComponentSearchText(component));

      const selfMatched = searchText.includes(keyword);

      /*
       * 일반 컴포넌트
       */
      if (component.type !== "container") {
        return selfMatched ? component : null;
      }

      /*
       * Container 자식 검색
       */
      const filteredChildren = component.children
        .map(filterRecursive)
        .filter((child): child is LayoutComponent => child !== null);

      if (selfMatched || filteredChildren.length > 0) {
        return {
          ...component,

          children: selfMatched ? component.children : filteredChildren,
        };
      }

      return null;
    };

    return items
      .map(filterRecursive)
      .filter((component): component is LayoutComponent => component !== null);
  };

  const filteredLayerComponents = filterLayerComponents(
    components,
    layerSearch,
  );

  const commitHistory = useCallback(
    (updater: (prev: LayoutComponent[]) => LayoutComponent[]) => {
      setHistory((prev) => {
        const next = updater(prev.present);

        return {
          past: [...prev.past, prev.present],
          present: next,
          future: [],
        };
      });
    },
    [],
  );

  const setComponents = (updater: ComponentsUpdater, recordHistory = true) => {
    setHistory((prev) => {
      const nextComponents =
        typeof updater === "function" ? updater(prev.present) : updater;

      const nextSnapshot: LayoutComponent[] = nextComponents;

      if (!recordHistory) {
        return {
          ...prev,
          present: nextSnapshot,
        };
      }

      return {
        past: [...prev.past, prev.present],
        present: nextSnapshot,
        future: [],
      };
    });
  };

  const validateComponent = (
    value: unknown,
    path = "components",
  ): string | null => {
    if (!isObject(value)) {
      return `${path}: 컴포넌트 형식이 올바르지 않습니다.`;
    }

    /*
     * 공통 필드
     */
    if (typeof value.id !== "string" || value.id.trim() === "") {
      return `${path}: id가 올바르지 않습니다.`;
    }

    if (
      value.name !== undefined &&
      (typeof value.name !== "string" || value.name.trim() === "")
    ) {
      return `${path}: name이 올바르지 않습니다.`;
    }

    if (value.customCss !== undefined && typeof value.customCss !== "string") {
      return `${path}: customCss가 올바르지 않습니다.`;
    }

    if (!isValidComponentType(value.type)) {
      return `${path}: 지원하지 않는 component type입니다. (${String(
        value.type,
      )})`;
    }

    if (typeof value.order !== "number" || !Number.isFinite(value.order)) {
      return `${path}: order가 올바르지 않습니다.`;
    }

    if (!isObject(value.props)) {
      return `${path}: props가 올바르지 않습니다.`;
    }

    /*
     * style 관련은 존재하는 경우 객체인지 검사
     */
    if (value.style !== undefined && !isObject(value.style)) {
      return `${path}: style이 올바르지 않습니다.`;
    }

    if (value.contentStyle !== undefined && !isObject(value.contentStyle)) {
      return `${path}: contentStyle이 올바르지 않습니다.`;
    }

    if (value.layout !== undefined && !isObject(value.layout)) {
      return `${path}: layout이 올바르지 않습니다.`;
    }

    const props = value.props;

    /*
     * 타입별 검사
     */
    switch (value.type) {
      case "button": {
        if (typeof props.title !== "string") {
          return `${path}: button.title이 올바르지 않습니다.`;
        }

        break;
      }

      case "scrollToTopButton": {
        if (typeof props.title !== "string") {
          return `${path}: scrollToTopButton.title이 올바르지 않습니다.`;
        }

        break;
      }

      case "heading": {
        if (typeof props.text !== "string") {
          return `${path}: heading.text가 올바르지 않습니다.`;
        }

        if (
          props.level !== 1 &&
          props.level !== 2 &&
          props.level !== 3 &&
          props.level !== 4 &&
          props.level !== 5 &&
          props.level !== 6
        ) {
          return `${path}: heading.level이 올바르지 않습니다.`;
        }

        break;
      }

      case "textarea": {
        if (typeof props.value !== "string") {
          return `${path}: textarea.value가 올바르지 않습니다.`;
        }

        if (
          props.placeholder !== undefined &&
          typeof props.placeholder !== "string"
        ) {
          return `${path}: textarea.placeholder가 올바르지 않습니다.`;
        }

        if (props.rows !== undefined && typeof props.rows !== "number") {
          return `${path}: textarea.rows가 올바르지 않습니다.`;
        }

        break;
      }

      case "quill": {
        if (typeof props.value !== "string") {
          return `${path}: quill.value가 올바르지 않습니다.`;
        }

        if (
          props.placeholder !== undefined &&
          typeof props.placeholder !== "string"
        ) {
          return `${path}: quill.placeholder가 올바르지 않습니다.`;
        }

        break;
      }

      case "image": {
        if (!Array.isArray(props.urls)) {
          return `${path}: image.urls가 배열이 아닙니다.`;
        }

        if (props.urls.some((url) => typeof url !== "string")) {
          return `${path}: image.urls에 잘못된 값이 있습니다.`;
        }

        /*
         * 현재 프로젝트는 이미지 컴포넌트당 1장
         */
        if (props.urls.length > 1) {
          return `${path}: 이미지 컴포넌트에는 이미지 1개만 허용됩니다.`;
        }

        break;
      }

      case "link": {
        if (typeof props.title !== "string") {
          return `${path}: link.title이 올바르지 않습니다.`;
        }

        if (typeof props.value !== "string") {
          return `${path}: link.value가 올바르지 않습니다.`;
        }

        if (
          props.linkType !== "url" &&
          props.linkType !== "tel" &&
          props.linkType !== "email"
        ) {
          return `${path}: link.linkType이 올바르지 않습니다.`;
        }

        if (
          props.newWindow !== undefined &&
          typeof props.newWindow !== "boolean"
        ) {
          return `${path}: link.newWindow가 올바르지 않습니다.`;
        }

        break;
      }

      case "container": {
        if (props.direction !== "row" && props.direction !== "column") {
          return `${path}: container.direction이 올바르지 않습니다.`;
        }

        if (!Array.isArray(value.children)) {
          return `${path}: container.children이 배열이 아닙니다.`;
        }

        /*
         * Container 내부 재귀 검증
         */
        for (let index = 0; index < value.children.length; index++) {
          const error = validateComponent(
            value.children[index],
            `${path}.children[${index}]`,
          );

          if (error) {
            return error;
          }
        }

        break;
      }
    }

    /*
     * disabled가 존재하는 컴포넌트
     */
    if (
      "disabled" in props &&
      props.disabled !== undefined &&
      typeof props.disabled !== "boolean"
    ) {
      return `${path}: disabled 값이 올바르지 않습니다.`;
    }

    return null;
  };

  useEffect(() => {
    const handleClipboardShortcut = (event: KeyboardEvent) => {
      const ctrlOrMeta = event.ctrlKey || event.metaKey;

      if (!ctrlOrMeta) {
        return;
      }

      const key = event.key.toLowerCase();

      if (key !== "c" && key !== "v") {
        return;
      }

      /*
       * input / textarea / Quill에서는
       * 기존 텍스트 복사/붙여넣기 유지
       */
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

      /*
       * =========================
       * Ctrl / Cmd + C
       * =========================
       */
      if (key === "c") {
        if (!selectedComponentId) {
          return;
        }

        const component = findComponentRecursive(
          history.present,
          selectedComponentId,
        );

        if (!component) {
          return;
        }

        event.preventDefault();

        copiedComponentRef.current = structuredClone(component);

        return;
      }

      /*
       * =========================
       * Ctrl / Cmd + V
       * =========================
       */
      if (key === "v") {
        const copied = copiedComponentRef.current;

        if (!copied) {
          return;
        }

        event.preventDefault();

        const cloned = cloneComponent(copied);

        /*
         * 아무것도 선택 안 됨
         * → root 마지막
         */
        if (!selectedComponentId) {
          commitHistory((prev) => normalizeOrder([...prev, cloned]));

          setSelectedComponentId(cloned.id);

          return;
        }

        const selected = findComponentRecursive(
          history.present,
          selectedComponentId,
        );

        /*
         * Container 선택
         * → 내부 마지막
         */
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

        /*
         * 일반 컴포넌트 선택
         * → 현재 컴포넌트 바로 뒤
         */
        const location = findComponentLocation(
          history.present,
          selectedComponentId,
        );

        if (!location) {
          return;
        }

        commitHistory((prev) =>
          insertComponentRecursive(
            prev,
            location.parentId,
            location.index + 1,
            cloned,
          ),
        );

        setSelectedComponentId(cloned.id);
      }
    };

    window.addEventListener("keydown", handleClipboardShortcut);

    return () => {
      window.removeEventListener("keydown", handleClipboardShortcut);
    };
  }, [history.present, selectedComponentId, commitHistory]);

  const containsComponent = (
    component: LayoutComponent,
    targetId: string,
  ): boolean => {
    if (component.id === targetId) {
      return true;
    }

    if (component.type !== "container") {
      return false;
    }

    return component.children.some((child) =>
      containsComponent(child, targetId),
    );
  };

  const moveComponent = (
    componentId: string,
    targetParentId: string | null,
    targetIndex: number,
  ) => {
    const sourceLocation = findComponentLocation(components, componentId);
    const draggedComponent = findComponentRecursive(components, componentId);

    if (!sourceLocation || !draggedComponent) {
      return;
    }

    // 자기 자신 또는 자신의 하위 컨테이너 안으로 이동하는 순환 구조 방지
    if (
      targetParentId !== null &&
      containsComponent(draggedComponent, targetParentId)
    ) {
      return;
    }

    let adjustedTargetIndex = targetIndex;

    // 같은 부모에서 아래쪽으로 이동하면 원본 제거 후 index가 하나 줄어듦
    if (
      sourceLocation.parentId === targetParentId &&
      sourceLocation.index < targetIndex
    ) {
      adjustedTargetIndex -= 1;
    }

    // 실질적으로 같은 위치면 history를 만들지 않음
    if (
      sourceLocation.parentId === targetParentId &&
      sourceLocation.index === adjustedTargetIndex
    ) {
      return;
    }

    commitHistory((prev) => {
      const removedResult = removeComponentRecursive(prev, componentId);

      if (!removedResult.removed) {
        return prev;
      }

      return insertComponentRecursive(
        removedResult.items,
        targetParentId,
        adjustedTargetIndex,
        removedResult.removed,
      );
    });
  };

  useEffect(() => {
    const handleDeleteKey = (event: KeyboardEvent) => {
      if (event.key !== "Delete" && event.key !== "Backspace") {
        return;
      }

      /*
       * input / textarea / Quill에서는
       * 글자 삭제를 유지
       */
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

      if (!selectedComponentId) {
        return;
      }

      event.preventDefault();

      if (event.repeat) {
        return;
      }

      /*
       * 현재 선택 ID를 고정
       */
      const targetId = selectedComponentId;

      /*
       * history를 거쳐 삭제
       * → Ctrl+Z 복구 가능
       */
      commitHistory((prev) => {
        const result = removeComponentRecursive(prev, targetId);

        return result.items;
      });

      setSelectedComponentId(null);
    };

    window.addEventListener("keydown", handleDeleteKey);

    return () => {
      window.removeEventListener("keydown", handleDeleteKey);
    };
  }, [selectedComponentId, commitHistory]);

  const handlePointerDragStart = (
    e: React.PointerEvent<HTMLElement>,
    componentId: string,
  ) => {
    if (layerSearch) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    e.currentTarget.setPointerCapture(e.pointerId);

    setDraggingId(componentId);

    beginHistoryAction();

    // 여기서 기존 드래그 시작 좌표/상태 저장
    // 예:
    // dragPointerRef.current = {
    //   id: componentId,
    //   startX: e.clientX,
    //   startY: e.clientY,
    // };
  };

  const handleDrop = (
    e: React.DragEvent<HTMLElement>,
    parentId: string | null,
    index: number,
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const draggedId =
      e.dataTransfer.getData("text/plain") || draggingIdRef.current;

    if (!draggedId) {
      return;
    }

    moveComponent(draggedId, parentId, index);

    draggingIdRef.current = null;

    setDraggingId(null);
    setActiveDropTarget(null);
  };

  const handleDragOver = (
    e: React.DragEvent<HTMLElement>,
    parentId: string | null,
    index: number,
    area: "canvas" | "layer",
  ) => {
    if (!draggingIdRef.current) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    e.dataTransfer.dropEffect = "move";

    if (
      activeDropTarget?.parentId !== parentId ||
      activeDropTarget?.index !== index ||
      activeDropTarget?.area !== area
    ) {
      setActiveDropTarget({
        parentId,
        index,
        area,
      });
    }
  };

  const updateLayoutRecursive = (
    items: LayoutComponent[],
    id: string,
    newLayout: Partial<ComponentLayout>,
  ): LayoutComponent[] => {
    return items.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          layout: {
            ...item.layout,
            ...newLayout,
          },
        };
      }

      if (item.type === "container") {
        return {
          ...item,
          children: updateLayoutRecursive(item.children, id, newLayout),
        };
      }

      return item;
    });
  };

  const updateLayout = (id: string, newLayout: Partial<ComponentLayout>) => {
    // 그리드 스냅 적용
    const snappedLayout = snapLayout(newLayout);

    const updater = (prev: LayoutComponent[]) =>
      updateLayoutRecursive(prev, id, snappedLayout);

    // 드래그 / 리사이즈 액션 중
    if (historyActionRef.current.active) {
      updateHistoryAction(updater);
      return;
    }

    // 일반 단발 변경
    setComponents(updater);
  };

  const editComponent = (id: string) => {
    const component = findComponentRecursive(components, id);

    if (!component) return;

    setEditingComponentId(component.id);
    setEditComponentName(component.name ?? "");
    setEditType(component.type);
    setEditStyle(component.style ?? {});
    setEditContentStyle(component.contentStyle ?? {});
    setEditCustomCss(component.customCss ?? "");
    setEditTab("basic");
    setEditDisabled(
      "disabled" in component.props
        ? (component.props.disabled ?? false)
        : false,
    );
    setEditImageUrl("");

    switch (component.type) {
      case "button":
        setEditTitle(component.props.title);
        setEditValue("");
        setEditPlaceholder("");
        setEditDirection("column");
        break;

      case "heading":
        setEditTitle("");
        setEditValue(component.props.text);

        setEditHeadingLevel(component.props.level);

        break;

      case "textarea":
        setEditTitle("");
        setEditValue(component.props.value);
        setEditPlaceholder(component.props.placeholder ?? "");
        setEditDirection("column");
        break;

      case "quill":
        setEditTitle("");
        setEditValue(component.props.value);
        setEditPlaceholder(component.props.placeholder ?? "");
        setEditDirection("column");
        break;

      case "container":
        setEditTitle("");
        setEditValue("");
        setEditPlaceholder("");
        setEditDirection(component.props.direction ?? "column");
        break;

      case "image": {
        setEditTitle("");
        setEditValue("");
        setEditPlaceholder("");
        setEditDirection("column");

        const existingUrl = component.props.urls?.[0] ?? "";

        setEditImageUrl(existingUrl);
        setEditImagePreviewUrl(existingUrl);
        break;
      }

      case "scrollToTopButton":
        setEditTitle("");
        setEditValue("");
        setEditPlaceholder("");
        setEditDirection("column");
        break;

      case "link":
        setEditTitle(component.props.title ?? "");
        setEditValue(component.props.value ?? "");
        setEditPlaceholder("");
        setEditDirection("column");

        setEditLinkType(component.props.linkType ?? "url");
        setEditLinkNewWindow(component.props.newWindow ?? false);
        break;
    }

    setShowEditModal(true);
  };

  const saveEditedComponent = () => {
    if (!editingComponentId) {
      return;
    }

    setComponents((prev) => {
      const recursiveUpdate = (items: LayoutComponent[]): LayoutComponent[] => {
        return items.map((component) => {
          if (component.id === editingComponentId) {
            switch (component.type) {
              case "button":
                return {
                  ...component,
                  name: editComponentName.trim() || component.name,
                  style: {
                    ...editStyle,
                  },
                  contentStyle: {
                    ...editContentStyle,
                  },
                  customCss: editCustomCss,
                  props: {
                    ...component.props,
                    title: editTitle.trim() || "버튼",
                    disabled: editDisabled,
                  },
                };

              case "heading":
                return {
                  ...component,

                  name: editComponentName.trim() || component.name,

                  customCss: editCustomCss,

                  style: {
                    ...editStyle,
                  },

                  contentStyle: {
                    ...editContentStyle,
                  },

                  props: {
                    ...component.props,

                    text: editValue.trim() || "제목",

                    level: editHeadingLevel,
                  },
                };

              case "textarea":
                return {
                  ...component,
                  name: editComponentName.trim() || component.name,
                  style: {
                    ...editStyle,
                  },
                  contentStyle: {
                    ...editContentStyle,
                  },
                  customCss: editCustomCss,
                  props: {
                    ...component.props,
                    value: editValue,
                    placeholder: editPlaceholder,
                    disabled: editDisabled,
                  },
                };

              case "quill":
                return {
                  ...component,
                  name: editComponentName.trim() || component.name,
                  style: {
                    ...editStyle,
                  },
                  contentStyle: {
                    ...editContentStyle,
                  },
                  customCss: editCustomCss,
                  props: {
                    ...component.props,
                    value: editValue,
                    placeholder: editPlaceholder,
                    disabled: editDisabled,
                  },
                };

              case "container":
                return {
                  ...component,
                  name: editComponentName.trim() || component.name,
                  style: {
                    ...editStyle,
                  },
                  contentStyle: {
                    ...editContentStyle,
                  },
                  customCss: editCustomCss,
                  props: {
                    ...component.props,
                    direction: editDirection,
                  },
                };

              case "image":
                return {
                  ...component,

                  name: editComponentName.trim() || component.name,

                  style: {
                    ...editStyle,
                  },

                  contentStyle: {
                    ...editContentStyle,
                  },

                  customCss: editCustomCss,

                  props: {
                    ...component.props,

                    urls: editImageUrl.trim() ? [editImageUrl.trim()] : [],

                    maxCount: 1,

                    disabled: editDisabled,
                  },
                };

              case "scrollToTopButton":
                return {
                  ...component,

                  name: editComponentName.trim() || component.name,

                  style: {
                    ...editStyle,
                  },
                  contentStyle: {
                    ...editContentStyle,
                  },
                  customCss: editCustomCss,
                  props: {
                    ...component.props,
                    disabled: editDisabled,
                    action: {
                      type: "scrollToTop",
                      payload: component.props.action.payload ?? null,
                    },
                  },
                };

              case "link":
                return {
                  ...component,

                  name: editComponentName.trim() || component.name,

                  style: {
                    ...editStyle,
                  },

                  contentStyle: {
                    ...editContentStyle,
                  },

                  customCss: editCustomCss,

                  props: {
                    ...component.props,

                    title: editTitle.trim() || "링크",
                    value: editValue.trim(),
                    linkType: editLinkType,

                    newWindow:
                      editLinkType === "url" ? editLinkNewWindow : false,

                    disabled: editDisabled,
                  },
                };
            }
          }

          if (component.type === "container") {
            return {
              ...component,

              children: recursiveUpdate(component.children),
            };
          }

          return component;
        });
      };

      return recursiveUpdate(prev);
    });

    closeEditModal();
  };

  const deleteRecursive = (
    items: LayoutComponent[],
    id: string,
  ): LayoutComponent[] => {
    const next = items
      .filter((component) => component.id !== id)
      .map((component) => {
        if (component.type === "container") {
          return {
            ...component,
            children: deleteRecursive(component.children, id),
          };
        }

        return component;
      });

    return normalizeOrder(next);
  };

  const deleteComponent = (id: string) => {
    commitHistory((prev) => deleteRecursive(prev, id));
    if (selectedComponentId === id) {
      setSelectedComponentId(null);
    }
  };

  const copyComponent = (id: string) => {
    commitHistory((prev) => {
      const copyRecursive = (items: LayoutComponent[]): LayoutComponent[] => {
        const result: LayoutComponent[] = [];

        for (const item of items) {
          if (item.id === id) {
            result.push(item);
            result.push(cloneComponent(item));
            continue;
          }

          if (item.type === "container") {
            result.push({
              ...item,
              children: copyRecursive(item.children),
            });
            continue;
          }

          result.push(item);
        }

        return normalizeOrder(result);
      };

      return copyRecursive(prev);
    });
  };

  const openCreateModal = (parentId: string | null, index: number) => {
    setInsertTarget({
      parentId,
      index,
    });

    setNewType("textarea");
    setNewComponentName("");
    setNewTitle("");
    setNewValue("");
    setNewPlaceholder("");
    setNewDirection("column");

    setNewImagePreviewUrl("");

    // LINK
    setNewLinkType("url");
    setNewLinkNewWindow(false);

    setShowCreateModal(true);

    setNewHeadingText("");
    setNewHeadingLevel(2);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setInsertTarget(null);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingComponentId(null);
  };

  const makeNewComponent = (): LayoutComponent => {
    const id = crypto.randomUUID();

    switch (newType) {
      case "button":
        return {
          id,
          name: newComponentName.trim() || "Button",
          type: "button",
          order: 0,

          props: {
            title: newTitle.trim() || "버튼",

            disabled: false,

            action: {
              type: "none",
              payload: null,
            },
          },

          style: {
            width: "100%",
          },
        };

      case "scrollToTopButton":
        return {
          id,
          name: newComponentName.trim() || "ScrollToTopButton",
          type: "scrollToTopButton",
          order: 0,

          props: {
            title: newTitle.trim() || "↑",

            disabled: false,

            action: {
              type: "scrollToTop",
              payload: null,
            },
          },

          style: {
            position: "fixed",
            width: "50px",
            height: "50px",
            right: "10px",
            bottom: "10px",
            zIndex: 1400,
          },
        };

      case "heading":
        return {
          id,
          name: newComponentName.trim() || "제목",

          type: "heading",
          order: 0,

          props: {
            text: newHeadingText.trim() || "제목을 입력하세요",

            level: newHeadingLevel,
          },

          style: {
            width: "100%",
          },

          contentStyle: {
            margin: 0,
          },
        };

      case "textarea":
        return {
          id,
          name: newComponentName.trim() || "Textarea",
          type: "textarea",
          order: 0,

          props: {
            value: newValue,
            rows: 3,

            placeholder: newPlaceholder.trim() || "내용을 입력하세요.",

            disabled: false,
          },

          style: {
            width: "100%",
          },
        };

      case "quill":
        return {
          id,
          name: newComponentName.trim() || "RichText",
          type: "quill",
          order: 0,

          props: {
            value: newValue,

            placeholder: newPlaceholder.trim() || "본문을 입력하세요.",

            disabled: false,
          },

          style: {
            width: "100%",
          },
        };

      case "image":
        return {
          id,
          name: newComponentName.trim() || "Image",
          type: "image",
          order: 0,

          props: {
            urls: newImagePreviewUrl ? [newImagePreviewUrl] : [],
            maxCount: 1,
            disabled: false,
          },

          style: {
            width: "100%",
          },
        };

      case "link":
        return {
          id,
          name: newComponentName.trim() || "Link",
          type: "link",
          order: 0,

          props: {
            title: newTitle.trim() || "링크",
            linkType: newLinkType,
            value: newValue.trim(),
            newWindow: newLinkType === "url" ? newLinkNewWindow : false,
            disabled: false,
          },

          style: {
            width: "100%",
          },

          contentStyle: {
            color: "#0d6efd",
            textDecoration: "underline",
            cursor: "pointer",
          },
        };

      case "container":
        return {
          id,
          name: newComponentName.trim() || "Container",
          type: "container",
          order: 0,

          props: {
            direction: newDirection,

            gap: 8,
          },

          style: {
            width: "100%",
            minHeight: 100,
            padding: 12,
            border: "1px dashed #adb5bd",
          },

          children: [],
        };
    }
  };

  const insertIntoRecursive = (
    items: LayoutComponent[],
    parentId: string,
    index: number,
    newComponent: LayoutComponent,
  ): LayoutComponent[] => {
    return items.map((item) => {
      if (item.type === "container" && item.id === parentId) {
        const children = [...item.children];

        children.splice(index, 0, newComponent);

        return {
          ...item,
          children: normalizeOrder(children),
        };
      }

      if (item.type === "container") {
        return {
          ...item,

          children: insertIntoRecursive(
            item.children,
            parentId,
            index,
            newComponent,
          ),
        };
      }

      return item;
    });
  };

  const createComponent = () => {
    if (!insertTarget) return;

    const newComponent = makeNewComponent();

    if (
      newType === "scrollToTopButton" &&
      hasComponentType(history.present, "scrollToTopButton")
    ) {
      alert("Scroll To Top Button은 한번만 등록 가능합니다.");

      return;
    }

    commitHistory((prev) => {
      let nextComponents: LayoutComponent[];

      if (insertTarget.parentId === null) {
        nextComponents = [...prev];

        nextComponents.splice(insertTarget.index, 0, newComponent);

        nextComponents = normalizeOrder(nextComponents);
      } else {
        nextComponents = insertIntoRecursive(
          prev,
          insertTarget.parentId,
          insertTarget.index,
          newComponent,
        );
      }

      return nextComponents;
    });

    closeCreateModal();
  };

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

      /*
       * =================================
       * 아래부터 Undo / Redo
       *
       * input, textarea, Quill에서는
       * 자체 Undo/Redo 사용
       * =================================
       */
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

      /*
       * Ctrl/Cmd + Z
       */
      if (key === "z" && !event.shiftKey && canUndo) {
        event.preventDefault();

        undo();

        return;
      }

      /*
       * Ctrl + Y
       * Cmd/Ctrl + Shift + Z
       */
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

      const snapshot = history.present;

      void downloadProjectFile(
        snapshot,
        projectCustomCss,
        setAutoSaveBaseline,
      ).then(() => {
        setLastSavedSnapshot(
          JSON.stringify({ components: snapshot, projectCustomCss }),
        );
      });
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [history.present, projectCustomCss]);

  const escapeHtml = (value: string) =>
    value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const escapeAttribute = (value: string) => escapeHtml(value);

  const styleToCss = (style?: CSSProperties) => {
    if (!style) return "";

    const unitlessProperties = new Set([
      "animationIterationCount",
      "borderImageOutset",
      "borderImageSlice",
      "borderImageWidth",
      "boxFlex",
      "boxFlexGroup",
      "boxOrdinalGroup",
      "columnCount",
      "columns",
      "flex",
      "flexGrow",
      "flexPositive",
      "flexShrink",
      "flexNegative",
      "flexOrder",
      "gridArea",
      "gridColumn",
      "gridColumnEnd",
      "gridColumnSpan",
      "gridColumnStart",
      "gridRow",
      "gridRowEnd",
      "gridRowSpan",
      "gridRowStart",
      "fontWeight",
      "lineClamp",
      "lineHeight",
      "opacity",
      "order",
      "orphans",
      "tabSize",
      "widows",
      "zIndex",
      "zoom",
    ]);

    return Object.entries(style)
      .filter(
        ([, value]) => value !== undefined && value !== null && value !== "",
      )
      .map(([key, value]) => {
        const cssKey = key
          .replace(/^ms-/, "-ms-")
          .replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

        const cssValue =
          typeof value === "number" &&
          value !== 0 &&
          !unitlessProperties.has(key)
            ? `${value}px`
            : String(value);

        return `${cssKey}:${cssValue}`;
      })
      .join(";");
  };

  const componentToHtml = async (
    component: LayoutComponent,
  ): Promise<string> => {
    const wrapperStyle = styleToCss(component.style);
    const contentStyle = styleToCss(component.contentStyle);

    switch (component.type) {
      case "button":
        return `<div data-component-id="${escapeAttribute(component.id)}" style="${escapeAttribute(wrapperStyle)}"><button type="button" style="${escapeAttribute(contentStyle)}">${escapeHtml(component.props.title)}</button></div>`;

      case "scrollToTopButton":
        return `<button data-component-id="${escapeAttribute(component.id)}" type="button" onclick="window.scrollTo({top:0,behavior:'smooth'})" style="${escapeAttribute(`${wrapperStyle};${contentStyle};display:flex;align-items:center;justify-content:center;border-radius:50%;color:#fff;background-color:#6c757d;border:1px solid #6c757d;padding:0.375rem 0.75rem;font-size:1rem;line-height:1.5;text-align:center;cursor:pointer;user-select:none;`)}">${escapeHtml(component.props.title)}</button>`;

      case "heading": {
        const tag = `h${component.props.level}`;

        return `
    <div
      data-component-id="${escapeAttribute(component.id)}"
      style="${escapeAttribute(wrapperStyle)}"
    >
      <${tag}
        style="${escapeAttribute(contentStyle)}"
      >
        ${escapeHtml(component.props.text)}
      </${tag}>
    </div>
  `;
      }

      case "textarea": {
        const text =
          component.props.value ||
          component.props.placeholder ||
          "내용을 입력하세요.";

        return `<div data-component-id="${escapeAttribute(component.id)}" style="${escapeAttribute(wrapperStyle)}"><div style="${escapeAttribute(`white-space:pre-wrap;word-break:break-word;${contentStyle}`)}">${escapeHtml(text)}</div></div>`;
      }

      case "quill": {
        const html =
          component.props.value ||
          `<span style="color:#6c757d">${escapeHtml(component.props.placeholder || "본문을 입력하세요.")}</span>`;

        return `<div data-component-id="${escapeAttribute(component.id)}" style="${escapeAttribute(wrapperStyle)}"><div style="${escapeAttribute(`word-break:break-word;${contentStyle}`)}">${html}</div></div>`;
      }

      case "image": {
        const originalUrl = component.props.urls?.[0] ?? "";

        if (!originalUrl) {
          return `
      <div style="${wrapperStyle}">
      </div>
    `;
        }

        let imageUrl = originalUrl;

        try {
          imageUrl = await compressImageUrl(originalUrl, 1600, 1600, 0.8);
        } catch (error) {
          console.error("HTML 이미지 압축 실패:", error);
        }

        return `
    <div data-component-id="${escapeAttribute(component.id)}" style="${wrapperStyle}">
      <img
        src="${imageUrl}"
        alt=""
        style="
          display:block;
          width:100%;
          height:auto;
          ${contentStyle}
        "
      />
    </div>
  `;
      }

      case "container": {
        const direction = component.props.direction ?? "column";

        const gap = component.props.gap ?? 8;

        const children = (
          await Promise.all(
            [...component.children]
              .sort((a, b) => a.order - b.order)
              .map((child) => componentToHtml(child)),
          )
        ).join("");

        return `
    <div
    data-component-id="${escapeAttribute(component.id)}"
      style="
        display:flex;
        flex-direction:${direction};
        gap:${gap}px;
        ${wrapperStyle}
      "
    >
      ${children}
    </div>
  `;
      }

      case "link": {
        const href = getLinkHref(component);

        const title = component.props.title || component.props.value || "링크";

        const target =
          component.props.linkType === "url" && component.props.newWindow
            ? ' target="_blank"'
            : "";

        const rel =
          component.props.linkType === "url" && component.props.newWindow
            ? ' rel="noopener noreferrer"'
            : "";

        return `
    <div
    data-component-id="${escapeAttribute(component.id)}"
    style="${escapeAttribute(wrapperStyle)}">
      <a
        href="${escapeAttribute(href)}"
        ${target}
        ${rel}
        style="${escapeAttribute(contentStyle)}"
      >
        ${escapeHtml(title)}
      </a>
    </div>
  `;
      }

      default:
        return "";
    }
  };

  const buildHtmlDocument = async () => {
    const body = (
      await Promise.all(
        [...components]
          .sort((a, b) => a.order - b.order)
          .map((component) => componentToHtml(component)),
      )
    ).join("");

    return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />

  <title>Exported Page</title>

  <style>
    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      padding: 16px;
      font-family: Arial, Helvetica, sans-serif;
    }

    img {
      max-width: 100%;
    }

    ${projectCustomCss}

    ${collectComponentCustomCss(components)}
  </style>
</head>

<body>
${body}
</body>
</html>`;
  };

  const downloadHtml = async () => {
    try {
      const html = await buildHtmlDocument();

      const blob = new Blob([html], {
        type: "text/html;charset=utf-8",
      });

      const url = URL.createObjectURL(blob);

      const anchor = document.createElement("a");

      anchor.href = url;
      anchor.download = "page.html";

      document.body.appendChild(anchor);

      anchor.click();
      anchor.remove();

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("HTML 저장 실패:", error);

      alert("HTML 저장 중 오류가 발생했습니다.");
    }
  };

  const validateProjectFile = (
    value: unknown,
  ):
    | {
        valid: true;
        components: LayoutComponent[];
        projectCustomCss: string;
      }
    | {
        valid: false;
        error: string;
      } => {
    if (!isObject(value)) {
      return {
        valid: false,
        error: "프로젝트 파일 형식이 올바르지 않습니다.",
      };
    }

    /*
     * 현재 파일 버전
     */
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

    /*
     * ID 중복 검사용
     */
    const ids = new Set<string>();

    const checkIds = (items: unknown[], path = "components"): string | null => {
      for (let index = 0; index < items.length; index++) {
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

    for (let index = 0; index < value.components.length; index++) {
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
        typeof value.projectCustomCss === "string"
          ? value.projectCustomCss
          : "",
    };
  };

  const saveProjectFile = async () => {
    await downloadProjectFile(
      history.present,
      projectCustomCss,
      setAutoSaveBaseline,
    );

    setLastSavedSnapshot(
      JSON.stringify({ components: history.present, projectCustomCss }),
    );
  };

  const loadProjectFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    /*
     * JSON 파일만 허용
     */
    if (!file.name.toLowerCase().endsWith(".json")) {
      alert("JSON 프로젝트 파일만 불러올 수 있습니다.");

      event.target.value = "";

      return;
    }

    /*
     * 너무 큰 JSON 방지
     * 필요하면 크기 조절 가능
     */
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

        /*
         * 빈 파일 방지
         */
        if (!text.trim()) {
          throw new Error("파일 내용이 비어 있습니다.");
        }

        /*
         * JSON 문법 검사
         */
        let parsed: unknown;

        try {
          parsed = JSON.parse(text);
        } catch {
          throw new Error("JSON 형식이 깨져 있습니다.");
        }

        /*
         * 프로젝트 구조 검사
         */
        const validation = validateProjectFile(parsed);

        if (!validation.valid) {
          throw new Error(validation.error);
        }

        /*
         * 모든 검증을 통과한 뒤에만
         * 실제 프로젝트 상태 변경
         */
        setHistory({
          past: [],
          present: validation.components,
          future: [],
        });

        setProjectCustomCss(validation.projectCustomCss);

        /*
         * 저장 여부 표시 기능을
         * 이미 넣었다면 유지
         */
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
        /*
         * 같은 파일 다시 선택 가능
         */
        event.target.value = "";
      }
    };

    reader.onerror = () => {
      alert("파일을 읽는 중 오류가 발생했습니다.");

      event.target.value = "";
    };

    reader.readAsText(file);
  };

  const renderComponent = (component: LayoutComponent) => {
    switch (component.type) {
      case "button": {
        const disabled = component.props.disabled ?? false;
        return (
          <button
            type="button"
            className="btn btn-primary w-100 mt-4"
            disabled={disabled ?? false}
            style={{
              ...component.contentStyle,
            }}
          >
            {component.props.title}
          </button>
        );
      }

      case "scrollToTopButton": {
        const disabled = component.props.disabled ?? false;
        return (
          <button
            type="button"
            className="btn btn-secondary rounded-circle"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            style={{
              ...component.contentStyle,
            }}
            disabled={disabled}
          >
            {component.props.title}
          </button>
        );
      }

      case "heading":
        {
          const style = {
            margin: 0,
            ...component.contentStyle,
          };

          switch (component.props.level) {
            case 1:
              return <h1 style={style}>{component.props.text}</h1>;

            case 2:
              return <h2 style={style}>{component.props.text}</h2>;

            case 3:
              return <h3 style={style}>{component.props.text}</h3>;

            case 4:
              return <h4 style={style}>{component.props.text}</h4>;

            case 5:
              return <h5 style={style}>{component.props.text}</h5>;

            case 6:
              return <h6 style={style}>{component.props.text}</h6>;
          }
        }
        break;

      case "textarea":
        return (
          <div
            style={{
              ...component.contentStyle,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {component.props.value ||
              component.props.placeholder ||
              "내용을 입력하세요."}
          </div>
        );

      case "quill":
        return (
          <div
            style={{
              ...component.contentStyle,
              wordBreak: "break-word",
            }}
            dangerouslySetInnerHTML={{
              __html:
                component.props.value ||
                `<span style="color:#6c757d">${
                  component.props.placeholder || "본문을 입력하세요."
                }</span>`,
            }}
          />
        );

      case "image": {
        const imageUrl = component.props.urls?.[0];

        return (
          <div
            style={{
              ...component.contentStyle,
              width: "100%",
            }}
          >
            {imageUrl ? (
              <img
                src={imageUrl}
                alt=""
                draggable={false}
                style={{
                  width: "100%",
                  height: "auto",
                  display: "block",
                }}
              />
            ) : (
              <div className="text-secondary">이미지 없음</div>
            )}
          </div>
        );
      }

      case "link": {
        const href = getLinkHref(component);

        return (
          <a
            href={href}
            target={
              component.props.linkType === "url" && component.props.newWindow
                ? "_blank"
                : undefined
            }
            rel={
              component.props.linkType === "url" && component.props.newWindow
                ? "noopener noreferrer"
                : undefined
            }
            style={{
              ...component.contentStyle,

              display: "inline-block",

              pointerEvents: component.props.disabled ? "none" : "auto",

              opacity: component.props.disabled ? 0.5 : 1,
            }}
          >
            {component.props.title || component.props.value || "링크"}
          </a>
        );
      }

      case "container":
        return null;
    }
  };

  const renderAddButton = (
    parentId: string | null,
    index: number,
    direction: ContainerDirection = "column",
  ) => {
    const isRow = direction === "row";

    const isActive =
      activeDropTarget?.area === "canvas" &&
      activeDropTarget?.parentId === parentId &&
      activeDropTarget?.index === index;

    return (
      <div
        onDragEnter={(e) => {
          handleDragOver(e, parentId, index, "canvas");
        }}
        onDragOver={(e) => {
          handleDragOver(e, parentId, index, "canvas");
        }}
        onDrop={(e) => {
          handleDrop(e, parentId, index);
        }}
        style={{
          display: "flex",

          flexDirection: isRow ? "column" : "row",

          alignItems: "center",
          justifyContent: "center",

          gap: 8,

          minHeight: isRow ? undefined : 40,

          minWidth: isRow ? 40 : undefined,

          flexShrink: 0,

          borderRadius: 8,

          background: isActive ? "rgba(13, 110, 253, 0.12)" : "transparent",

          outline: isActive ? "2px dashed #0d6efd" : "2px dashed transparent",
        }}
      >
        {!isRow && (
          <div
            style={{
              flex: 1,
              height: 1,
              backgroundColor: "#dee2e6",
            }}
          />
        )}

        <button
          type="button"
          className="btn btn-outline-primary btn-sm rounded-circle"
          style={{
            width: 30,
            height: 30,
            minWidth: 30,
            padding: 0,

            pointerEvents: draggingId ? "none" : "auto",
          }}
          onClick={(e) => {
            e.stopPropagation();

            openCreateModal(parentId, index);
          }}
        >
          +
        </button>

        {!isRow && (
          <div
            style={{
              flex: 1,
              height: 1,
              backgroundColor: "#dee2e6",
            }}
          />
        )}
      </div>
    );
  };

  const renderLayerDropZone = (
    parentId: string | null,
    index: number,
    depth: number,
  ) => {
    const isActive =
      activeDropTarget?.area === "layer" &&
      activeDropTarget?.parentId === parentId &&
      activeDropTarget?.index === index;

    return (
      <div
        onDragEnter={(e) => {
          handleDragOver(e, parentId, index, "layer");
        }}
        onDragOver={(e) => {
          handleDragOver(e, parentId, index, "layer");
        }}
        onDrop={(e) => {
          handleDrop(e, parentId, index);
        }}
        style={{
          marginLeft: depth * 14,

          height: isActive ? 16 : 8,

          marginTop: 1,
          marginBottom: 1,

          borderRadius: 4,

          background: isActive ? "rgba(13, 110, 253, 0.18)" : "transparent",

          borderTop: isActive ? "2px solid #0d6efd" : "2px solid transparent",

          transition: "height 80ms ease, background 80ms ease",
        }}
      />
    );
  };

  const renderDragHandle = (component: LayoutComponent) => {
    const isDragging = draggingId === component.id;

    return (
      <button
        type="button"
        className="component-drag-handle"
        onPointerDown={(e) => {
          handlePointerDragStart(e, component.id);
        }}
        onClick={(e) => {
          e.stopPropagation();
        }}
        disabled={!!layerSearch}
        title={
          layerSearch ? "검색 중에는 이동할 수 없습니다." : "드래그하여 이동"
        }
        style={{
          cursor: layerSearch
            ? "not-allowed"
            : isDragging
              ? "grabbing"
              : "grab",

          opacity: layerSearch ? 0.35 : 1,

          userSelect: "none",
          WebkitUserSelect: "none",

          touchAction: "none",

          width: 36,
          height: 36,

          padding: 0,

          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",

          border: 0,
          borderRadius: "50%",

          background: "rgba(255,255,255,.95)",

          fontWeight: 700,

          position: "relative",
          zIndex: 50,
        }}
      >
        ⋮⋮
      </button>
    );
  };

  const renderLayoutComponent = (component: LayoutComponent) => {
    const isDragging = draggingId === component.id;

    if (component.type === "container") {
      const children = [...component.children].sort(
        (a, b) => a.order - b.order,
      );

      const direction = component.props.direction ?? "column";
      const isRow = direction === "row";

      return (
        <div
          data-component-id={component.id}
          style={{
            opacity: isDragging ? 0.45 : 1,
            transition: "opacity 100ms ease",
          }}
        >
          {renderDragHandle(component)}

          <DivBox
            key={component.id}
            layout={component.layout}
            style={{
              ...component.style,
              outline:
                selectedComponentId === component.id
                  ? "2px solid #0d6efd"
                  : component.style?.outline,
              outlineOffset:
                selectedComponentId === component.id
                  ? "2px"
                  : component.style?.outlineOffset,
            }}
            onLayoutActionStart={beginHistoryAction}
            onLayoutActionEnd={endHistoryAction}
            onLayoutChange={(layout) => updateLayout(component.id, layout)}
            onEdit={() => editComponent(component.id)}
            onCopy={() => copyComponent(component.id)}
            onDelete={() => deleteComponent(component.id)}
          >
            <div
              style={{
                display: "flex",
                flexDirection: direction,
                gap: component.props.gap ?? 8,
                width: "100%",
                alignItems: isRow ? "stretch" : undefined,
                justifyContent: isRow ? "space-between" : undefined,
              }}
            >
              {renderAddButton(component.id, 0, direction)}

              {children.map((child, index) => (
                <div
                  key={child.id}
                  style={{
                    flex: isRow
                      ? child.layout?.width
                        ? undefined
                        : 1
                      : undefined,
                    width: isRow ? child.layout?.width : "100%",
                    minWidth: 0,
                  }}
                >
                  {renderLayoutComponent(child)}

                  {child.type !== "scrollToTopButton" &&
                    !isRow &&
                    renderAddButton(component.id, index + 1, direction)}
                </div>
              ))}

              {isRow &&
                renderAddButton(component.id, children.length, direction)}
            </div>
          </DivBox>
        </div>
      );
    }

    return (
      <div
        data-component-id={component.id}
        style={{
          opacity: isDragging ? 0.45 : 1,
          transition: "opacity 100ms ease",
        }}
      >
        {renderDragHandle(component)}

        <DivBox
          key={component.id}
          layout={component.layout}
          style={{
            ...component.style,
            outline:
              selectedComponentId === component.id
                ? "2px solid #0d6efd"
                : component.style?.outline,
            outlineOffset:
              selectedComponentId === component.id
                ? "2px"
                : component.style?.outlineOffset,
          }}
          onLayoutActionStart={beginHistoryAction}
          onLayoutActionEnd={endHistoryAction}
          onLayoutChange={(layout) => updateLayout(component.id, layout)}
          onEdit={() => editComponent(component.id)}
          onCopy={() => copyComponent(component.id)}
          onDelete={() => deleteComponent(component.id)}
        >
          {renderComponent(component)}
        </DivBox>
      </div>
    );
  };

  const highlightSearchText = (text: string, keyword: string) => {
    const search = keyword.trim();

    if (!search) {
      return text;
    }

    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const regex = new RegExp(`(${escaped})`, "gi");

    const parts = text.split(regex);

    return parts.map((part, index) => {
      const isMatch = part.toLowerCase() === search.toLowerCase();

      if (!isMatch) {
        return <React.Fragment key={index}>{part}</React.Fragment>;
      }

      return (
        <mark
          key={index}
          style={{
            padding: "0 2px",
            borderRadius: 3,
            background: "#fff3cd",
            color: "inherit",
          }}
        >
          {part}
        </mark>
      );
    });
  };

  const getComponentDisplayName = (component: LayoutComponent) => {
    if (component.type === "textarea") {
      return component.props.value || component.name || component.type;
    }

    if (component.type === "quill") {
      const plainText = component.props.value
        .replace(/<br\s*\/?>/gi, " ")
        .replace(/<\/p>/gi, " ")
        .replace(/<\/div>/gi, " ")
        .replace(/<[^>]*>/g, "")
        .replace(/&nbsp;/gi, " ")
        .replace(/\u00A0/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      return plainText || component.name || component.type;
    }

    if (component.type === "heading") {
      return component.props.text || component.name?.trim() || "Heading";
    }

    if (component.name?.trim()) {
      return component.name.trim();
    }

    if (
      "title" in component.props &&
      typeof component.props.title === "string" &&
      component.props.title.trim()
    ) {
      return `${component.props.title.trim()} (${component.type})`;
    }

    return component.type;
  };
  const renderLayerTree = (
    items: LayoutComponent[],
    parentId: string | null = null,
    depth = 0,
  ) => {
    const sorted = [...items].sort((a, b) => a.order - b.order);

    return (
      <>
        {/* 맨 앞 drop */}
        {renderLayerDropZone(parentId, 0, depth)}

        {sorted.map((component, index) => {
          const isContainer = component.type === "container";

          const isSelected = selectedComponentId === component.id;

          const isDragging = draggingId === component.id;

          const getLabel = () => {
            return getComponentDisplayName(component);
          };

          return (
            <React.Fragment key={component.id}>
              <div
                onClick={() => {
                  setSelectedComponentId(component.id);
                }}
                onDoubleClick={() => {
                  editComponent(component.id);
                }}
                style={{
                  marginLeft: depth * 14,

                  padding: "6px 8px",

                  borderRadius: 6,

                  display: "flex",
                  alignItems: "center",

                  gap: 6,

                  cursor: "pointer",

                  userSelect: "none",

                  opacity: isDragging ? 0.4 : 1,

                  background: isSelected
                    ? "rgba(13, 110, 253, 0.12)"
                    : "transparent",

                  border: isSelected
                    ? "1px solid rgba(13, 110, 253, 0.35)"
                    : "1px solid transparent",
                }}
              >
                {/* 레이어 drag handle */}
                <button
                  type="button"
                  className="layer-drag-handle"
                  onPointerDown={(e) => {
                    e.stopPropagation();

                    handlePointerDragStart(e, component.id);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  title="드래그하여 이동"
                  style={{
                    cursor: isDragging ? "grabbing" : "grab",

                    userSelect: "none",
                    WebkitUserSelect: "none",

                    touchAction: "none",

                    width: 36,
                    height: 36,

                    minWidth: 36,
                    minHeight: 36,

                    padding: 0,

                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",

                    border: 0,
                    borderRadius: "50%",

                    background: "transparent",

                    flexShrink: 0,

                    fontWeight: 700,

                    position: "relative",
                    zIndex: 50,
                  }}
                >
                  ⋮⋮
                </button>

                <span
                  style={{
                    width: 14,
                    textAlign: "center",

                    flexShrink: 0,
                  }}
                >
                  {isContainer ? "▾" : "•"}
                </span>

                <span
                  style={{
                    flex: 1,

                    minWidth: 0,

                    whiteSpace: "nowrap",

                    overflow: "hidden",

                    textOverflow: "ellipsis",

                    fontSize: 13,

                    fontWeight: isContainer ? 600 : 400,
                  }}
                >
                  <span
                    style={{
                      flex: 1,
                      minWidth: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      fontSize: 13,
                      fontWeight: isContainer ? 600 : 400,
                    }}
                  >
                    {highlightSearchText(getLabel() ?? "", layerSearch)}
                  </span>
                </span>

                <small
                  className="text-secondary"
                  style={{
                    fontSize: 9,
                    flexShrink: 0,
                  }}
                >
                  {highlightSearchText(component.type, layerSearch)}
                </small>
              </div>

              {/* Container 내부 */}
              {isContainer && (
                <div>
                  {renderLayerTree(component.children, component.id, depth + 1)}
                </div>
              )}

              {/* 현재 컴포넌트 뒤 drop */}
              {renderLayerDropZone(parentId, index + 1, depth)}
            </React.Fragment>
          );
        })}
      </>
    );
  };

  const renderAutoSaveRestoreModal = () => {
    if (!showRestoreModal || !restoreData) {
      return null;
    }

    const savedAt = new Date(restoreData.savedAt).toLocaleString();

    return (
      <>
        <div
          className="modal fade show"
          style={{
            display: "block",
            zIndex: 1060,
          }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">자동 저장본 복구</h5>
              </div>

              <div className="modal-body">
                <p className="mb-2">이전 작업의 자동 저장본이 있습니다.</p>

                <small className="text-secondary">저장 시간: {savedAt}</small>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-danger"
                  onClick={discardAutoSave}
                >
                  버리기
                </button>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={restoreAutoSave}
                >
                  복구
                </button>
              </div>
            </div>
          </div>
        </div>

        <div
          className="modal-backdrop fade show"
          style={{
            zIndex: 1055,
          }}
        />
      </>
    );
  };

  const buildComponentCustomCss = (component: LayoutComponent) => {
    const css = component.customCss?.trim();

    if (!css) {
      return "";
    }

    const selector = `[data-component-id="${component.id}"]`;

    return css.replaceAll("&", selector);
  };

  const collectComponentCustomCss = (items: LayoutComponent[]): string => {
    return items
      .flatMap((component) => {
        const own = buildComponentCustomCss(component);

        if (component.type === "container") {
          return [own, collectComponentCustomCss(component.children)];
        }

        return [own];
      })
      .filter(Boolean)
      .join("\n\n");
  };

  const componentCustomCss = collectComponentCustomCss(components);

  const openProjectCssModal = () => {
    setProjectCssDraft(projectCustomCss);

    setShowProjectCssModal(true);
  };

  const saveProjectCustomCss = () => {
    setProjectCustomCss(projectCssDraft);

    setShowProjectCssModal(false);
  };

  const renderProjectCssModal = () => {
    if (!showProjectCssModal) {
      return null;
    }

    return (
      <>
        <div
          className="modal fade show"
          style={{
            display: "block",
            zIndex: 1060,
          }}
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">프로젝트 Custom CSS</h5>

                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowProjectCssModal(false)}
                />
              </div>

              <div className="modal-body">
                <textarea
                  className="
                  form-control
                  font-monospace
                "
                  rows={20}
                  spellCheck={false}
                  value={projectCssDraft}
                  onChange={(e) => setProjectCssDraft(e.target.value)}
                  placeholder={`.builder-preview {
  background: #f8f9fa;
}

.builder-preview button {
  border-radius: 20px;
}`}
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowProjectCssModal(false)}
                >
                  취소
                </button>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={saveProjectCustomCss}
                >
                  적용
                </button>
              </div>
            </div>
          </div>
        </div>

        <div
          className="modal-backdrop fade show"
          style={{
            zIndex: 1055,
          }}
        />
      </>
    );
  };

  const renderTemplateSaveModal = () => {
    if (!showTemplateSaveModal) {
      return null;
    }

    const handleSave = () => {
      if (!templateFileName.trim()) {
        alert("템플릿 이름을 입력해주세요.");
        return;
      }

      if (templateSaveType === "project") {
        void saveProjectAsTemplateFile(templateFileName);
        return;
      }

      void saveSelectedComponentAsTemplateFile(templateFileName);
    };

    return (
      <>
        <div
          className="modal fade show"
          style={{
            display: "block",
            zIndex: 1060,
          }}
          tabIndex={-1}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {templateSaveType === "project"
                    ? "프로젝트 템플릿 저장"
                    : "컴포넌트 템플릿 저장"}
                </h5>

                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowTemplateSaveModal(false)}
                />
              </div>

              <div className="modal-body">
                <label className="form-label">템플릿 이름</label>

                <input
                  type="text"
                  className="form-control"
                  value={templateFileName}
                  onChange={(e) => setTemplateFileName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSave();
                    }
                  }}
                  autoFocus
                />

                <div className="form-text">
                  {sanitizeFileName(templateFileName)}
                  .pbtpl 로 저장됩니다.
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowTemplateSaveModal(false)}
                >
                  취소
                </button>

                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={!templateFileName.trim()}
                  onClick={handleSave}
                >
                  저장
                </button>
              </div>
            </div>
          </div>
        </div>

        <div
          className="modal-backdrop fade show"
          style={{
            zIndex: 1055,
          }}
          onClick={() => setShowTemplateSaveModal(false)}
        />
      </>
    );
  };

  const renderFavoritePanel = () => {
    if (!showFavoritePanel) {
      return null;
    }

    return (
      <aside
        className="editor-side-panel right"
        style={{
          display: showFavoritePanel ? "flex" : "none",

          flexDirection: "column",
        }}
      >
        {/* HEADER */}
        <div
          className="
          d-flex
          align-items-center
          justify-content-between
          border-bottom
          px-3
          py-2
        "
        >
          <strong>⭐ 즐겨찾기</strong>

          <button
            type="button"
            className="btn btn-sm border-0"
            onClick={() => setShowFavoritePanel(false)}
          >
            ×
          </button>
        </div>

        {/* LIST */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: 8,
          }}
        >
          {favoriteComponents.length === 0 ? (
            <div
              className="
              text-secondary
              text-center
            "
              style={{
                padding: 20,
                fontSize: 13,
              }}
            >
              등록된 즐겨찾기가 없습니다.
            </div>
          ) : (
            favoriteComponents.map((favorite) => (
              <div
                key={favorite.id}
                className="
                  border
                  rounded
                  p-2
                  mb-2
                "
              >
                <div
                  className="
                    d-flex
                    justify-content-between
                    align-items-center
                    mb-2
                  "
                >
                  <div
                    style={{
                      minWidth: 0,
                    }}
                  >
                    <strong
                      style={{
                        display: "block",

                        overflow: "hidden",

                        whiteSpace: "nowrap",

                        textOverflow: "ellipsis",

                        fontSize: 13,
                      }}
                    >
                      {favorite.name}
                    </strong>

                    <small className="text-secondary">
                      {favorite.component.type}
                    </small>
                  </div>

                  <button
                    type="button"
                    className="
                      btn
                      btn-sm
                      btn-outline-danger
                    "
                    onClick={() => removeFavoriteComponent(favorite.id)}
                    title="즐겨찾기 삭제"
                  >
                    ×
                  </button>
                </div>

                <button
                  type="button"
                  className="
                    btn
                    btn-sm
                    btn-warning
                    w-100
                  "
                  onClick={() => insertFavoriteComponent(favorite)}
                >
                  + 바로 추가
                </button>
              </div>
            ))
          )}
        </div>
      </aside>
    );
  };

  const renderCreateModal = () => {
    if (!showCreateModal) return null;

    return (
      <>
        <div
          className="modal fade show"
          style={{
            display: "block",
            zIndex: 1055,
          }}
          tabIndex={-1}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">컴포넌트 추가</h5>

                <button
                  type="button"
                  className="btn-close"
                  onClick={closeCreateModal}
                />
              </div>

              <div className="modal-body">
                {/* TYPE */}
                <div className="mb-3">
                  <label className="form-label">타입</label>

                  <select
                    className="form-select"
                    value={newType}
                    onChange={(e) =>
                      setNewType(e.target.value as ComponentType)
                    }
                  >
                    <option value="container">Container</option>
                    <option value="heading">Heading</option>
                    <option value="textarea">TextArea</option>
                    <option value="quill">Quill Editor</option>
                    <option value="button">Button</option>
                    <option value="scrollToTopButton">
                      Scroll To Top Button
                    </option>
                    <option value="image">Image</option>
                    <option value="link">Link</option>
                  </select>
                </div>

                {/* BUTTON */}
                {newType === "button" && (
                  <>
                    <div className="mb-3">
                      <label className="form-label">컴포넌트 이름</label>

                      <input
                        type="text"
                        className="form-control"
                        value={newComponentName}
                        onChange={(e) => setNewComponentName(e.target.value)}
                        placeholder={"예: 신청 버튼, 메인 이미지"}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">버튼 제목</label>

                      <input
                        type="text"
                        className="form-control"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="버튼"
                      />
                    </div>
                  </>
                )}

                {newType === "heading" && (
                  <>
                    <div className="mb-3">
                      <label className="form-label">제목</label>

                      <input
                        type="text"
                        className="form-control"
                        value={newHeadingText}
                        onChange={(e) => setNewHeadingText(e.target.value)}
                        placeholder="제목을 입력하세요"
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Heading Level</label>

                      <select
                        className="form-select"
                        value={newHeadingLevel}
                        onChange={(e) =>
                          setNewHeadingLevel(
                            Number(e.target.value) as 1 | 2 | 3 | 4 | 5 | 6,
                          )
                        }
                      >
                        <option value={1}>H1</option>
                        <option value={2}>H2</option>
                        <option value={3}>H3</option>
                        <option value={4}>H4</option>
                        <option value={5}>H5</option>
                        <option value={6}>H6</option>
                      </select>
                    </div>
                  </>
                )}

                {/* PLACEHOLDER */}
                {newType === "textarea" && (
                  <>
                    <div className="mb-3">
                      <label className="form-label">컴포넌트 이름</label>

                      <input
                        type="text"
                        className="form-control"
                        value={newComponentName}
                        onChange={(e) => setNewComponentName(e.target.value)}
                        placeholder={"예: 신청 버튼, 메인 이미지"}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Edit</label>

                      <input
                        type="text"
                        className="form-control"
                        value={newValue}
                        onChange={(e) => setNewValue(e.target.value)}
                        disabled={false}
                        placeholder="내용을 입력하세요."
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Placeholder</label>

                      <input
                        type="text"
                        className="form-control"
                        value={newPlaceholder}
                        onChange={(e) => setNewPlaceholder(e.target.value)}
                        placeholder="내용을 입력하세요."
                      />
                    </div>
                  </>
                )}

                {newType === "quill" && (
                  <>
                    <div className="mb-3">
                      <label className="form-label">컴포넌트 이름</label>

                      <input
                        type="text"
                        className="form-control"
                        value={newComponentName}
                        onChange={(e) => setNewComponentName(e.target.value)}
                        placeholder={"예: 신청 버튼, 메인 이미지"}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Edit</label>

                      <QuillEditorSimpleInput
                        data={newValue}
                        placeholder={newPlaceholder || "본문을 입력하세요."}
                        setData={setNewValue}
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Placeholder</label>

                      <input
                        type="text"
                        className="form-control"
                        value={newPlaceholder}
                        onChange={(e) => setNewPlaceholder(e.target.value)}
                        placeholder="내용을 입력하세요."
                      />
                    </div>
                  </>
                )}

                {/* IMAGE */}
                {newType === "image" && (
                  <>
                    <div className="mb-3">
                      <label className="form-label">컴포넌트 이름</label>

                      <input
                        type="text"
                        className="form-control"
                        value={newComponentName}
                        onChange={(e) => setNewComponentName(e.target.value)}
                        placeholder={"예: 신청 버튼, 메인 이미지"}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">이미지</label>

                      <input
                        type="file"
                        className="form-control"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0] ?? null;

                          if (!file) {
                            setNewImagePreviewUrl("");
                            return;
                          }

                          const imageUrl = URL.createObjectURL(file);
                          setNewImagePreviewUrl(imageUrl);
                        }}
                      />

                      {newImagePreviewUrl && (
                        <div className="mt-3">
                          <img
                            src={newImagePreviewUrl}
                            alt="미리보기"
                            style={{
                              display: "block",
                              maxWidth: "100%",
                              maxHeight: 300,
                              objectFit: "contain",
                              borderRadius: 8,
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* LINK */}
                {newType === "link" && (
                  <>
                    <div className="mb-3">
                      <label className="form-label">컴포넌트 이름</label>

                      <input
                        type="text"
                        className="form-control"
                        value={newComponentName}
                        onChange={(e) => setNewComponentName(e.target.value)}
                        placeholder={"예: 신청 버튼, 메인 이미지"}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">표시할 텍스트</label>

                      <input
                        type="text"
                        className="form-control"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="링크"
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">링크 종류</label>

                      <select
                        className="form-select"
                        value={newLinkType}
                        onChange={(e) => {
                          const type = e.target.value as LinkType;

                          setNewLinkType(type);
                          setNewValue("");

                          if (type !== "url") {
                            setNewLinkNewWindow(false);
                          }
                        }}
                      >
                        <option value="url">URL</option>
                        <option value="tel">전화</option>
                        <option value="email">이메일</option>
                      </select>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">
                        {newLinkType === "tel"
                          ? "전화번호"
                          : newLinkType === "email"
                            ? "이메일 주소"
                            : "URL"}
                      </label>

                      <input
                        type={
                          newLinkType === "email"
                            ? "email"
                            : newLinkType === "tel"
                              ? "tel"
                              : "text"
                        }
                        className="form-control"
                        value={newValue}
                        onChange={(e) => setNewValue(e.target.value)}
                        placeholder={
                          newLinkType === "tel"
                            ? "010-1234-5678"
                            : newLinkType === "email"
                              ? "example@email.com"
                              : "https://example.com"
                        }
                      />
                    </div>

                    {newLinkType === "url" && (
                      <div className="form-check mb-3">
                        <input
                          id="new-link-new-window"
                          type="checkbox"
                          className="form-check-input"
                          checked={newLinkNewWindow}
                          onChange={(e) =>
                            setNewLinkNewWindow(e.target.checked)
                          }
                        />

                        <label
                          htmlFor="new-link-new-window"
                          className="form-check-label"
                        >
                          새 창에서 열기
                        </label>
                      </div>
                    )}
                  </>
                )}

                {/* CONTAINER */}
                {newType === "container" && (
                  <div className="mb-3">
                    <label className="form-label">컴포넌트 이름</label>

                    <input
                      type="text"
                      className="form-control"
                      value={newComponentName}
                      onChange={(e) => setNewComponentName(e.target.value)}
                      placeholder={
                        newType === "container"
                          ? "예: 메인 배너, 소개 영역"
                          : "예: 신청 버튼, 메인 이미지"
                      }
                    />
                    <label className="form-label">배치 방향</label>

                    <div className="d-flex gap-3">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="containerDirection"
                          id="directionColumn"
                          value="column"
                          checked={newDirection === "column"}
                          onChange={() => setNewDirection("column")}
                        />

                        <label
                          className="form-check-label"
                          htmlFor="directionColumn"
                        >
                          세로
                        </label>
                      </div>

                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="containerDirection"
                          id="directionRow"
                          value="row"
                          checked={newDirection === "row"}
                          onChange={() => setNewDirection("row")}
                        />

                        <label
                          className="form-check-label"
                          htmlFor="directionRow"
                        >
                          가로
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeCreateModal}
                >
                  취소
                </button>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={createComponent}
                >
                  새로 만들기
                </button>
              </div>
            </div>
          </div>
        </div>

        <div
          className="modal-backdrop fade show"
          style={{
            zIndex: 1050,
          }}
          onClick={closeCreateModal}
        />
      </>
    );
  };

  const renderEditModal = () => {
    if (!showEditModal) {
      return null;
    }

    return (
      <>
        <div
          className="modal fade show"
          style={{
            display: "block",
            zIndex: 1055,
          }}
          tabIndex={-1}
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              {/* HEADER */}
              <div className="modal-header">
                <h5 className="modal-title">컴포넌트 수정</h5>

                <button
                  type="button"
                  className="btn-close"
                  onClick={closeEditModal}
                />
              </div>

              {/* TAB */}
              <div className="px-3 pt-3">
                <ul className="nav nav-tabs">
                  <li className="nav-item">
                    <button
                      type="button"
                      className={`nav-link ${
                        editTab === "basic" ? "active" : ""
                      }`}
                      onClick={() => setEditTab("basic")}
                    >
                      기본 설정
                    </button>
                  </li>

                  <li className="nav-item">
                    <button
                      type="button"
                      className={`nav-link ${
                        editTab === "style" ? "active" : ""
                      }`}
                      onClick={() => setEditTab("style")}
                    >
                      스타일
                    </button>
                  </li>

                  <li className="nav-item">
                    <button
                      type="button"
                      className={`nav-link ${
                        editTab === "css" ? "active" : ""
                      }`}
                      onClick={() => setEditTab("css")}
                    >
                      Custom CSS
                    </button>
                  </li>
                </ul>
              </div>

              {/* BODY */}
              <div className="modal-body">
                {editTab === "basic" && (
                  <>
                    {/* TYPE */}
                    <div className="mb-3">
                      <label className="form-label">타입</label>

                      <input
                        type="text"
                        className="form-control"
                        value={editType}
                        disabled
                      />
                    </div>

                    {/* BUTTON */}
                    {editType === "button" && (
                      <>
                        <div className="mb-3">
                          <label className="form-label">컴포넌트 이름</label>

                          <input
                            type="text"
                            className="form-control"
                            value={editComponentName}
                            onChange={(e) =>
                              setEditComponentName(e.target.value)
                            }
                            placeholder="예: 메인 배너"
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label">버튼 제목</label>

                          <input
                            type="text"
                            className="form-control"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            placeholder="버튼"
                          />
                        </div>
                      </>
                    )}

                    {editType === "heading" && (
                      <>
                        <div className="mb-3">
                          <label className="form-label">제목</label>

                          <input
                            type="text"
                            className="form-control"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                          />
                        </div>

                        <div className="mb-3">
                          <label className="form-label">Heading Level</label>

                          <select
                            className="form-select"
                            value={editHeadingLevel}
                            onChange={(e) =>
                              setEditHeadingLevel(
                                Number(e.target.value) as 1 | 2 | 3 | 4 | 5 | 6,
                              )
                            }
                          >
                            <option value={1}>H1</option>
                            <option value={2}>H2</option>
                            <option value={3}>H3</option>
                            <option value={4}>H4</option>
                            <option value={5}>H5</option>
                            <option value={6}>H6</option>
                          </select>
                        </div>
                      </>
                    )}

                    {/* TEXTAREA */}
                    {editType === "textarea" && (
                      <>
                        <div className="mb-3">
                          <label className="form-label">컴포넌트 이름</label>

                          <input
                            type="text"
                            className="form-control"
                            value={editComponentName}
                            onChange={(e) =>
                              setEditComponentName(e.target.value)
                            }
                            placeholder="예: 메인 배너"
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label">내용</label>

                          <textarea
                            className="form-control"
                            rows={5}
                            value={editValue}
                            style={editContentStyle}
                            onChange={(e) => setEditValue(e.target.value)}
                          />
                        </div>

                        <div className="mb-3">
                          <label className="form-label">Placeholder</label>

                          <input
                            type="text"
                            className="form-control"
                            value={editPlaceholder}
                            onChange={(e) => setEditPlaceholder(e.target.value)}
                            placeholder="내용을 입력하세요."
                          />
                        </div>
                      </>
                    )}

                    {/* QUILL */}
                    {editType === "quill" && (
                      <>
                        <div className="mb-3">
                          <label className="form-label">컴포넌트 이름</label>

                          <input
                            type="text"
                            className="form-control"
                            value={editComponentName}
                            onChange={(e) =>
                              setEditComponentName(e.target.value)
                            }
                            placeholder="예: 메인 배너"
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label">내용</label>

                          <QuillEditorSimpleInput
                            data={editValue}
                            // placeholder={
                            //   editPlaceholder || "본문을 입력하세요."
                            // }
                            // disabled={false}
                            // style={editContentStyle}
                            setData={setEditValue}
                          />
                        </div>

                        <div className="mb-3">
                          <label className="form-label">Placeholder</label>

                          <input
                            type="text"
                            className="form-control"
                            value={editPlaceholder}
                            onChange={(e) => setEditPlaceholder(e.target.value)}
                            placeholder="본문을 입력하세요."
                          />
                        </div>
                      </>
                    )}

                    {/* IMAGE */}
                    {editType === "image" && (
                      <>
                        <div className="mb-3">
                          <label className="form-label">컴포넌트 이름</label>

                          <input
                            type="text"
                            className="form-control"
                            value={editComponentName}
                            onChange={(e) =>
                              setEditComponentName(e.target.value)
                            }
                            placeholder="예: 메인 배너"
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label">이미지</label>

                          <input
                            type="file"
                            className="form-control"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0] ?? null;

                              if (!file) {
                                setEditImageUrl("");
                                setEditImagePreviewUrl("");
                                return;
                              }

                              const imageUrl = URL.createObjectURL(file);

                              setEditImageUrl(imageUrl);
                              setEditImagePreviewUrl(imageUrl);
                            }}
                          />

                          {editImagePreviewUrl && (
                            <div className="mt-3">
                              <img
                                src={editImagePreviewUrl}
                                alt="미리보기"
                                style={{
                                  display: "block",
                                  maxWidth: "100%",
                                  maxHeight: 300,
                                  objectFit: "contain",
                                  borderRadius: 8,
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {/* LINK */}
                    {editType === "link" && (
                      <>
                        <div className="mb-3">
                          <label className="form-label">컴포넌트 이름</label>

                          <input
                            type="text"
                            className="form-control"
                            value={editComponentName}
                            onChange={(e) =>
                              setEditComponentName(e.target.value)
                            }
                            placeholder="예: 메인 배너"
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label">표시할 텍스트</label>

                          <input
                            type="text"
                            className="form-control"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            placeholder="링크"
                          />
                        </div>

                        <div className="mb-3">
                          <label className="form-label">링크 종류</label>

                          <select
                            className="form-select"
                            value={editLinkType}
                            onChange={(e) => {
                              const type = e.target.value as LinkType;

                              setEditLinkType(type);
                              setEditValue("");

                              if (type !== "url") {
                                setEditLinkNewWindow(false);
                              }
                            }}
                          >
                            <option value="url">URL</option>
                            <option value="tel">전화</option>
                            <option value="email">이메일</option>
                          </select>
                        </div>

                        <div className="mb-3">
                          <label className="form-label">
                            {editLinkType === "tel"
                              ? "전화번호"
                              : editLinkType === "email"
                                ? "이메일 주소"
                                : "URL"}
                          </label>

                          <input
                            type={
                              editLinkType === "email"
                                ? "email"
                                : editLinkType === "tel"
                                  ? "tel"
                                  : "text"
                            }
                            className="form-control"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            placeholder={
                              editLinkType === "tel"
                                ? "010-1234-5678"
                                : editLinkType === "email"
                                  ? "example@email.com"
                                  : "https://example.com"
                            }
                          />
                        </div>

                        {editLinkType === "url" && (
                          <div className="form-check mb-3">
                            <input
                              id="edit-link-new-window"
                              type="checkbox"
                              className="form-check-input"
                              checked={editLinkNewWindow}
                              onChange={(e) =>
                                setEditLinkNewWindow(e.target.checked)
                              }
                            />

                            <label
                              htmlFor="edit-link-new-window"
                              className="form-check-label"
                            >
                              새 창에서 열기
                            </label>
                          </div>
                        )}
                      </>
                    )}

                    {/* CONTAINER */}
                    {editType === "container" && (
                      <>
                        <div className="mb-3">
                          <label className="form-label">컴포넌트 이름</label>

                          <input
                            type="text"
                            className="form-control"
                            value={editComponentName}
                            onChange={(e) =>
                              setEditComponentName(e.target.value)
                            }
                            placeholder="예: 메인 배너"
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label">배치 방향</label>

                          <div className="d-flex gap-3">
                            <div className="form-check">
                              <input
                                className="form-check-input"
                                type="radio"
                                name="editContainerDirection"
                                id="editDirectionColumn"
                                checked={editDirection === "column"}
                                onChange={() => setEditDirection("column")}
                              />

                              <label
                                className="form-check-label"
                                htmlFor="editDirectionColumn"
                              >
                                세로
                              </label>
                            </div>

                            <div className="form-check">
                              <input
                                className="form-check-input"
                                type="radio"
                                name="editContainerDirection"
                                id="editDirectionRow"
                                checked={editDirection === "row"}
                                onChange={() => setEditDirection("row")}
                              />

                              <label
                                className="form-check-label"
                                htmlFor="editDirectionRow"
                              >
                                가로
                              </label>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {/* DISABLED */}
                    {editType !== "container" && (
                      <div className="form-check mb-3">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id="editDisabled"
                          checked={editDisabled}
                          onChange={(e) => setEditDisabled(e.target.checked)}
                        />

                        <label
                          className="form-check-label"
                          htmlFor="editDisabled"
                        >
                          Disabled
                        </label>
                      </div>
                    )}
                  </>
                )}

                {editTab === "style" && (
                  <div className="row g-3">
                    {/* WIDTH */}
                    <div className="col-md-6">
                      <label className="form-label">Width</label>

                      <input
                        type="text"
                        className="form-control"
                        placeholder="100%, 500px, auto"
                        value={String(editStyle.width ?? "")}
                        onChange={(e) =>
                          setEditStyle((prev) => ({
                            ...prev,
                            width: e.target.value || undefined,
                          }))
                        }
                      />
                    </div>

                    {/* HEIGHT */}
                    <div className="col-md-6">
                      <label className="form-label">Height</label>

                      <input
                        type="text"
                        className="form-control"
                        placeholder="200px, auto"
                        value={String(editStyle.height ?? "")}
                        onChange={(e) =>
                          setEditStyle((prev) => ({
                            ...prev,
                            height: e.target.value || undefined,
                          }))
                        }
                      />
                    </div>

                    {/* MARGIN */}
                    <div className="col-md-6">
                      <label className="form-label">Margin</label>

                      <input
                        type="text"
                        className="form-control"
                        placeholder="16px"
                        value={String(editStyle.margin ?? "")}
                        onChange={(e) =>
                          setEditStyle((prev) => ({
                            ...prev,
                            margin: e.target.value || undefined,
                          }))
                        }
                      />
                    </div>

                    {/* PADDING */}
                    <div className="col-md-6">
                      <label className="form-label">Padding</label>

                      <input
                        type="text"
                        className="form-control"
                        placeholder="16px"
                        value={String(editStyle.padding ?? "")}
                        onChange={(e) =>
                          setEditStyle((prev) => ({
                            ...prev,
                            padding: e.target.value || undefined,
                          }))
                        }
                      />
                    </div>

                    {/* BACKGROUND */}
                    <div className="col-md-6">
                      <label className="form-label">배경색</label>

                      <input
                        type="color"
                        className="form-control form-control-color"
                        value={
                          typeof editStyle.backgroundColor === "string"
                            ? editStyle.backgroundColor
                            : "#ffffff"
                        }
                        onChange={(e) =>
                          setEditStyle((prev) => ({
                            ...prev,
                            backgroundColor: e.target.value,
                          }))
                        }
                      />
                    </div>

                    {/* COLOR */}
                    <div className="col-md-6">
                      <label className="form-label">글자색</label>

                      <input
                        type="color"
                        className="form-control form-control-color"
                        value={
                          typeof editContentStyle.color === "string"
                            ? editContentStyle.color
                            : "#000000"
                        }
                        onChange={(e) =>
                          setEditContentStyle((prev) => ({
                            ...prev,
                            color: e.target.value,
                          }))
                        }
                      />
                    </div>

                    {/* BORDER */}
                    <div className="col-md-6">
                      <label className="form-label">Border</label>

                      <input
                        type="text"
                        className="form-control"
                        placeholder="1px solid #ddd"
                        value={String(editStyle.border ?? "")}
                        onChange={(e) =>
                          setEditStyle((prev) => ({
                            ...prev,
                            border: e.target.value || undefined,
                          }))
                        }
                      />
                    </div>

                    {/* BORDER RADIUS */}
                    <div className="col-md-6">
                      <label className="form-label">Border Radius</label>

                      <input
                        type="text"
                        className="form-control"
                        placeholder="8px"
                        value={String(editStyle.borderRadius ?? "")}
                        onChange={(e) =>
                          setEditStyle((prev) => ({
                            ...prev,
                            borderRadius: e.target.value || undefined,
                          }))
                        }
                      />
                    </div>

                    {/* FONT SIZE */}
                    <div className="col-md-6">
                      <label className="form-label">Font Size</label>

                      <input
                        type="text"
                        className="form-control"
                        placeholder="16px"
                        value={String(editContentStyle.fontSize ?? "")}
                        onChange={(e) =>
                          setEditContentStyle((prev) => ({
                            ...prev,
                            fontSize: e.target.value || undefined,
                          }))
                        }
                      />
                    </div>

                    {/* TEXT ALIGN */}
                    <div className="col-md-6">
                      <label className="form-label">Text Align</label>

                      <select
                        className="form-select"
                        value={String(editContentStyle.textAlign ?? "")}
                        onChange={(e) =>
                          setEditContentStyle((prev) => ({
                            ...prev,

                            textAlign:
                              e.target.value === ""
                                ? undefined
                                : (e.target
                                    .value as CSSProperties["textAlign"]),
                          }))
                        }
                      >
                        <option value="">기본</option>

                        <option value="left">Left</option>

                        <option value="center">Center</option>

                        <option value="right">Right</option>
                      </select>
                    </div>

                    {/* RESET */}
                    <div className="col-12">
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => {
                          setEditStyle({});
                          setEditContentStyle({});
                        }}
                      >
                        스타일 초기화
                      </button>
                    </div>
                  </div>
                )}
                {editTab === "css" && (
                  <div>
                    <label className="form-label">컴포넌트 Custom CSS</label>

                    <textarea
                      className="form-control font-monospace"
                      rows={14}
                      value={editCustomCss}
                      onChange={(e) => setEditCustomCss(e.target.value)}
                      placeholder={`& {
  background: #111;
  color: white;
}

&:hover {
  opacity: 0.9;
}

& button {
  border-radius: 20px;
}`}
                      spellCheck={false}
                    />

                    <div className="form-text">
                      &amp; 는 현재 컴포넌트를 의미합니다.
                    </div>
                  </div>
                )}
              </div>

              {/* FOOTER */}
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeEditModal}
                >
                  취소
                </button>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={saveEditedComponent}
                >
                  저장
                </button>
              </div>
            </div>
          </div>
        </div>

        <div
          className="modal-backdrop fade show"
          style={{
            zIndex: 1050,
          }}
          onClick={closeEditModal}
        />
      </>
    );
  };

  const renderLayerPanel = () => {
    if (!showLayerPanel) return null;

    return (
      <aside
        onDragOver={(e) => {
          if (draggingIdRef.current) {
            e.preventDefault();
          }
        }}
        onDrop={(e) => {
          // 실제 drop은 내부 drop zone에서만 처리
          e.preventDefault();
        }}
        className="editor-side-panel left"
        style={{
          display: showLayerPanel ? "flex" : "none",

          flexDirection: "column",
        }}
      >
        <div
          className="
          d-flex
          align-items-center
          justify-content-between
          border-bottom
          px-3
          py-2
        "
        >
          <strong>레이어</strong>

          <button
            type="button"
            className="btn btn-sm border-0"
            onClick={() => setShowLayerPanel(false)}
          >
            ×
          </button>
        </div>

        <div className="p-2 border-bottom">
          <div className="input-group input-group-sm">
            <span className="input-group-text">🔍</span>

            <input
              type="text"
              className="form-control"
              value={layerSearch}
              onChange={(e) => setLayerSearch(e.target.value)}
              placeholder="이름 또는 타입 검색"
            />

            {layerSearch && (
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setLayerSearch("")}
                aria-label="검색 초기화"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* TREE */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: 8,
          }}
        >
          {filteredLayerComponents.length > 0 ? (
            renderLayerTree(filteredLayerComponents, null, 0)
          ) : (
            <div
              className="text-secondary text-center"
              style={{
                padding: 20,
                fontSize: 13,
              }}
            >
              {layerSearch
                ? `"${layerSearch}" 검색 결과가 없습니다.`
                : "컴포넌트가 없습니다."}
            </div>
          )}
        </div>

        {selectedComponentId && (
          <div className="border-top p-2">
            <button
              type="button"
              className="btn btn-primary btn-sm w-100"
              onClick={() => {
                editComponent(selectedComponentId);
              }}
            >
              선택한 컴포넌트 편집
            </button>
            <button
              type="button"
              className="btn btn-outline-warning btn-sm w-100"
              onClick={addSelectedComponentToFavorites}
            >
              ⭐ 즐겨찾기 등록
            </button>
          </div>
        )}
      </aside>
    );
  };

  const renderProjectToolbar = () => {
    return (
      <div
        className="d-flex flex-wrap align-items-center gap-2 mb-3 p-2 border rounded bg-light"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 1000,
        }}
      >
        <div className="d-flex align-items-center gap-2 pe-2 border-end">
          <div className="form-check mb-0">
            <input
              id="snap-enabled"
              type="checkbox"
              className="form-check-input"
              checked={snapEnabled}
              onChange={(e) => setSnapEnabled(e.target.checked)}
            />

            <label htmlFor="snap-enabled" className="form-check-label">
              스냅
            </label>
          </div>

          <select
            className="form-select form-select-sm"
            style={{
              width: 82,
            }}
            value={gridSize}
            disabled={!snapEnabled}
            onChange={(e) => setGridSize(Number(e.target.value))}
          >
            <option value={5}>5px</option>
            <option value={10}>10px</option>
            <option value={20}>20px</option>
            <option value={25}>25px</option>
            <option value={50}>50px</option>
          </select>
        </div>

        <div className="d-flex align-items-center gap-1 pe-2 border-end">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={openProjectCssModal}
            title="프로젝트 Custom CSS"
          >
            CSS
          </button>

          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            disabled={!canUndo}
            onClick={undo}
            title="Ctrl + Z"
          >
            ↶ Undo
          </button>

          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            disabled={!canRedo}
            onClick={redo}
            title="Ctrl + Y"
          >
            ↷ Redo
          </button>

          <button
            type="button"
            className="btn btn-outline-warning btn-sm"
            onClick={() => setShowFavoritePanel((prev) => !prev)}
          >
            ⭐ 즐겨찾기
            {favoriteComponents.length > 0 && (
              <span className="ms-1">{favoriteComponents.length}</span>
            )}
          </button>
        </div>

        <div className="d-flex align-items-center gap-1 pe-2 border-end">
          <div
            style={{
              position: "relative",
            }}
          >
            <button
              type="button"
              className="btn btn-success btn-sm"
              onClick={saveProjectFile}
              title="Ctrl + S"
            >
              💾 프로젝트 저장
            </button>

            {hasUnsavedChanges && (
              <span
                title="저장되지 않은 변경사항 있음"
                style={{
                  position: "absolute",
                  top: -4,
                  right: -4,

                  width: 9,
                  height: 9,

                  backgroundColor: "#dc3545",

                  borderRadius: "50%",

                  border: "2px solid white",

                  pointerEvents: "none",
                }}
              />
            )}
          </div>

          <label
            className="btn btn-outline-success btn-sm mb-0"
            style={{
              cursor: "pointer",
            }}
          >
            📂 불러오기
            <input
              type="file"
              accept=".json,application/json"
              onChange={loadProjectFile}
              style={{
                display: "none",
              }}
            />
          </label>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => {
              void downloadHtml();
            }}
          >
            HTML 다운로드
          </button>
        </div>

        <div className="d-flex align-items-center gap-1 pe-2 border-end">
          <button
            type="button"
            className="btn btn-outline-primary btn-sm"
            onClick={() => {
              setTemplateSaveType("project");

              setTemplateFileName("새 프로젝트 템플릿");

              setShowTemplateSaveModal(true);
            }}
          >
            전체 템플릿
          </button>

          <button
            type="button"
            className="btn btn-outline-primary btn-sm"
            disabled={!selectedComponentId}
            onClick={() => {
              setTemplateSaveType("component");

              const component = selectedComponentId
                ? findComponentRecursive(history.present, selectedComponentId)
                : undefined;

              setTemplateFileName(
                component?.name?.trim() || "새 컴포넌트 템플릿",
              );

              setShowTemplateSaveModal(true);
            }}
          >
            선택 템플릿
          </button>

          <label
            className="btn btn-outline-primary btn-sm mb-0"
            style={{
              cursor: "pointer",
            }}
          >
            템플릿 불러오기
            <input
              type="file"
              accept=".pbtpl,.json,application/json"
              onChange={loadTemplateFile}
              style={{
                display: "none",
              }}
            />
          </label>
        </div>

        <div
          className="ms-auto d-flex align-items-center"
          style={{
            minHeight: 31,
          }}
        >
          {lastAutoSavedAt ? (
            <small
              className="text-secondary"
              title={new Date(lastAutoSavedAt).toLocaleString()}
            >
              자동 저장{" "}
              {new Date(lastAutoSavedAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </small>
          ) : (
            <small className="text-secondary">자동 저장 대기</small>
          )}
        </div>
      </div>
    );
  };

  const sortedComponents = [...components].sort((a, b) => a.order - b.order);

  const showAnySidePanel = showLayerPanel || showFavoritePanel;

  return (
    <>
      <style>{`
      .layer-tree-item:hover {
        background: #f1f3f5;
      }

      .editor-side-panel {
        position: fixed;
        top: 0;
        bottom: 0;

        width: 280px;

        background: #fff;

        z-index: 1200;

        box-shadow:
          0 0 16px rgba(0, 0, 0, 0.08);
      }

      .editor-side-panel.left {
        left: 0;

        border-right:
          1px solid #dee2e6;
      }

      .editor-side-panel.right {
        right: 0;

        border-left:
          1px solid #dee2e6;
      }

      .editor-panel-backdrop {
        display: none;
      }

      .editor-main {
        transition:
          margin-left 160ms ease,
          margin-right 160ms ease;
      }

      .editor-mobile-panel-buttons {
        display: none;
      }

      @media (max-width: 767.98px) {
        .editor-side-panel {
          width: min(88vw, 340px);

          z-index: 1300;

          box-shadow:
            0 0 24px rgba(0, 0, 0, 0.18);
        }

        .editor-panel-backdrop {
          display: block;

          position: fixed;

          inset: 0;

          background:
            rgba(0, 0, 0, 0.35);

          z-index: 1290;
        }

        .editor-main {
          margin-left: 0 !important;
          margin-right: 0 !important;

          padding: 8px !important;
        }

        .editor-mobile-panel-buttons {
          display: flex;

          position: fixed;

          left: 12px;
          right: 12px;
          bottom: 12px;

          z-index: 1250;

          gap: 8px;

          pointer-events: none;
        }

        .editor-mobile-panel-buttons > button {
          pointer-events: auto;

          box-shadow:
            0 3px 12px rgba(0, 0, 0, 0.18);
        }

        .builder-preview {
          padding-bottom: 70px;
        }

        .desktop-layer-open-button {
          display: none !important;
        }
      }

      @media (min-width: 768px) {
        .editor-mobile-panel-buttons {
          display: none !important;
        }
      }

      .component-drag-handle,
      .layer-drag-handle {
        touch-action: none;
        -webkit-user-select: none;
        user-select: none;
      }

      @media (max-width: 767.98px) {
        .component-drag-handle,
        .layer-drag-handle {
          width: 44px !important;
          height: 44px !important;

          min-width: 44px !important;
          min-height: 44px !important;

          font-size: 20px;

          background: rgba(255,255,255,.96) !important;

          box-shadow:
            0 2px 8px rgba(0,0,0,.16);
        }
      }
    `}</style>
      {/* 프로젝트 전체 CSS */}
      <style>{projectCustomCss}</style>
      {/* 컴포넌트별 CSS */}
      <style>{componentCustomCss}</style>
      {showAnySidePanel && (
        <div
          className="editor-panel-backdrop"
          onClick={() => {
            setShowLayerPanel(false);
            setShowFavoritePanel(false);
          }}
        />
      )}
      {renderLayerPanel()}
      {!showLayerPanel && (
        <button
          type="button"
          className="
          btn
          btn-dark
          btn-sm
          desktop-layer-open-button
        "
          onClick={() => {
            setShowFavoritePanel(false);
            setShowLayerPanel(true);
          }}
          style={{
            position: "fixed",

            left: 16,
            top: 16,

            zIndex: 1100,
          }}
        >
          레이어
        </button>
      )}
      <div
        className="
        position-relative
        editor-main
      "
        style={{
          minHeight: "100vh",

          padding: 16,

          marginLeft: showLayerPanel ? 280 : 0,

          marginRight: showFavoritePanel ? 300 : 0,
        }}
      >
        {renderProjectToolbar()}

        <div
          className="builder-preview"
          style={{
            minHeight: "100vh",
          }}
        >
          {/* 최상위 맨 앞 + */}
          {renderAddButton(null, 0, "column")}

          {sortedComponents.map((component, index) => (
            <div key={component.id} data-component-id={component.id}>
              {renderLayoutComponent(component)}

              {component.type !== "scrollToTopButton" &&
                renderAddButton(null, index + 1, "column")}
            </div>
          ))}
        </div>
      </div>
      <div className="editor-mobile-panel-buttons">
        <button
          type="button"
          className="btn btn-dark btn-sm"
          onClick={() => {
            setShowFavoritePanel(false);
            setShowLayerPanel((prev) => !prev);
          }}
          style={{
            flex: 1,
          }}
        >
          레이어
        </button>

        <button
          type="button"
          className="
          btn
          btn-warning
          btn-sm
        "
          onClick={() => {
            setShowLayerPanel(false);
            setShowFavoritePanel((prev) => !prev);
          }}
          style={{
            flex: 1,
          }}
        >
          ⭐ 즐겨찾기
          {favoriteComponents.length > 0 && <> ({favoriteComponents.length})</>}
        </button>
      </div>
      {renderAutoSaveRestoreModal()}
      {renderTemplateSaveModal()}
      {renderProjectCssModal()}
      {renderFavoritePanel()}
      {renderCreateModal()}
      {renderEditModal()}
    </>
  );
}

export default LayoutEditor;
