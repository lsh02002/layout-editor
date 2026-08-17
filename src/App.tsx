import { useState, type CSSProperties } from "react";

import DivBox from "./components/layout/DivBox";
import ConfirmButton from "./components/form/ConfirmButton";
import TextAreaInput from "./components/form/TextAreaInput";
import QuillEditorInput from "./components/form/QuillEditorInput";

import type { ComponentLayout, LayoutComponent } from "./types/types";

import { data } from "./data/data";
import ImageInput from "./components/form/ImageInput";

type ComponentType = LayoutComponent["type"];

function App() {
  const [components, setComponents] = useState<LayoutComponent[]>(() => data);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [insertAfterOrder, setInsertAfterOrder] = useState<number | null>(null);

  const [newType, setNewType] = useState<ComponentType>("textarea");
  const [newTitle, setNewTitle] = useState("");
  const [newPlaceholder, setNewPlaceholder] = useState("");

  const [imageFiles, setImageFiles] = useState<Record<string, File[]>>({});

  const updateComponent = (
    id: string,
    newProps: Partial<LayoutComponent["props"]>,
  ) => {
    setComponents((prev) =>
      prev.map((component) => {
        if (component.id !== id) {
          return component;
        }

        return {
          ...component,
          props: {
            ...component.props,
            ...newProps,
          },
        } as LayoutComponent;
      }),
    );
  };

  const updateStyle = (id: string, newStyle: CSSProperties) => {
    setComponents((prev) =>
      prev.map((component) =>
        component.id === id
          ? {
              ...component,
              style: {
                ...component.style,
                ...newStyle,
              },
            }
          : component,
      ),
    );
  };

  const updateLayout = (id: string, newLayout: Partial<ComponentLayout>) => {
    setComponents((prev) =>
      prev.map((component) =>
        component.id === id
          ? {
              ...component,
              layout: {
                ...component.layout,
                ...newLayout,
              },
            }
          : component,
      ),
    );
  };

  const editComponent = (id: string) => {
    const component = components.find((component) => component.id === id);

    if (!component) return;

    console.log("edit", component);

    updateStyle(id, {
      backgroundColor: "#f8f9fa",
    });

    updateLayout(id, {
      width: 500,
    });
  };

  const copyComponent = (id: string) => {
    setComponents((prev) => {
      const target = prev.find((component) => component.id === id);

      if (!target) {
        return prev;
      }

      const copied = {
        ...target,
        id: crypto.randomUUID(),
        order: target.order + 1,
        props: {
          ...target.props,
        },
        style: target.style
          ? {
              ...target.style,
            }
          : undefined,
        layout: target.layout
          ? {
              ...target.layout,
            }
          : undefined,
      } as LayoutComponent;

      return [...prev, copied]
        .sort((a, b) => a.order - b.order)
        .map((component, index) => ({
          ...component,
          order: index,
        }));
    });
  };

  const deleteComponent = (id: string) => {
    setComponents((prev) =>
      prev
        .filter((component) => component.id !== id)
        .map((component, index) => ({
          ...component,
          order: index,
        })),
    );
  };

  const openCreateModal = (afterOrder: number) => {
    setInsertAfterOrder(afterOrder);

    setNewType("textarea");
    setNewTitle("");
    setNewPlaceholder("");

    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setInsertAfterOrder(null);
  };

  const createComponent = () => {
    if (insertAfterOrder === null) {
      return;
    }

    let newComponent: LayoutComponent;

    switch (newType) {
      case "button":
        newComponent = {
          id: crypto.randomUUID(),
          type: "button",
          order: insertAfterOrder + 1,
          props: {
            title: newTitle || "버튼",
            disabled: false,
            action: {
              type: "none",
              payload: null,
            },
          },
        };
        break;

      case "textarea":
        newComponent = {
          id: crypto.randomUUID(),
          type: "textarea",
          order: insertAfterOrder + 1,
          props: {
            value: "",
            rows: 3,
            placeholder: newPlaceholder || "내용을 입력하세요.",
            disabled: false,
          },
        };
        break;

      case "quill":
        newComponent = {
          id: crypto.randomUUID(),
          type: "quill",
          order: insertAfterOrder + 1,
          props: {
            value: "",
            placeholder: newPlaceholder || "내용을 입력하세요.",
            disabled: false,
          },
        };
        break;

      case "image":
        newComponent = {
          id: crypto.randomUUID(),
          type: "image",
          order: insertAfterOrder + 1,
          props: {
            urls: [],
            maxCount: 5,
            disabled: false,
          },
        };
        break;
    }

    setComponents((prev) => {
      const next = prev.map((component) =>
        component.order > insertAfterOrder
          ? {
              ...component,
              order: component.order + 1,
            }
          : component,
      );

      return [...next, newComponent].sort((a, b) => a.order - b.order);
    });

    closeCreateModal();
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
            setPreviewUrls={(updater) => {
              setComponents((prev) =>
                prev.map((item) => {
                  if (item.id !== component.id || item.type !== "image") {
                    return item;
                  }

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
                }),
              );
            }}
          />
        );

      default:
        return null;
    }
  };

  return (
    <>
      <div
        className="position-relative"
        style={{
          minHeight: "100vh",
          padding: "16px",
        }}
      >
        {[...components]
          .sort((a, b) => a.order - b.order)
          .map((component) => (
            <div key={component.id}>
              <DivBox
                layout={component.layout}
                style={component.style}
                onLayoutChange={(layout) => updateLayout(component.id, layout)}
                onEdit={() => editComponent(component.id)}
                onCopy={() => copyComponent(component.id)}
                onDelete={() => deleteComponent(component.id)}
              >
                {renderComponent(component)}
              </DivBox>

              <div className="text-center my-2">
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => openCreateModal(component.order)}
                >
                  +
                </button>
              </div>
            </div>
          ))}
      </div>

      {showCreateModal && (
        <>
          <div
            className="modal fade show"
            style={{
              display: "block",
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
                  <div className="mb-3">
                    <label className="form-label">타입</label>

                    <select
                      className="form-select"
                      value={newType}
                      onChange={(e) =>
                        setNewType(e.target.value as ComponentType)
                      }
                    >
                      <option value="textarea">TextArea</option>

                      <option value="quill">Quill Editor</option>

                      <option value="button">Button</option>

                      <option value="image">Image</option>
                    </select>
                  </div>

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
            onClick={closeCreateModal}
          />
        </>
      )}
    </>
  );
}

export default App;
