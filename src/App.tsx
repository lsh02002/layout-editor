import {
  useRef,
  useState,
  type CSSProperties,
  type SetStateAction,
} from "react";

import DivBox from "./components/layout/DivBox";
import ConfirmButton from "./components/form/ConfirmButton";
import TextAreaInput from "./components/form/TextAreaInput";
import QuillEditorInput from "./components/form/QuillEditorInput";
import ImageInput from "./components/form/ImageInput";

import type {
  ComponentLayout,
  LayoutComponent,
  ComponentType,
  ContainerDirection,
  HistoryState,
  ComponentsUpdater,
  EditorSnapshot,
} from "./types/types";

import { data } from "./data/data";
import ScrollToTopButton from "./components/form/ScrollToTopButton";
import QuillEditorSimpleInput from "./components/form/QuillEditorSimpleInput";

function App() {
  const [history, setHistory] = useState<HistoryState>(() => ({
    past: [],
    present: {
      components: data,
      imageFiles: {},
    },
    future: [],
  }));

  // const [imageFiles, setImageFiles] = useState<Record<string, File[]>>({});

  const [showCreateModal, setShowCreateModal] = useState(false);

  const [newType, setNewType] = useState<ComponentType>("textarea");

  const [newTitle, setNewTitle] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newPlaceholder, setNewPlaceholder] = useState("");

  const [newDirection, setNewDirection] =
    useState<ContainerDirection>("column");

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

  const [insertTarget, setInsertTarget] = useState<{
    parentId: string | null;
    index: number;
  } | null>(null);

  const quillEditingRef = useRef<Record<string, boolean>>({});

  const components = history.present.components;
  const imageFiles = history.present.imageFiles;

  const commitHistory = (updater: (prev: EditorSnapshot) => EditorSnapshot) => {
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
        typeof updater === "function"
          ? updater(prev.present.components)
          : updater;

      const nextSnapshot: EditorSnapshot = {
        ...prev.present,
        components: nextComponents,
      };

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

  const updateComponentRecursive = (
    items: LayoutComponent[],
    id: string,
    newProps: Partial<LayoutComponent["props"]>,
  ): LayoutComponent[] => {
    return items.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          props: {
            ...item.props,
            ...newProps,
          },
        } as LayoutComponent;
      }

      if (item.type === "container") {
        return {
          ...item,
          children: updateComponentRecursive(item.children, id, newProps),
        };
      }

      return item;
    });
  };

  const updateComponent = (
    id: string,
    newProps: Partial<LayoutComponent["props"]>,
    recordHistory = false,
  ) => {
    setComponents(
      (prev) => updateComponentRecursive(prev, id, newProps),
      recordHistory,
    );
  };

  const updateQuillComponent = (id: string, value: string) => {
    setHistory((prev) => {
      const nextComponents = updateComponentRecursive(
        prev.present.components,
        id,
        { value },
      );

      const nextSnapshot: EditorSnapshot = {
        ...prev.present,
        components: nextComponents,
      };

      // 이번 Quill 편집 세션에서 최초 변경
      if (!quillEditingRef.current[id]) {
        quillEditingRef.current[id] = true;

        return {
          past: [...prev.past, prev.present],
          present: nextSnapshot,
          future: [],
        };
      }

      // 이후 타이핑은 history에 계속 추가하지 않음
      return {
        ...prev,
        present: nextSnapshot,
        future: [],
      };
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

      case "image":
        setEditTitle("");
        setEditValue("");
        setEditPlaceholder("");
        setEditDirection("column");
        break;

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
    commitHistory((prev) => {
      const nextImageFiles = {
        ...prev.imageFiles,
      };

      delete nextImageFiles[id];

      return {
        components: deleteRecursive(prev.components, id),

        imageFiles: nextImageFiles,
      };
    });
  };

  const cloneComponent = (
    component: LayoutComponent,
    copiedImageFiles: Record<string, File[]>,
    currentImageFiles: Record<string, File[]>,
  ): LayoutComponent => {
    const newId = crypto.randomUUID();

    if (component.type === "image") {
      const files = currentImageFiles[component.id];

      if (files) {
        copiedImageFiles[newId] = [...files];
      }

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

        children: component.children.map((child) =>
          cloneComponent(child, copiedImageFiles, currentImageFiles),
        ),
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
      const copiedImageFiles: Record<string, File[]> = {};

      const copyRecursive = (items: LayoutComponent[]): LayoutComponent[] => {
        const result: LayoutComponent[] = [];

        for (const item of items) {
          if (item.id === id) {
            result.push(item);

            result.push(
              cloneComponent(item, copiedImageFiles, prev.imageFiles),
            );

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

      const nextComponents = copyRecursive(prev.components);

      return {
        components: nextComponents,

        imageFiles: {
          ...prev.imageFiles,
          ...copiedImageFiles,
        },
      };
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
            urls: [],
            maxCount: 4,
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
        nextComponents = [...prev.components];

        nextComponents.splice(insertTarget.index, 0, newComponent);

        nextComponents = normalizeOrder(nextComponents);
      } else {
        nextComponents = insertIntoRecursive(
          prev.components,
          insertTarget.parentId,
          insertTarget.index,
          newComponent,
        );
      }

      return {
        ...prev,
        components: nextComponents,
      };
    });

    closeCreateModal();
  };

  const updateImagePreviewUrls = (
    id: string,
    updater: SetStateAction<string[]>,
  ) => {
    setComponents((prev) => {
      const recursive = (items: LayoutComponent[]): LayoutComponent[] => {
        return items.map((item) => {
          if (item.id === id && item.type === "image") {
            const nextUrls =
              typeof updater === "function"
                ? updater(item.props.urls)
                : updater;

            return {
              ...item,

              props: {
                ...item.props,
                urls: nextUrls,
              },
            };
          }

          if (item.type === "container") {
            return {
              ...item,

              children: recursive(item.children),
            };
          }

          return item;
        });
      };

      return recursive(prev);
    });
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
          <ConfirmButton
            title={component.props.title}
            disabled={component.props.disabled}
            style={component.contentStyle}
            onClick={() => console.log("Button clicked!", component.id)}
          />
        );

      case "scrollToTopButton":
        return (
          <ScrollToTopButton
            title={component.props.title}
            disabled={component.props.disabled}
            zIndex={component.props.zIndex}
          />
        );

      case "textarea":
        return (
          <TextAreaInput
            name={component.id}
            data={component.props.value}
            rows={component.props.rows}
            placeholder={component.props.placeholder}
            disabled={component.props.disabled}
            style={component.contentStyle}
            setData={(value) =>
              updateComponent(component.id, {
                value,
              })
            }
          />
        );

      case "quill":
        return (
          <QuillEditorInput
            name={component.id}
            data={component.props.value}
            placeholder={component.props.placeholder}
            disabled={component.props.disabled}
            style={component.contentStyle}
            setData={(value) => updateQuillComponent(component.id, value)}
            onClose={() => {
              quillEditingRef.current[component.id] = false;
            }}
          />
        );

      case "image":
        return (
          <ImageInput
            name={component.id}
            disabled={component.props.disabled}
            maxCount={component.props.maxCount}
            data={imageFiles[component.id] ?? []}
            setData={(files) => {
              commitHistory((prev) => ({
                ...prev,

                imageFiles: {
                  ...prev.imageFiles,
                  [component.id]: files,
                },
              }));
            }}
            previewUrls={component.props.urls}
            setPreviewUrls={(updater) =>
              updateImagePreviewUrls(component.id, updater)
            }
          />
        );

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

    return (
      <div
        className={
          isRow
            ? "d-flex align-items-center"
            : "d-flex align-items-center gap-2 my-2"
        }
        style={
          isRow
            ? {
                alignSelf: "stretch",
              }
            : undefined
        }
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

  const renderLayoutComponent = (component: LayoutComponent) => {
    if (component.type === "container") {
      const children = [...component.children].sort(
        (a, b) => a.order - b.order,
      );

      const direction = component.props.direction ?? "column";

      const isRow = direction === "row";

      return (
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
            {/*
             * 맨 앞 +
             */}
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

                {/*
                 * column일 때는
                 * 자식 아래에 +
                 */}
                {/* 특수한 경우임!!! */}
                {child.type !== "scrollToTopButton" &&
                  !isRow &&
                  renderAddButton(component.id, index + 1, direction)}
              </div>
            ))}

            {/*
             * row일 때는 마지막 오른쪽에 +
             */}
            {isRow && renderAddButton(component.id, children.length, direction)}
          </div>
        </DivBox>
      );
    }

    return (
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
                {/* ======================== */}
                {/* 기본 설정 */}
                {/* ======================== */}

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

                {/* ======================== */}
                {/* 스타일 */}
                {/* ======================== */}

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
