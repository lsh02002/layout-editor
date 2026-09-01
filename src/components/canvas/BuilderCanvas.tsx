import { memo, useMemo, type DragEvent, type PointerEvent } from "react";
import type { ComponentLayout, LayoutComponent } from "../../types/types";
import CanvasDropZone, { type CanvasDropTarget } from "./CanvasDropZone";
import LayoutComponentNode from "./LayoutComponentNode";

type Props = {
  previewMode: boolean;
  canvasWidth: number;
  components: LayoutComponent[];
  selectedComponentId: string | null;
  selectedComponentIds: string[];
  draggingId: string | null;
  droppedId: string | null;
  layerSearch: string;
  activeDropTarget: CanvasDropTarget | null;
  setPreviewMode: React.Dispatch<React.SetStateAction<boolean>>;
  setActiveDropTarget: (target: CanvasDropTarget | null) => void;
  onLayoutChange: (
    id: string,
    layout: Partial<ComponentLayout>,
    recordHistory?: boolean,
  ) => void;
  onSelect: (
    id: string,
    openEditPanel?: boolean,
    multiSelect?: boolean,
  ) => void;
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
  snapLayout: (layout: Partial<ComponentLayout>) => Partial<ComponentLayout>;
};

function BuilderCanvas({
  previewMode,
  canvasWidth,
  components,
  selectedComponentId,
  selectedComponentIds,
  draggingId,
  droppedId,
  layerSearch,
  activeDropTarget,
  setActiveDropTarget,
  onLayoutChange,
  onSelect,
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
  snapLayout,
}: Props) {
  const sortedComponents = useMemo(
    () => [...components].sort((a, b) => a.order - b.order),
    [components],
  );

  return (
    <div
      className="builder-preview"
      style={{ maxWidth: canvasWidth }}
      onDragStart={(event) => {
        const target = event.target as HTMLElement;
        const draggableElement = target.closest('[draggable="true"]');
        if (!draggableElement) {
          event.preventDefault();
        }
      }}
    >
      <CanvasDropZone
        previewMode={previewMode}
        parentId={null}
        index={0}
        direction="column"
        draggingId={draggingId}
        activeDropTarget={activeDropTarget}
        setActiveDropTarget={setActiveDropTarget}
        onDrop={onDrop}
        onCreate={onCreate}
      />

      {sortedComponents.map((component, index) => {
        const isAbsolute = component.layout?.position === "absolute";

        return (
          <div
            key={component.id}
            data-component-id={component.id}
            style={{ position: "relative" }}
          >
            <LayoutComponentNode
              previewMode={previewMode}
              component={component}
              selectedComponentId={selectedComponentId}
              selectedComponentIds={selectedComponentIds}
              draggingId={draggingId}
              droppedId={droppedId}
              layerSearch={layerSearch}
              activeDropTarget={activeDropTarget}
              setActiveDropTarget={setActiveDropTarget}
              onLayoutChange={onLayoutChange}
              onSelect={onSelect}
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
              snapLayout={snapLayout}
            />
            {!isAbsolute && component.type !== "scrollToTopButton" && (
              <CanvasDropZone
                previewMode={previewMode}
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
        );
      })}
    </div>
  );
}

export default memo(BuilderCanvas);
