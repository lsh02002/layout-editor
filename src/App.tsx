import { useState, type CSSProperties } from "react";

import DivBox from "./components/layout/DivBox";
import ConfirmButton from "./components/form/ConfirmButton";
import TextAreaInput from "./components/form/TextAreaInput";
import QuillEditorInput from "./components/form/QuillEditorInput";

import type { ComponentLayout, LayoutComponent } from "./types/types";

import { data } from "./data/data";

function App() {
  const [components, setComponents] = useState<LayoutComponent[]>(() => data);

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

    // 테스트
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

      const copied: LayoutComponent = {
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
            disabled={component.props.disabled}
            setData={(value) =>
              updateComponent(component.id, {
                value,
              })
            }
          />
        );

      case "image":
        return null;

      default:
        return null;
    }
  };

  return (
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
        ))}
    </div>
  );
}

export default App;
