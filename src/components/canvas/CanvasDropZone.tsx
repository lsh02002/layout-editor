import { useState, type DragEvent } from "react";
import type { ContainerDirection } from "../../types/types";

export type CanvasDropTarget = {
  parentId: string | null;
  index: number;
  area: "canvas" | "layer";
};

type Props = {
  previewMode: boolean;
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
  previewMode = false,
  parentId,
  index,
  direction = "column",
  draggingId,
  activeDropTarget,
  setActiveDropTarget,
  onDrop,
  onCreate,
}: Props) {
  const [hovered, setHovered] = useState(false);

  const isRow = direction === "row";
  const isActive =
    activeDropTarget?.area === "canvas" &&
    activeDropTarget.parentId === parentId &&
    activeDropTarget.index === index;

  const activate = () =>
    setActiveDropTarget({ parentId, index, area: "canvas" });

  if (previewMode) {
    return null;
  }

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

        const templateData = event.dataTransfer.types.includes(
          "application/x-pagebuilder-template",
        );

        event.dataTransfer.dropEffect = templateData ? "copy" : "move";

        activate();
      }}
      onDragLeave={(event) => {
        event.stopPropagation();
        if (event.currentTarget.contains(event.relatedTarget as Node)) return;
        setActiveDropTarget(null);
      }}
      onDrop={(event) => onDrop(event, parentId, index)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
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
            backgroundColor: "rgb(235, 235, 235)",
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
          opacity: 1,
          visibility: "visible",
          pointerEvents: draggingId ? "none" : "auto",
          transform: hovered || isActive ? "scale(1.08)" : "scale(1)",
          transition: `
        opacity 120ms ease,
        transform 120ms ease,
        visibility 120ms ease
      `,

          zIndex: 10,
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
            backgroundColor: "rgb(235, 235, 235)",
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  );
}
