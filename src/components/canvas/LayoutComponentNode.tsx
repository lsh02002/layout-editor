import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
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
  droppedId: string | null;
  layerSearch: string;
  activeDropTarget: CanvasDropTarget | null;
  setActiveDropTarget: (target: CanvasDropTarget | null) => void;
  onLayoutChange: (
    id: string,
    layout: Partial<ComponentLayout>,
    recordHistory?: boolean,
  ) => void;
  onSelect: (id: string) => void;
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
}: Props) {
  const [isLocalDragging, setIsLocalDragging] = useState(false);
  const [renderedWidth, setRenderedWidth] = useState<number>(0);

  const [editToolbarVisible, setEditToolbarVisible] = useState(false);

  const isDragging = isLocalDragging || draggingId === component.id;
  const isSelected = selectedComponentId === component.id;
  const isAbsolute = component.layout?.position === "absolute";

  const positionParentId = component.layout?.positionParentId ?? null;
  const positionParentElement =
    isAbsolute && positionParentId
      ? (Array.from(
          document.querySelectorAll<HTMLElement>("[data-position-context-id]"),
        ).find(
          (element) => element.dataset.positionContextId === positionParentId,
        ) ?? null)
      : null;

  const renderWithPositionParent = (node: ReactNode) => {
    if (isAbsolute && positionParentId && positionParentElement) {
      return createPortal(node, positionParentElement);
    }

    return node;
  };

  const componentRef = useRef<HTMLDivElement>(null);

  const justDropped = !isAbsolute && droppedId === component.id;

  useEffect(() => {
    const element = componentRef.current;

    if (!element) {
      return;
    }

    const updateWidth = () => {
      const rect = element.getBoundingClientRect();

      setRenderedWidth(rect.width);
    };

    // 최초 측정
    updateWidth();

    const resizeObserver = new ResizeObserver(() => {
      updateWidth();
    });

    // 실제 컴포넌트 wrapper를 관찰
    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, [component.id]);

  const dragHandleLeft =
    renderedWidth > 0 && renderedWidth < 120 && editToolbarVisible
      ? renderedWidth < 70
        ? -100
        : -40
      : -10;

  const handleNativeDragStart = useCallback(
    (event: DragEvent<HTMLElement>, componentId: string) => {
      setIsLocalDragging(true);
      onDragStart(event, componentId);
    },
    [onDragStart],
  );

  const handleNativeDragEnd = useCallback(() => {
    setIsLocalDragging(false);
    onDragEnd();
  }, [onDragEnd]);

  const dragHandle = (
    <ComponentDragHandle
      component={component}
      draggingId={draggingId}
      layerSearch={layerSearch}
      onDragStart={handleNativeDragStart}
      onDragEnd={handleNativeDragEnd}
      onPointerDragStart={onPointerDragStart}
      onPointerDragMove={onPointerDragMove}
      onPointerDragEnd={onPointerDragEnd}
      onPointerDragCancel={onPointerDragCancel}
      dragHandleLeft={dragHandleLeft}
    />
  );

  const nodeStyle = {
    position: isAbsolute ? ("absolute" as const) : ("relative" as const),
    left: isAbsolute ? (component.layout?.x ?? 0) : undefined,
    top: isAbsolute ? (component.layout?.y ?? 0) : undefined,
    zIndex: isAbsolute ? 1000 : undefined,
    width: isAbsolute ? "max-content" : undefined,
    maxWidth: isAbsolute ? "none" : undefined,

    ...(component.style?.border
      ? { border: component.style.border }
      : { border: "none" }),

    transform: justDropped
      ? "translateY(-6px) scale(1.015)"
      : !isAbsolute
        ? "translateY(0) scale(1)"
        : undefined,

    transition: !isAbsolute
      ? "transform 220ms cubic-bezier(0.22, 1, 0.36, 1)"
      : undefined,
  };

  const dragHandleView =
    !previewMode && !isAbsolute && isSelected ? (
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          transform: "translate(-50%, -50%)",
          zIndex: 120,
        }}
      >
        {dragHandle}
      </div>
    ) : null;

  const containerChildren =
    component.type === "container" ? component.children : null;

  const sortedChildren = useMemo(() => {
    if (!containerChildren) {
      return [];
    }

    return [...containerChildren].sort((a, b) => a.order - b.order);
  }, [containerChildren]);

  if (component.type === "container") {
    const children = sortedChildren;
    const direction: ContainerDirection = component.props.direction ?? "column";
    const isRow = direction === "row";

    return renderWithPositionParent(
      <div
        ref={componentRef}
        data-component-id={component.id}
        style={nodeStyle}
      >
        <DivBox
          previewMode={previewMode}
          positionContextId={component.id}
          layout={component.layout}
          onLayoutChange={(layout, recordHistory) =>
            onLayoutChange(component.id, layout, recordHistory)
          }
          onSelect={() => onSelect(component.id)}
          onEdit={() => onEdit(component.id)}
          onCopy={() => onCopy(component.id)}
          onDelete={() => onDelete(component.id)}
          onToolbarVisibleChange={setEditToolbarVisible}
          style={{
            ...component.style,
            border: !previewMode ? "1px dashed #adb5bd" : "none",
            opacity: isDragging ? 0.45 : (component.style?.opacity ?? 1),
            transition: "opacity 120ms ease",
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
          {dragHandleView}
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
            {children.map((child, index) => {
              const childIsAbsolute = child.layout?.position === "absolute";
              return (
                <div
                  key={child.id}
                  style={
                    childIsAbsolute
                      ? { display: "contents" }
                      : {
                          flex: isRow
                            ? child.layout?.width
                              ? undefined
                              : 1
                            : undefined,
                          width: isRow ? child.layout?.width : "100%",
                          minWidth: 0,
                        }
                  }
                >
                  <LayoutComponentNode
                    previewMode={previewMode}
                    component={child}
                    selectedComponentId={selectedComponentId}
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
                  />
                  {!childIsAbsolute &&
                    child.type !== "scrollToTopButton" &&
                    !isRow && (
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
              );
            })}
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
      </div>,
    );
  }

  return renderWithPositionParent(
    <div ref={componentRef} data-component-id={component.id} style={nodeStyle}>
      <DivBox
        previewMode={previewMode}
        positionContextId={component.id}
        layout={component.layout}
        onLayoutChange={(layout, recordHistory) =>
          onLayoutChange(component.id, layout, recordHistory)
        }
        onSelect={() => onSelect(component.id)}
        onEdit={() => onEdit(component.id)}
        onCopy={() => onCopy(component.id)}
        onDelete={() => onDelete(component.id)}
        onToolbarVisibleChange={setEditToolbarVisible}
        style={{
          ...component.style,
          position: "relative",
          zIndex: isAbsolute ? (component.layout?.zIndex ?? 100) : 0,
          opacity: isDragging ? 0.45 : (component.style?.opacity ?? 1),
          transition: "opacity 120ms ease",
          outline:
            !previewMode && isSelected
              ? "2px solid #0d6efd"
              : component.style?.outline,
          outlineOffset:
            !previewMode && isSelected ? "2px" : component.style?.outlineOffset,
        }}
      >
        {dragHandleView}
        <CanvasComponentContent component={component} />
      </DivBox>
    </div>,
  );
}
