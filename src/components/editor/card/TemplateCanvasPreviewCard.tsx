import { memo } from "react";
import type { LayoutComponent } from "../../../types/types";

import CanvasComponentContent from "../../canvas/CanvasComponentContent";

type Props = {
  components: LayoutComponent[];
};

function TemplateCanvasPreviewCard({ components }: Props) {
  const safeComponents = Array.isArray(components) ? components : [];

  const renderComponent = (component: LayoutComponent): React.ReactNode => {
    if (component.type === "container") {
      const direction = component.props.direction ?? "column";

      const children = [...component.children].sort(
        (a, b) => a.order - b.order,
      );
      return (
        <div
          key={component.id}
          style={{
            ...component.style,
            display: "flex",
            flexDirection: direction,
            gap: component.props.gap ?? 8,
            position:
              component.layout?.position === "absolute"
                ? "absolute"
                : "relative",
            left:
              component.layout?.position === "absolute"
                ? (component.layout?.x ?? 0)
                : undefined,
            top:
              component.layout?.position === "absolute"
                ? (component.layout?.y ?? 0)
                : undefined,
          }}
        >
          {children.map(renderComponent)}
        </div>
      );
    }

    if (component.type === "grid") {
      const children = [...component.children].sort(
        (a, b) => a.order - b.order,
      );

      return (
        <div
          key={component.id}
          style={{
            ...component.style,
            display: "grid",
            gridTemplateColumns: `repeat(${component.props.columns ?? 2}, minmax(0, 1fr))`,
            gap: component.props.gap ?? 8,
            position:
              component.layout?.position === "absolute"
                ? "absolute"
                : "relative",
            left:
              component.layout?.position === "absolute"
                ? (component.layout?.x ?? 0)
                : undefined,
            top:
              component.layout?.position === "absolute"
                ? (component.layout?.y ?? 0)
                : undefined,
          }}
        >
          {children.map(renderComponent)}
        </div>
      );
    }

    if (component.type === "flex") {
      const children = [...component.children].sort(
        (a, b) => a.order - b.order,
      );

      const direction = component.props.direction ?? "row";
      const justifyContent = component.props.justifyContent ?? "flex-start";
      const alignItems = component.props.alignItems ?? "stretch";

      return (
        <div
          key={component.id}
          style={{
            ...component.style,
            display: "flex",
            flexDirection: direction,
            justifyContent,
            alignItems,
            gap: component.props.gap ?? 8,

            position:
              component.layout?.position === "absolute"
                ? "absolute"
                : "relative",

            left:
              component.layout?.position === "absolute"
                ? (component.layout?.x ?? 0)
                : undefined,

            top:
              component.layout?.position === "absolute"
                ? (component.layout?.y ?? 0)
                : undefined,

            width: component.layout?.width,
            height: component.layout?.height,
          }}
        >
          {children.map(renderComponent)}
        </div>
      );
    }

    return (
      <div
        key={component.id}
        style={{
          ...component.style,
          position:
            component.layout?.position === "absolute" ? "absolute" : "relative",
          left:
            component.layout?.position === "absolute"
              ? (component.layout?.x ?? 0)
              : undefined,
          top:
            component.layout?.position === "absolute"
              ? (component.layout?.y ?? 0)
              : undefined,
        }}
      >
        <CanvasComponentContent component={component} />
      </div>
    );
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        minHeight: 300,
        background: "#fff",
      }}
    >
      {[...safeComponents]
        .sort((a, b) => a.order - b.order)
        .map(renderComponent)}
    </div>
  );
}
export default memo(TemplateCanvasPreviewCard);
