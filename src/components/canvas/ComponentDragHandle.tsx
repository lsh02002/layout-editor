import type { DragEvent, PointerEvent } from "react";
import type { LayoutComponent } from "../../types/types";

type Props = {
  previewMode: boolean;
  component: LayoutComponent;
  draggingId: string | null;
  layerSearch: string;
  onDragStart: (event: DragEvent<HTMLElement>, componentId: string) => void;
  onDragEnd: () => void;
  onPointerDragStart: (
    event: PointerEvent<HTMLElement>,
    componentId: string,
  ) => void;
  onPointerDragMove: (event: PointerEvent<HTMLElement>) => void;
  onPointerDragEnd: (event: PointerEvent<HTMLElement>) => void;
  onPointerDragCancel: () => void;
};

export default function ComponentDragHandle({
  previewMode,
  component,
  draggingId,
  layerSearch,
  onDragStart,
  onDragEnd,
  onPointerDragStart,
  onPointerDragMove,
  onPointerDragEnd,
  onPointerDragCancel,
}: Props) {
  const isDragging = draggingId === component.id;
  const dragDisabled = previewMode || Boolean(layerSearch);

  return (
    <button
      className="component-drag-handle"
      type="button"
      draggable={!dragDisabled}
      onDragStart={(event) => {
        if (dragDisabled) {
          event.preventDefault();
          return;
        }
        onDragStart(event, component.id);
      }}
      onDragEnd={() => {
        if (dragDisabled) {
          return;
        }
        onDragEnd();
      }}
      onPointerDown={(event) => {
        event.stopPropagation();
        if (dragDisabled) {
          return;
        }
        onPointerDragStart(event, component.id);
      }}
      onPointerMove={(event) => {
        if (dragDisabled) {
          return;
        }
        onPointerDragMove(event);
      }}
      onPointerUp={(event) => {
        if (dragDisabled) {
          return;
        }
        onPointerDragEnd(event);
      }}
      onPointerCancel={() => {
        if (dragDisabled) {
          return;
        }
        onPointerDragCancel();
      }}
      onContextMenu={(event) => event.preventDefault()}
      onClick={(event) => event.stopPropagation()}
      style={{
        cursor: previewMode
          ? "default"
          : dragDisabled
            ? "not-allowed"
            : isDragging
              ? "grabbing"
              : "grab",
        opacity: previewMode ? 0 : dragDisabled ? 0.35 : 1,
        pointerEvents: previewMode ? "none" : "auto",
        userSelect: "none",
        WebkitUserSelect: "none",
        touchAction: previewMode ? "auto" : "none",
        width: 36,
        height: 36,
        minWidth: 36,
        minHeight: 36,
        padding: 0,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        border: "1px solid #e2e8f0",
        boxShadow: "0 2px 8px rgba(15,23,42,.10)",
        borderRadius: "50%",
        background: isDragging ? "#0d6efd" : "rgba(255,255,255,.96)",
        color: isDragging ? "#fff" : "#64748b",
        fontWeight: 700,
        position: "absolute",
        left: 0,
        top: "-20px",
        transform: "translateY(-50%)",
        zIndex: 50,
        transition: `
      opacity 120ms ease,
      background 120ms ease,
      color 120ms ease,
      box-shadow 120ms ease
    `,
      }}
      title="드래그하여 이동"
    >
      ⋮⋮
    </button>
  );
}
