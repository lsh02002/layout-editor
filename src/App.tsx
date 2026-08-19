import { useState, type CSSProperties } from "react";

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

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<{
    parentId: string | null;
    index: number;
  } | null>(null);

  const components = history.present;

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

    // 컨테이너를 자기 자신 또는 자기 하위 컨테이너 안으로 넣는 순환 구조 방지
    if (
      targetParentId !== null &&
      containsComponent(draggedComponent, targetParentId)
    ) {
      return;
    }

    let adjustedTargetIndex = targetIndex;

    // 같은 부모 안에서 아래쪽으로 이동할 때는 먼저 제거되므로 인덱스 보정
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

  const renderComponent = (component: LayoutComponent) => {
    switch (component.type) {
      case "button":
        return (
          <div style={component.contentStyle}>{component.props.title}</div>
        );

      case "scrollToTopButton":
        return (
          <div style={component.contentStyle}>{component.props.title}</div>
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
    const isDragOver =
      dragOverTarget?.parentId === parentId && dragOverTarget.index === index;

    return (
      <div
        className={
          isRow
            ? "d-flex align-items-center"
            : "d-flex align-items-center gap-2 my-2"
        }
        onDragOver={(e) => {
          if (!draggingId) return;

          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
          setDragOverTarget({ parentId, index });
        }}
        onDragLeave={(e) => {
          const nextTarget = e.relatedTarget as Node | null;

          if (!nextTarget || !e.currentTarget.contains(nextTarget)) {
            setDragOverTarget((prev) =>
              prev?.parentId === parentId && prev.index === index ? null : prev,
            );
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();

          const componentId =
            draggingId || e.dataTransfer.getData("text/plain");

          if (componentId) {
            moveComponent(componentId, parentId, index);
          }

          setDraggingId(null);
          setDragOverTarget(null);
        }}
        style={{
          ...(isRow
            ? {
                alignSelf: "stretch",
                minWidth: draggingId ? 34 : undefined,
              }
            : undefined),

          minHeight: draggingId ? (isRow ? 48 : 34) : undefined,
          padding: draggingId ? (isRow ? "0 4px" : "4px 0") : undefined,
          borderRadius: 8,
          background: isDragOver ? "rgba(13, 110, 253, 0.12)" : undefined,
          outline: isDragOver ? "2px dashed #0d6efd" : undefined,
          transition: "background 120ms ease, outline 120ms ease",
        }}
      >
        {!isRow && (
          <div
            style={{
              flex: 1,
              height: isDragOver ? 2 : 1,
              backgroundColor: isDragOver ? "#0d6efd" : "#dee2e6",
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
              height: isDragOver ? 2 : 1,
              backgroundColor: isDragOver ? "#0d6efd" : "#dee2e6",
            }}
          />
        )}
      </div>
    );
  };

  const renderDragHandle = (component: LayoutComponent) => (
    <div
      draggable
      onDragStart={(e) => {
        e.stopPropagation();
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", component.id);
        setDraggingId(component.id);
        setDragOverTarget(null);
      }}
      onDragEnd={() => {
        setDraggingId(null);
        setDragOverTarget(null);
      }}
      title="드래그해서 이동"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        marginBottom: 6,
        padding: "3px 8px",
        border: "1px solid #dee2e6",
        borderRadius: 6,
        background: "#fff",
        color: "#6c757d",
        cursor: draggingId === component.id ? "grabbing" : "grab",
        userSelect: "none",
        fontSize: 12,
      }}
    >
      <span aria-hidden="true">⋮⋮</span>
      <span>이동</span>
    </div>
  );

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
            transition: "opacity 120ms ease",
          }}
        >
          {renderDragHandle(component)}

          <DivBox
            key={component.id}
            layout={component.layout}
            style={component.style}
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
          transition: "opacity 120ms ease",
        }}
      >
        {renderDragHandle(component)}

        <DivBox
          key={component.id}
          layout={component.layout}
          style={component.style}
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

  const sortedComponents = [...components].sort((a, b) => a.order - b.order);

  return (
    <>
      <div
        className="position-relative"
        style={{
          minHeight: "100vh",
          padding: 16,
        }}
      >
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
        </div>
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
