import {
  memo,
  useEffect,
  useMemo,
  type DragEvent,
  type PointerEvent,
} from "react";
import type { ComponentLayout, LayoutComponent } from "../../types/types";
import CanvasDropZone, { type CanvasDropTarget } from "./CanvasDropZone";
import LayoutComponentNode from "./LayoutComponentNode";

type Props = {
  previewMode: boolean;
  canvasWidth: number;
  isMobile: boolean;
  components: LayoutComponent[];
  selectedComponentIds: string[];
  draggingIds: string[];
  droppedIds: string[];
  layerSearch: string;
  activeDropTarget: CanvasDropTarget | null;
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
  isMobile,
  components,
  selectedComponentIds,
  draggingIds,
  droppedIds,
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

  useEffect(() => {
    if (previewMode) {
      return;
    }

    const canvas = document.querySelector("[data-builder-canvas]");

    canvas
      ?.querySelectorAll<HTMLElement>(
        `[data-component-id],
        [data-builder-original-style],
        [data-builder-original-class],
        [data-builder-original-attributes]`,
      )
      .forEach((element) => {
        // style 복원
        if (element.dataset.builderOriginalStyle !== undefined) {
          const originalStyle = element.dataset.builderOriginalStyle;
          if (originalStyle) {
            element.setAttribute("style", originalStyle);
          } else {
            element.removeAttribute("style");
          }
          delete element.dataset.builderOriginalStyle;
        }
        // class 복원
        if (element.dataset.builderOriginalClass !== undefined) {
          const originalClass = element.dataset.builderOriginalClass;
          if (originalClass) {
            element.setAttribute("class", originalClass);
          } else {
            element.removeAttribute("class");
          }
          delete element.dataset.builderOriginalClass;
        }
        // attribute 복원
        if (element.dataset.builderOriginalAttributes) {
          const originalAttributes = JSON.parse(
            element.dataset.builderOriginalAttributes,
          ) as Record<string, string | null>;
          Object.entries(originalAttributes).forEach(
            ([name, originalValue]) => {
              if (originalValue === null) {
                element.removeAttribute(name);
              } else {
                element.setAttribute(name, originalValue);
              }
            },
          );
          delete element.dataset.builderOriginalAttributes;
        }
      });

    // form 상태 복원
    canvas
      ?.querySelectorAll<
        | HTMLInputElement
        | HTMLTextAreaElement
        | HTMLSelectElement
        | HTMLButtonElement
      >("input, textarea, select, button")
      .forEach((element) => {
        // disabled 복원
        if (element.dataset.builderOriginalDisabled !== undefined) {
          element.disabled = element.dataset.builderOriginalDisabled === "true";

          delete element.dataset.builderOriginalDisabled;
        }
        // value 복원
        if (
          element.dataset.builderOriginalValue !== undefined &&
          "value" in element
        ) {
          element.value = element.dataset.builderOriginalValue;

          delete element.dataset.builderOriginalValue;
        }
        // checked 복원
        if (
          element instanceof HTMLInputElement &&
          element.dataset.builderOriginalChecked !== undefined
        ) {
          element.checked = element.dataset.builderOriginalChecked === "true";
          delete element.dataset.builderOriginalChecked;
        }
      });
  }, [previewMode]);

  return (
    <div
      data-builder-canvas
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
        draggingIds={draggingIds}
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
            style={{ position: "relative", scrollMarginTop: "150px" }}
          >
            <LayoutComponentNode
              previewMode={previewMode}
              canvasWidth={canvasWidth}
              isMobile={isMobile}
              component={component}
              selectedComponentIds={selectedComponentIds}
              draggingIds={draggingIds}
              droppedIds={droppedIds}
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
                draggingIds={draggingIds}
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
