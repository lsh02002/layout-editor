import type { DragEvent } from "react";
import type { ContainerDirection } from "../../types/types";

export type CanvasDropTarget = {
  parentId: string | null;
  index: number;
  area: "canvas" | "layer";
};

type Props = {
  parentId: string | null;
  index: number;
  direction?: ContainerDirection;
  draggingId: string | null;
  activeDropTarget: CanvasDropTarget | null;
  setActiveDropTarget: (target: CanvasDropTarget | null) => void;
  onDrop: (
    event: DragEvent<HTMLElement>,
    parentId: string | null,
    index: number,
  ) => void;
  onCreate: (parentId: string | null, index: number) => void;
};

export default function CanvasDropZone({
  parentId,
  index,
  direction = "column",
  draggingId,
  activeDropTarget,
  setActiveDropTarget,
  onDrop,
  onCreate,
}: Props) {
  const isRow = direction === "row";
  const isActive =
    activeDropTarget?.area === "canvas" &&
    activeDropTarget.parentId === parentId &&
    activeDropTarget.index === index;

  const activate = () =>
    setActiveDropTarget({ parentId, index, area: "canvas" });

  return (
    <div
      data-drop-zone="true"
      data-drop-area="canvas"
      data-drop-parent={parentId ?? "root"}
      data-drop-index={index}
      onDragEnter={(event) => {
        event.preventDefault();
        event.stopPropagation();
        activate();
      }}
      onDragOver={(event) => {
        event.preventDefault();
        event.stopPropagation();
        event.dataTransfer.dropEffect = "move";
        activate();
      }}
      onDragLeave={(event) => {
        event.stopPropagation();
        if (event.currentTarget.contains(event.relatedTarget as Node)) return;
        setActiveDropTarget(null);
      }}
      onDrop={(event) => onDrop(event, parentId, index)}
      style={{
        display: "flex",
        flexDirection: isRow ? "column" : "row",
        alignItems: "center",
        justifyContent: "center",
        minHeight: isRow ? undefined : draggingId ? 32 : 14,
        minWidth: isRow ? (draggingId ? 32 : 14) : undefined,
        flexShrink: 0,
        margin: isRow ? "0 3px" : "3px 0",
        borderRadius: 6,
        position: "relative",
        transition:
          "min-height 120ms ease, min-width 120ms ease, background 120ms ease",
        background: isActive ? "rgba(13, 110, 253, 0.16)" : "transparent",
        outline: isActive ? "2px dashed #0d6efd" : "2px dashed transparent",
      }}
    >
      {!isRow && (
        <div
          style={{
            flex: 1,
            height: 1,
            backgroundColor: "#dee2e6",
            pointerEvents: "none",
          }}
        />
      )}

      <button
        type="button"
        className="btn btn-light btn-sm rounded-circle"
        style={{
          width: 28,
          height: 28,
          minWidth: 28,
          padding: 0,
          border: "1px solid #cbd5e1",
          color: "#64748b",
          opacity: draggingId ? 0.8 : 1,
          pointerEvents: draggingId ? "none" : "auto",
          transition: "opacity 120ms ease",
        }}
        onClick={(event) => {
          event.stopPropagation();
          onCreate(parentId, index);
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
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  );
}
