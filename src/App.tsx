import { useState, type CSSProperties, type SetStateAction } from "react";

import DivBox from "./components/layout/DivBox";
import ConfirmButton from "./components/form/ConfirmButton";
import TextAreaInput from "./components/form/TextAreaInput";
import QuillEditorInput from "./components/form/QuillEditorInput";
import ImageInput from "./components/form/ImageInput";

import type { ComponentLayout, LayoutComponent } from "./types/types";

import { data } from "./data/data";
import ScrollToTopButton from "./components/form/ScrollToTopButton";

type ComponentType = LayoutComponent["type"];
type ContainerDirection = "row" | "column";

function App() {
  const [components, setComponents] = useState<LayoutComponent[]>(() => data);

  const [imageFiles, setImageFiles] = useState<Record<string, File[]>>({});

  const [showCreateModal, setShowCreateModal] = useState(false);

  const [newType, setNewType] = useState<ComponentType>("textarea");

  const [newTitle, setNewTitle] = useState("");
  const [newPlaceholder, setNewPlaceholder] = useState("");

  const [newDirection, setNewDirection] =
    useState<ContainerDirection>("column");

  const [insertTarget, setInsertTarget] = useState<{
    parentId: string | null;
    index: number;
  } | null>(null);

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
  ) => {
    setComponents((prev) => updateComponentRecursive(prev, id, newProps));
  };

  const updateStyleRecursive = (
    items: LayoutComponent[],
    id: string,
    newStyle: CSSProperties,
  ): LayoutComponent[] => {
    return items.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          style: {
            ...item.style,
            ...newStyle,
          },
        };
      }

      if (item.type === "container") {
        return {
          ...item,
          children: updateStyleRecursive(item.children, id, newStyle),
        };
      }

      return item;
    });
  };

  const updateStyle = (id: string, newStyle: CSSProperties) => {
    setComponents((prev) => updateStyleRecursive(prev, id, newStyle));
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

    if (!component) {
      return;
    }

    console.log("edit", component);

    // 테스트용
    updateStyle(id, {
      backgroundColor: "#f8f9fa",
    });
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
    setComponents((prev) => deleteRecursive(prev, id));

    setImageFiles((prev) => {
      const next = { ...prev };

      delete next[id];

      return next;
    });
  };

  const cloneComponent = (
    component: LayoutComponent,
    copiedImageFiles: Record<string, File[]>,
  ): LayoutComponent => {
    const newId = crypto.randomUUID();

    // 이미지라면 File[]도 새 id로 복사
    if (component.type === "image") {
      const files = imageFiles[component.id];

      if (files) {
        copiedImageFiles[newId] = [...files];
      }

      return {
        ...component,
        id: newId,

        props: {
          ...component.props,

          // 배열도 별도 복사
          urls: [...component.props.urls],
        },

        style: component.style ? { ...component.style } : undefined,

        layout: component.layout ? { ...component.layout } : undefined,
      };
    }

    // container는 children까지 재귀 복사
    if (component.type === "container") {
      return {
        ...component,
        id: newId,

        props: {
          ...component.props,
        },

        style: component.style ? { ...component.style } : undefined,

        layout: component.layout ? { ...component.layout } : undefined,

        children: component.children.map((child) =>
          cloneComponent(child, copiedImageFiles),
        ),
      };
    }

    return {
      ...component,
      id: newId,

      props: {
        ...component.props,
      },

      style: component.style ? { ...component.style } : undefined,

      layout: component.layout ? { ...component.layout } : undefined,
    } as LayoutComponent;
  };

  const copyComponent = (id: string) => {
    const copiedImageFiles: Record<string, File[]> = {};

    setComponents((prev) => {
      const copyRecursive = (items: LayoutComponent[]): LayoutComponent[] => {
        const result: LayoutComponent[] = [];

        for (const item of items) {
          if (item.id === id) {
            result.push(item);

            result.push(cloneComponent(item, copiedImageFiles));

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

    setImageFiles((prev) => ({
      ...prev,
      ...copiedImageFiles,
    }));
  };

  const openCreateModal = (parentId: string | null, index: number) => {
    setInsertTarget({
      parentId,
      index,
    });

    setNewType("textarea");
    setNewTitle("");
    setNewPlaceholder("");
    setNewDirection("column");

    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setInsertTarget(null);
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
            value: "",
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
            value: "",

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
    if (!insertTarget) {
      return;
    }

    const newComponent = makeNewComponent();

    setComponents((prev) => {
      // 최상위 삽입
      if (insertTarget.parentId === null) {
        const next = [...prev];

        next.splice(insertTarget.index, 0, newComponent);

        return normalizeOrder(next);
      }

      // container 내부 삽입
      return insertIntoRecursive(
        prev,
        insertTarget.parentId,
        insertTarget.index,
        newComponent,
      );
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

  const renderComponent = (component: LayoutComponent) => {
    switch (component.type) {
      case "button":
        return (
          <ConfirmButton
            title={component.props.title}
            disabled={component.props.disabled}
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
            setData={(value) =>
              updateComponent(component.id, {
                value,
              })
            }
          />
        );

      case "image":
        return (
          <ImageInput
            name={component.id}
            disabled={component.props.disabled}
            maxCount={component.props.maxCount}
            data={imageFiles[component.id] ?? []}
            setData={(files) =>
              setImageFiles((prev) => ({
                ...prev,

                [component.id]: files,
              }))
            }
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
                {!isRow && renderAddButton(component.id, index + 1, direction)}
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
                {(newType === "textarea" || newType === "quill") && (
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
        {/* 최상위 맨 앞 + */}
        {renderAddButton(null, 0, "column")}

        {sortedComponents.map((component, index) => (
          <div key={component.id}>
            {renderLayoutComponent(component)}

            {renderAddButton(null, index + 1, "column")}
          </div>
        ))}
      </div>
      {renderCreateModal()}
    </>
  );
}

export default App;
