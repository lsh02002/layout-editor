import type { DragEvent, MouseEvent, PointerEvent } from "react";

import DivBox from "../layout/DivBox";

import type {
  ComponentLayout,
  ContainerDirection,
  LayoutComponent,
} from "../../types/types";

import CanvasComponentContent from "./CanvasComponentContent";
import CanvasDropZone, { type CanvasDropTarget } from "./CanvasDropZone";
import ComponentDragHandle from "./ComponentDragHandle";

type Props = {
  previewMode: boolean;
  component: LayoutComponent;

  selectedComponentId: string | null;
  draggingId: string | null;
  layerSearch: string;

  activeDropTarget: CanvasDropTarget | null;

  setActiveDropTarget: (target: CanvasDropTarget | null) => void;

  onLayoutChange: (id: string, layout: Partial<ComponentLayout>) => void;

  onEdit: (id: string) => void;

  onCopy: (id: string) => void;

  onDelete: (id: string) => void;

  onCreate: (parentId: string | null, index: number) => void;

  onDrop: (
    event: DragEvent<HTMLElement>,
    parentId: string | null,
    index: number,
  ) => void;

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

export default function LayoutComponentNode({
  previewMode,
  component,
  selectedComponentId,
  draggingId,
  layerSearch,
  activeDropTarget,
  setActiveDropTarget,
  onLayoutChange,
  onEdit,
  onCopy,
  onDelete,
  onCreate,
  onDrop,
  onDragStart,
  onDragEnd,
  onPointerDragStart,
  onPointerDragMove,
  onPointerDragEnd,
  onPointerDragCancel,
}: Props) {
  const isDragging = draggingId === component.id;

  const isSelected = selectedComponentId === component.id;

  const handleSelect = (event: MouseEvent<HTMLElement>) => {
    if (previewMode) {
      return;
    }

    event.stopPropagation();

    if (isDragging) {
      return;
    }
  };

  const dragHandle = (
    <>
      {!previewMode && (
        <ComponentDragHandle
          previewMode={previewMode}
          component={component}
          draggingId={draggingId}
          layerSearch={layerSearch}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onPointerDragStart={onPointerDragStart}
          onPointerDragMove={onPointerDragMove}
          onPointerDragEnd={onPointerDragEnd}
          onPointerDragCancel={onPointerDragCancel}
        />
      )}
    </>
  );

  if (component.type === "container") {
    const children = [...component.children].sort((a, b) => a.order - b.order);

    const direction: ContainerDirection = component.props.direction ?? "column";

    const isRow = direction === "row";

    return (
      <div
        data-component-id={component.id}
        onClick={handleSelect}
        style={{
          position: "relative",

          opacity: isDragging ? 0.45 : 1,

          transition: "opacity 100ms ease",
        }}
      >
        {!previewMode && dragHandle}

        <DivBox
          previewMode={previewMode}
          layout={component.layout}
          onLayoutChange={(layout) => onLayoutChange(component.id, layout)}
          onEdit={() => onEdit(component.id)}
          onCopy={() => onCopy(component.id)}
          onDelete={() => onDelete(component.id)}
          style={{
            ...component.style,
            outline:
              !previewMode && isSelected
                ? "2px solid #0d6efd"
                : component.style?.outline,
            outlineOffset:
              !previewMode && isSelected
                ? "2px"
                : component.style?.outlineOffset,
          }}
        >
          <div
            style={{
              display: "flex",

              flexDirection: direction,

              gap: component.props.gap ?? 8,

              width: "100%",

              alignItems: isRow ? "stretch" : undefined,

              justifyContent: isRow ? "space-between" : undefined,
            }}
          >
            <CanvasDropZone
              previewMode={previewMode}
              parentId={component.id}
              index={0}
              direction={direction}
              draggingId={draggingId}
              activeDropTarget={activeDropTarget}
              setActiveDropTarget={setActiveDropTarget}
              onDrop={onDrop}
              onCreate={onCreate}
            />

            {children.map((child, index) => (
              <div
                key={child.id}
                style={{
                  flex: isRow
                    ? child.layout?.width
                      ? undefined
                      : 1
                    : undefined,

                  width: isRow ? child.layout?.width : "100%",

                  minWidth: 0,
                }}
              >
                <LayoutComponentNode
                  previewMode={previewMode}
                  component={child}
                  selectedComponentId={selectedComponentId}
                  draggingId={draggingId}
                  layerSearch={layerSearch}
                  activeDropTarget={activeDropTarget}
                  setActiveDropTarget={setActiveDropTarget}
                  onLayoutChange={onLayoutChange}
                  onEdit={onEdit}
                  onCopy={onCopy}
                  onDelete={onDelete}
                  onCreate={onCreate}
                  onDrop={onDrop}
                  onDragStart={onDragStart}
                  onDragEnd={onDragEnd}
                  onPointerDragStart={onPointerDragStart}
                  onPointerDragMove={onPointerDragMove}
                  onPointerDragEnd={onPointerDragEnd}
                  onPointerDragCancel={onPointerDragCancel}
                />

                {child.type !== "scrollToTopButton" && !isRow && (
                  <CanvasDropZone
                    previewMode={previewMode}
                    parentId={component.id}
                    index={index + 1}
                    direction={direction}
                    draggingId={draggingId}
                    activeDropTarget={activeDropTarget}
                    setActiveDropTarget={setActiveDropTarget}
                    onDrop={onDrop}
                    onCreate={onCreate}
                  />
                )}
              </div>
            ))}

            {isRow && (
              <CanvasDropZone
                previewMode={previewMode}
                parentId={component.id}
                index={children.length}
                direction={direction}
                draggingId={draggingId}
                activeDropTarget={activeDropTarget}
                setActiveDropTarget={setActiveDropTarget}
                onDrop={onDrop}
                onCreate={onCreate}
              />
            )}
          </div>
        </DivBox>
      </div>
    );
  }

  return (
    <div
      data-component-id={component.id}
      onClick={handleSelect}
      style={{
        position: "relative",

        opacity: isDragging ? 0.45 : 1,

        transition: "opacity 100ms ease",
      }}
    >
      {!previewMode && dragHandle}

      <DivBox
        previewMode={previewMode}
        layout={component.layout}
        onLayoutChange={(layout) => onLayoutChange(component.id, layout)}
        onEdit={() => onEdit(component.id)}
        onCopy={() => onCopy(component.id)}
        onDelete={() => onDelete(component.id)}
        style={{
          ...component.style,
          outline:
            !previewMode && isSelected
              ? "2px solid #0d6efd"
              : component.style?.outline,
          outlineOffset:
            !previewMode && isSelected ? "2px" : component.style?.outlineOffset,
        }}
      >
        <CanvasComponentContent component={component} />
      </DivBox>
    </div>
  );
}
