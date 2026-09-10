import { memo, useState, type DragEvent } from "react";
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
  draggingIds: string[];
  activeDropTarget: CanvasDropTarget | null;
  setActiveDropTarget: (target: CanvasDropTarget | null) => void;
  onDrop: (
    event: DragEvent<HTMLElement>,
    parentId: string | null,
    index: number,
  ) => void;
  onCreate: (parentId: string | null, index: number) => void;
};

function CanvasDropZone({
  previewMode = false,
  parentId,
  index,
  direction = "column",
  draggingIds,
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

  const isValidDrag = (event: DragEvent<HTMLElement>) => {
    const types = event.dataTransfer.types;
    const isTemplate = types.includes("application/x-pagebuilder-template");
    const isNewComponent = types.includes("application/x-component-type");
    const isExistingComponent = types.includes(
      "application/x-layout-component-id",
    );
    return isTemplate || isNewComponent || isExistingComponent;
  };

  return (
    <div
      data-drop-zone="true"
      data-drop-area="canvas"
      data-drop-parent={parentId ?? "root"}
      data-drop-index={index}
      onDragEnter={(event) => {
        if (!isValidDrag(event)) {
          setActiveDropTarget(null);
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        activate();
      }}
      onDragOver={(event) => {
        if (!isValidDrag(event)) {
          setActiveDropTarget(null);
          return;
        }

        event.preventDefault();
        event.stopPropagation();

        const isTemplate = event.dataTransfer.types.includes(
          "application/x-pagebuilder-template",
        );

        const isNewComponent = event.dataTransfer.types.includes(
          "application/x-component-type",
        );

        event.dataTransfer.dropEffect =
          isTemplate || isNewComponent ? "copy" : "move";

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
        minHeight: isRow ? undefined : draggingIds.length > 0 ? 32 : 24,
        minWidth: isRow ? (draggingIds.length > 0 ? 32 : 24) : undefined,
        height: isRow ? undefined : draggingIds.length > 0 ? 32 : 24,
        width: isRow ? (draggingIds.length > 0 ? 32 : 24) : undefined,
        flexShrink: 0,
        margin: 0,
        borderRadius: 6,
        position: "relative",

        background: isActive ? "rgba(13, 110, 253, 0.16)" : "transparent",
        outline: "2px dashed",
        outlineColor: isActive ? "#0d6efd" : "transparent",

        transition:
          "min-height 120ms ease, min-width 120ms ease, background 120ms ease",

        visibility: previewMode ? "hidden" : "visible",
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
          width: 24,
          height: 24,
          minWidth: 24,
          minHeight: 24,
          padding: 0,
          border: !previewMode ? "1px solid #cbd5e1" : "1px solid transparent",
          color: "#64748b",
          pointerEvents: draggingIds.length > 0 ? "none" : "auto",
          transform: hovered || isActive ? "scale(1.08)" : "scale(1)",
          touchAction: "manipulation",
          zIndex: 10,
        }}
        onClick={(event) => {
          event.stopPropagation();
          onCreate(parentId, index);
        }}
        onPointerDown={(event) => event.stopPropagation()}
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

export default memo(CanvasDropZone);
