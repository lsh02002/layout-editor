import { memo, type DragEvent, type PointerEvent } from "react";

import type { LayoutComponent } from "../../types/types";

type Props = {
  component: LayoutComponent;
  draggingIds: string[];
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

  dragHandleLeft?: number;
};

function ComponentDragHandle({
  component,
  draggingIds,
  layerSearch,
  onDragStart,
  onDragEnd,
  onPointerDragStart,
  onPointerDragMove,
  onPointerDragEnd,
  onPointerDragCancel,
  dragHandleLeft,
}: Props) {
  const isDragging = draggingIds.includes(component.id);
  const dragDisabled = Boolean(layerSearch);

  return (
    <button
      className="component-drag-handle"
      type="button"
      draggable={!dragDisabled}
      onDragStart={(event) => {
        event.stopPropagation();

        if (dragDisabled) {
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

        if (event.pointerType === "mouse") {
          return;
        }

        onPointerDragStart(event, component.id);
      }}
      onPointerMove={(event) => {
        if (dragDisabled) {
          return;
        }

        if (event.pointerType === "mouse") {
          return;
        }

        onPointerDragMove(event);
      }}
      onPointerUp={(event) => {
        if (dragDisabled) {
          return;
        }

        if (event.pointerType === "mouse") {
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
      onContextMenu={(event) => {
        event.preventDefault();
      }}
      onClick={(event) => {
        event.stopPropagation();
      }}
      style={{
        cursor: dragDisabled ? "not-allowed" : isDragging ? "grabbing" : "grab",
        opacity: dragDisabled ? 0.35 : 1,
        pointerEvents: "auto",
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
        position: "absolute",
        left: dragHandleLeft,
        top: "-20px",
        transform: "translateY(-50%)",
        zIndex: 50,
        transition: `
          left 120ms ease,
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

export default memo(ComponentDragHandle);
