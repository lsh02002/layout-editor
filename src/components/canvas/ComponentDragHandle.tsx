import type { DragEvent, PointerEvent } from "react";
import type { LayoutComponent } from "../../types/types";

type Props = {
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
  const dragDisabled = Boolean(layerSearch);

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
      onDragEnd={onDragEnd}
      onPointerDown={(event) => onPointerDragStart(event, component.id)}
      onPointerMove={onPointerDragMove}
      onPointerUp={onPointerDragEnd}
      onPointerCancel={onPointerDragCancel}
      onContextMenu={(event) => event.preventDefault()}
      onClick={(event) => event.stopPropagation()}
      style={{
        cursor: dragDisabled ? "not-allowed" : isDragging ? "grabbing" : "grab",
        opacity: dragDisabled ? 0.35 : 1,
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
        border: "1px solid #e2e8f0",
        boxShadow: "0 2px 8px rgba(15,23,42,.10)",
        borderRadius: "50%",
        background: isDragging ? "#0d6efd" : "rgba(255,255,255,.96)",
        color: isDragging ? "#fff" : "#64748b",
        fontWeight: 700,
        position: "relative",
        zIndex: 50,
        transition:
          "background 120ms ease, color 120ms ease, box-shadow 120ms ease",
      }}
      title="드래그하여 이동"
    >
      ⋮⋮
    </button>
  );
}
