import React, { useRef, useState, type CSSProperties } from "react";

import DivBox from "./components/layout/DivBox";
import type {
  ComponentLayout,
  LayoutComponent,
  ComponentType,
  ContainerDirection,
  HistoryState,
  ComponentsUpdater,
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

  const components = history.present;

  const getComponentSearchText = (component: LayoutComponent) => {
    const type = component.type.toLowerCase();

    let name = "";

    switch (component.type) {
      case "button":
        name = component.props.title ?? "";
        break;

      case "textarea":
        name = [component.props.value, component.props.placeholder]
          .filter(Boolean)
          .join(" ");
        break;

      case "quill":
        name = [
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
        name = "image 이미지";
        break;

      case "container":
        name = "container 컨테이너";
        break;

      case "scrollToTopButton":
        name = [component.props.title, "scrollToTop", "scroll top", "맨위로"]
          .filter(Boolean)
          .join(" ");
        break;
    }

    return `${type} ${name}`.toLowerCase();
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
    setComponents((prev) => updateLayoutRecursive(prev, id, newLayout));
  };

  const editComponent = (id: string) => {
    const component = findComponentRecursive(components, id);

    if (!component) return;

    setEditingComponentId(component.id);
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
    setNewTitle("");
    setNewValue("");
    setNewPlaceholder("");
    setNewDirection("column");

    setNewImagePreviewUrl("");

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

      case "container":
        return {
          id,
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
    } catch (error) {
      console.error("프로젝트 저장 실패:", error);

      alert("프로젝트 저장 중 오류가 발생했습니다.");
    }
  };

  const loadProjectFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const text = String(reader.result ?? "");

        const parsed = JSON.parse(text) as {
          version?: number;

          components?: LayoutComponent[];

          savedAt?: string;
        };

        if (!Array.isArray(parsed.components)) {
          throw new Error("올바른 프로젝트 파일이 아닙니다.");
        }

        setHistory({
          past: [],

          present: parsed.components,

          future: [],
        });
      } catch (error) {
        console.error("프로젝트 불러오기 실패:", error);

        alert("프로젝트 파일을 불러올 수 없습니다.");
      } finally {
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
            switch (component.type) {
              case "button":
                return component.props.title || "Button";

              case "textarea":
                return component.props.value?.slice(0, 20) || "TextArea";

              case "quill": {
                const text = component.props.value
                  ?.replace(/<[^>]*>/g, " ")
                  .replace(/\s+/g, " ")
                  .trim();

                return text?.slice(0, 30) || "Quill";
              }

              case "image":
                return "Image";

              case "scrollToTopButton":
                return "Scroll To Top";

              case "container":
                return "Container";
            }
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
                    {highlightSearchText(getLabel(), layerSearch)}
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
                  </select>
                </div>

                {/* BUTTON */}
                {newType === "button" && (
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
                )}

                {/* PLACEHOLDER */}
                {newType === "textarea" && (
                  <>
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
                )}

                {/* CONTAINER */}
                {newType === "container" && (
                  <div className="mb-3">
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
                    )}

                    {/* TEXTAREA */}
                    {editType === "textarea" && (
                      <>
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
                    )}

                    {/* CONTAINER */}
                    {editType === "container" && (
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

        <button
          type="button"
          className="btn btn-success"
          onClick={saveProjectFile}
        >
          프로젝트 저장
        </button>

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
      {renderCreateModal()}
      {renderEditModal()}
    </>
  );
}

export default App;
