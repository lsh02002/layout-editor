import type { DragEvent, PointerEvent } from "react";
import type { ComponentLayout, LayoutComponent } from "../../types/types";
import CanvasDropZone, { type CanvasDropTarget } from "./CanvasDropZone";
import LayoutComponentNode from "./LayoutComponentNode";

type Props = {
  components: LayoutComponent[];
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

export default function BuilderCanvas({
  components,
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
  const sortedComponents = [...components].sort((a, b) => a.order - b.order);

  return (
    <div
      className="builder-preview"
      style={{
        minHeight: 700,
        maxWidth: 1100,
        width: "100%",
        margin: "0 auto",
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: 12,
        boxShadow: "0 8px 30px rgba(15, 23, 42, 0.08)",
        padding: 24,
      }}
    >
      <CanvasDropZone
        parentId={null}
        index={0}
        direction="column"
        draggingId={draggingId}
        activeDropTarget={activeDropTarget}
        setActiveDropTarget={setActiveDropTarget}
        onDrop={onDrop}
        onCreate={onCreate}
      />

      {sortedComponents.map((component, index) => (
        <div
          key={component.id}
          data-component-id={component.id}
          style={{ position: "relative" }}
        >
          <LayoutComponentNode
            component={component}
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
          {component.type !== "scrollToTopButton" && (
            <CanvasDropZone
              parentId={null}
              index={index + 1}
              direction="column"
              draggingId={draggingId}
              activeDropTarget={activeDropTarget}
              setActiveDropTarget={setActiveDropTarget}
              onDrop={onDrop}
              onCreate={onCreate}
            />
          )}
        </div>
      ))}
    </div>
  );
}
