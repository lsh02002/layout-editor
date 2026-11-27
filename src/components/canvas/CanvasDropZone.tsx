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

    return (
      types.includes("application/x-pagebuilder-template") ||
      types.includes("application/x-component-type") ||
      types.includes("application/x-layout-component-id") ||
      types.includes("application/x-layout-component-ids")
    );
  };

  const isDragging = draggingIds.length > 0;
  const expanded = !previewMode && isActive;
  const buttonExpanded = !previewMode && (hovered || isActive);

  // 기본 3px, 드래그 중에는 감지 영역 확장
  const hitSize = expanded ? 32 : isDragging ? 16 : 12;

  return (
    <div
      data-drop-zone="true"
      data-drop-area="canvas"
      data-drop-parent={parentId ?? "root"}
      data-drop-index={index}
      style={{
        position: "relative",

        width: isRow ? 0 : "100%",
        height: isRow ? "100%" : 0,
        minWidth: isRow ? 0 : "100%",
        minHeight: isRow ? "100%" : 0,

        flex: "0 0 0px",
        margin: 0,
        padding: 0,
        border: 0,

        overflow: "visible",
        boxSizing: "border-box",

        visibility: previewMode ? "hidden" : "visible",
        pointerEvents: previewMode ? "none" : "auto",

        zIndex: buttonExpanded ? 100 : isDragging ? 50 : 0,
      }}
    >
      <div
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

          const nextTarget = event.relatedTarget;

          if (
            nextTarget instanceof Node &&
            event.currentTarget.contains(nextTarget)
          ) {
            return;
          }

          setActiveDropTarget(null);
        }}
        onDrop={(event) => onDrop(event, parentId, index)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          position: "absolute",
          ...(isRow
            ? {
                top: 0,
                bottom: 0,
                left: "50%",
                width: hitSize,
                height: "100%",
                minHeight: 24,
                transform: "translateX(-50%)",
              }
            : {
                top: "50%",
                left: 0,
                right: 0,
                width: "100%",
                height: hitSize,
                transform: "translateY(-50%)",
              }),

          display: "flex",
          flexDirection: isRow ? "column" : "row",
          alignItems: "center",
          justifyContent: "center",

          margin: 0,
          padding: 0,
          boxSizing: "border-box",

          borderRadius: 6,

          background: isActive ? "rgba(13, 110, 253, 0.16)" : "transparent",

          outline: "2px dashed",
          outlineColor: isActive ? "#0d6efd" : "transparent",

          transition:
            "background 120ms ease, width 120ms ease, height 120ms ease",

          zIndex: buttonExpanded ? 100 : isDragging ? 50 : 0,
          pointerEvents: "auto",
        }}
      >
        {!isRow && (
          <div
            style={{
              flex: 1,
              height: 1,
              minWidth: 0,
              backgroundColor: "rgb(235, 235, 235)",
              pointerEvents: "none",
            }}
          />
        )}

        <button
          type="button"
          className="btn btn-sm"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: isRow ? (buttonExpanded ? 24 : 3) : 72,
            height: isRow ? 32 : buttonExpanded ? 24 : 3,
            minWidth: isRow ? (buttonExpanded ? 24 : 3) : 72,
            minHeight: isRow ? 32 : buttonExpanded ? 24 : 3,
            padding: 0,
            flexShrink: 0,
            border: "1px solid #ccccff",
            borderRadius: 3,
            color: buttonExpanded ? "#356abe" : "#64748b",
            pointerEvents: previewMode ? "none" : "auto",
            transform: buttonExpanded ? "scale(1.08)" : "scale(1)",
            transition:
              "width 120ms ease, height 120ms ease, transform 120ms ease",
            touchAction: "manipulation",
            position: "relative",
            zIndex: 10,
            background: "white",
            fontSize: 16,
          }}
          onClick={(event) => {
            event.stopPropagation();
            onCreate(parentId, index);
          }}
          onPointerDown={(event) => {
            event.stopPropagation();
          }}
        >
          +
        </button>

        {!isRow && (
          <div
            style={{
              flex: 1,
              height: 1,
              minWidth: 0,
              backgroundColor: "rgb(235, 235, 235)",
              pointerEvents: "none",
            }}
          />
        )}
      </div>
    </div>
  );
}

export default memo(CanvasDropZone);
