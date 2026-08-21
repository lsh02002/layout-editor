import React, { useRef, useState, type CSSProperties } from "react";

import DivBox from "./components/layout/DivBox";
import type {
  ComponentLayout,
  LayoutComponent,
  ComponentType,
  ContainerDirection,
  HistoryState,
  ComponentsUpdater,
  LinkType,
  TemplateFile,
} from "./types/types";

import { data } from "./data/data";
import QuillEditorSimpleInput from "./components/form/QuillEditorSimpleInput";

function App() {
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

  const [editTab, setEditTab] = useState<"basic" | "style">("basic");

  const [editImageUrl, setEditImageUrl] = useState("");

  const [editImagePreviewUrl, setEditImagePreviewUrl] = useState("");

  const [editLinkType, setEditLinkType] = useState<LinkType>("url");
  const [editLinkNewWindow, setEditLinkNewWindow] = useState(false);

  const [editComponentName, setEditComponentName] = useState("");

  const [snapEnabled, setSnapEnabled] = useState(true);
  const [gridSize, setGridSize] = useState(10);

  const [lastSavedSnapshot, setLastSavedSnapshot] = useState(() =>
    JSON.stringify(history.present),
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

  const historyActionRef = useRef<{
    active: boolean;
    snapshot: LayoutComponent[] | null;
  }>({
    active: false,
    snapshot: null,
  });

  const VALID_COMPONENT_TYPES = [
    "button",
    "textarea",
    "quill",
    "image",
    "link",
    "container",
    "scrollToTopButton",
  ] as const;

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

  const hasUnsavedChanges =
    JSON.stringify(history.present) !== lastSavedSnapshot;

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

  const filterLayerComponents = (
    items: LayoutComponent[],
    search: string,
  ): LayoutComponent[] => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return items;
    }

    const filterRecursive = (
      component: LayoutComponent,
    ): LayoutComponent | null => {
      const selfMatched = getComponentSearchText(component).includes(keyword);

      /*
       * 일반 컴포넌트
       */
      if (component.type !== "container") {
        return selfMatched ? component : null;
      }

      /*
       * Container
       *
       * 자식도 재귀적으로 검색
       */
      const filteredChildren = component.children
        .map(filterRecursive)
        .filter((child): child is LayoutComponent => child !== null);

      /*
       * Container 자신이 검색되거나
       * 자식 중 검색된 것이 있으면
       * Container 유지
       */
      if (selfMatched || filteredChildren.length > 0) {
        return {
          ...component,

          /*
           * 부모 자체가 검색된 경우에는
           * 모든 자식을 보여주는 게 편함.
           *
           * 자식만 검색된 경우에는
           * 검색된 자식만 보여줌.
           */
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

  const commitHistory = (
    updater: (prev: LayoutComponent[]) => LayoutComponent[],
  ) => {
    setHistory((prev) => {
      const next = updater(prev.present);

      return {
        past: [...prev.past, prev.present],
        present: next,
        future: [],
      };
    });
  };

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

  const normalizeOrder = (items: LayoutComponent[]): LayoutComponent[] => {
    return items.map((item, index) => ({
      ...item,
      order: index,
    }));
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

    // if (typeof value.name !== "string" || value.name.trim() === "") {
    //   return `${path}: name이 올바르지 않습니다.`;
    // }

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

  const handleDragStart = (
    e: React.DragEvent<HTMLElement>,
    componentId: string,
  ) => {
    draggingIdRef.current = componentId;

    setDraggingId(componentId);

    e.dataTransfer.effectAllowed = "move";

    e.dataTransfer.setData("text/plain", componentId);
  };

  const handleDragEnd = () => {
    draggingIdRef.current = null;

    setDraggingId(null);
    setActiveDropTarget(null);
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
                  props: {
                    ...component.props,
                    title: editTitle.trim() || "버튼",
                    disabled: editDisabled,
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

              name: editComponentName.trim() || component.name,

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

            zIndex: 100,

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

  const undo = () => {
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
  };

  const redo = () => {
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
  };

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

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
        return `<div style="${escapeAttribute(wrapperStyle)}"><button type="button" style="${escapeAttribute(contentStyle)}">${escapeHtml(component.props.title)}</button></div>`;

      case "scrollToTopButton":
        return `<button type="button" onclick="window.scrollTo({top:0,behavior:'smooth'})" style="${escapeAttribute(`${wrapperStyle};${contentStyle};display:flex;align-items:center;justify-content:center;border-radius:50%;color:#fff;background-color:#6c757d;border:1px solid #6c757d;padding:0.375rem 0.75rem;font-size:1rem;line-height:1.5;text-align:center;cursor:pointer;user-select:none;`)}">${escapeHtml(component.props.title)}</button>`;

      case "textarea": {
        const text =
          component.props.value ||
          component.props.placeholder ||
          "내용을 입력하세요.";

        return `<div style="${escapeAttribute(wrapperStyle)}"><div style="${escapeAttribute(`white-space:pre-wrap;word-break:break-word;${contentStyle}`)}">${escapeHtml(text)}</div></div>`;
      }

      case "quill": {
        const html =
          component.props.value ||
          `<span style="color:#6c757d">${escapeHtml(component.props.placeholder || "본문을 입력하세요.")}</span>`;

        return `<div style="${escapeAttribute(wrapperStyle)}"><div style="${escapeAttribute(`word-break:break-word;${contentStyle}`)}">${html}</div></div>`;
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
    <div style="${wrapperStyle}">
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
    <div style="${escapeAttribute(wrapperStyle)}">
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
        // 이미지
        if (component.type === "image") {
          let exportImageUrl = component.props.urls?.[0] ?? "";

          if (exportImageUrl) {
            try {
              exportImageUrl = await compressImageUrl(
                exportImageUrl,
                1600, // 최대 width
                1600, // 최대 height
                0.8, // 품질
              );
            } catch (error) {
              console.error("이미지 압축 실패:", error);

              // 압축 실패하면 원본 사용
              exportImageUrl = component.props.urls?.[0] ?? "";
            }
          }

          return {
            ...component,

            props: {
              ...component.props,

              // 컴포넌트당 1개만 유지
              urls: exportImageUrl ? [exportImageUrl] : [],

              maxCount: 1,
            },
          };
        }

        // 컨테이너 내부도 재귀 처리
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

  const validateProjectFile = (
    value: unknown,
  ):
    | {
        valid: true;
        components: LayoutComponent[];
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
    };
  };

  const saveProjectFile = async () => {
    try {
      const savedComponents = await convertComponentsForSave(history.present);

      const projectData = {
        version: 1,

        components: savedComponents,

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

      setLastSavedSnapshot(JSON.stringify(history.present));
    } catch (error) {
      console.error("프로젝트 저장 실패:", error);

      alert("프로젝트 저장 중 오류가 발생했습니다.");
    }
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

        /*
         * 저장 여부 표시 기능을
         * 이미 넣었다면 유지
         */
        setLastSavedSnapshot(JSON.stringify(validation.components));

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
      case "button":
        return (
          <div style={component.contentStyle}>{component.props.title}</div>
        );

      case "scrollToTopButton":
        return (
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            style={{
              ...component.contentStyle,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "50%",
              color: "#fff",
              backgroundColor: "#6c757d",
              border: "1px solid #6c757d",
              padding: "0.375rem 0.75rem",
              fontSize: "1rem",
              lineHeight: "1.5",
              textAlign: "center",
              cursor: "pointer",
              userSelect: "none",
            }}
          >
            {component.props.title}
          </button>
        );

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
    return (
      <span
        draggable={!layerSearch}
        onDragStart={(e) => {
          if (layerSearch) {
            e.preventDefault();
            return;
          }

          handleDragStart(e, component.id);
        }}
        onDragEnd={handleDragEnd}
        style={{
          cursor: layerSearch
            ? "not-allowed"
            : draggingId === component.id
              ? "grabbing"
              : "grab",

          opacity: layerSearch ? 0.35 : 1,

          userSelect: "none",
        }}
      >
        ⋮⋮
      </span>
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
            return component.name?.trim() || component.type;
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
                <span
                  draggable
                  onDragStart={(e) => {
                    e.stopPropagation();

                    handleDragStart(e, component.id);
                  }}
                  onDragEnd={handleDragEnd}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  style={{
                    cursor: isDragging ? "grabbing" : "grab",

                    userSelect: "none",

                    width: 18,

                    textAlign: "center",

                    flexShrink: 0,

                    fontWeight: 700,
                  }}
                  title="드래그하여 이동"
                >
                  ⋮⋮
                </span>

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
                            placeholder={
                              editPlaceholder || "본문을 입력하세요."
                            }
                            disabled={false}
                            style={editContentStyle}
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
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: 280,
          background: "#ffffff",
          borderRight: "1px solid #dee2e6",
          zIndex: 1100,
          display: "flex",
          flexDirection: "column",
          boxShadow: "2px 0 8px rgba(0,0,0,0.05)",
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
          </div>
        )}
      </aside>
    );
  };

  const renderProjectToolbar = () => {
    return (
      <div className="d-flex gap-2 mb-3">
        <div className="d-flex align-items-center gap-2">
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
              width: 90,
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
        <button
          type="button"
          className="btn btn-outline-secondary"
          disabled={!canUndo}
          onClick={undo}
        >
          ↶ Undo
        </button>

        <button
          type="button"
          className="btn btn-outline-secondary"
          disabled={!canRedo}
          onClick={redo}
        >
          ↷ Redo
        </button>

        <div
          style={{
            position: "relative",
            display: "inline-block",
          }}
        >
          <button
            type="button"
            className="btn btn-success"
            onClick={saveProjectFile}
          >
            프로젝트 저장
          </button>

          {hasUnsavedChanges && (
            <span
              style={{
                position: "absolute",
                top: -4,
                right: -4,

                width: 10,
                height: 10,

                backgroundColor: "#dc3545",
                borderRadius: "50%",

                border: "2px solid white",

                pointerEvents: "none",
              }}
              title="저장되지 않은 변경사항 있음"
            />
          )}
        </div>

        <label
          className="btn btn-outline-success mb-0"
          style={{ cursor: "pointer" }}
        >
          프로젝트 불러오기
          <input
            type="file"
            accept=".json,application/json"
            onChange={loadProjectFile}
            style={{ display: "none" }}
          />
        </label>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            void downloadHtml();
          }}
        >
          HTML 다운로드
        </button>

        <label className="btn btn-outline-primary mb-0">
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
        <button
          type="button"
          className="btn btn-outline-primary"
          onClick={() => {
            setTemplateSaveType("project");
            setTemplateFileName("새 프로젝트 템플릿");
            setShowTemplateSaveModal(true);
          }}
        >
          전체 템플릿 저장
        </button>

        <button
          type="button"
          className="btn btn-outline-primary"
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
          선택 템플릿 저장
        </button>

        <label className="btn btn-outline-primary mb-0">
          템플릿 불러오기
          <input
            type="file"
            accept=".pbtpl,.json"
            onChange={loadTemplateFile}
            style={{
              display: "none",
            }}
          />
        </label>
      </div>
    );
  };

  const sortedComponents = [...components].sort((a, b) => a.order - b.order);

  return (
    <>
      <style>{`
  .layer-tree-item:hover {
    background: #f1f3f5;
  }
    `}</style>
      {renderLayerPanel()}
      {!showLayerPanel && (
        <button
          type="button"
          className="btn btn-dark btn-sm"
          onClick={() => setShowLayerPanel(true)}
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
        className="position-relative"
        style={{
          minHeight: "100vh",
          padding: 16,

          marginLeft: showLayerPanel ? 280 : 0,

          transition: "margin-left 160ms ease",
        }}
      >
        {renderProjectToolbar()}
        {/* 최상위 맨 앞 + */}
        {renderAddButton(null, 0, "column")}

        {sortedComponents.map((component, index) => (
          <div key={component.id}>
            {renderLayoutComponent(component)}

            {/* 특수한 경우임!!! */}
            {component.type !== "scrollToTopButton" &&
              renderAddButton(null, index + 1, "column")}
          </div>
        ))}
      </div>
      {renderTemplateSaveModal()}
      {renderCreateModal()}
      {renderEditModal()}
    </>
  );
}

export default App;
