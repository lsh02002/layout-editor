import {
  memo,
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
import DivBox from "./DivBox";
import {
  hasChildren,
  type ComponentLayout,
  type ContainerDirection,
  type LayoutComponent,
} from "../../types/types";
import CanvasComponentContent from "./CanvasComponentContent";
import CanvasDropZone, { type CanvasDropTarget } from "./CanvasDropZone";
import ComponentDragHandle from "./ComponentDragHandle";

type Props = {
  previewMode: boolean;
  component: LayoutComponent;
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

function LayoutComponentNode({
  previewMode,
  component,
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
  const [renderedWidth, setRenderedWidth] = useState<number>(0);
  const [editToolbarVisible, setEditToolbarVisible] = useState(false);
  const [positionParentElement, setPositionParentElement] =
    useState<HTMLElement | null>(null);

  const isSelected = selectedComponentIds.includes(component.id);
  const isPrimarySelected = selectedComponentIds.at(-1) === component.id;
  const isAbsolute = component.layout?.position === "absolute";

  const positionParentId = component.layout?.positionParentId ?? null;

  const componentRef = useRef<HTMLDivElement>(null);

  const handleComponentRef = useCallback(
    (element: HTMLDivElement | null) => {
      componentRef.current = element;

      if (!element) {
        return;
      }

      if (!isAbsolute || !positionParentId) {
        setPositionParentElement(null);
        return;
      }

      const canvasElement = element.closest<HTMLElement>(".builder-preview");

      if (!canvasElement) {
        setPositionParentElement(null);
        return;
      }

      const parentElement =
        Array.from(
          canvasElement.querySelectorAll<HTMLElement>(
            "[data-position-context-id]",
          ),
        ).find((item) => item.dataset.positionContextId === positionParentId) ??
        null;

      setPositionParentElement((current) =>
        current === parentElement ? current : parentElement,
      );
    },
    [isAbsolute, positionParentId],
  );

  const renderWithPositionParent = (node: ReactNode) => {
    if (isAbsolute && positionParentId && positionParentElement) {
      return createPortal(node, positionParentElement);
    }

    return node;
  };

  const justDropped = !isAbsolute && droppedIds.includes(component.id);

  useEffect(() => {
    if (!isSelected) {
      return;
    }

    const element = componentRef.current;

    if (!element) {
      return;
    }

    const updateWidth = () => {
      setRenderedWidth(element.getBoundingClientRect().width);
    };

    updateWidth();

    const observer = new ResizeObserver(updateWidth);

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [isSelected]);

  const dragHandleLeft =
    renderedWidth > 0 && renderedWidth < 120 && editToolbarVisible
      ? renderedWidth < 70
        ? -100
        : -40
      : -10;

  const effectiveWidthMode =
    component.layout?.widthMode ??
    (component.type === "image" ||
    component.type === "imageGallery" ||
    component.type === "imageSlider"
      ? "fill"
      : undefined);

  const handleNativeDragStart = useCallback(
    (event: DragEvent<HTMLElement>, componentId: string) => {
      const nextDraggingIds = selectedComponentIds.includes(componentId)
        ? selectedComponentIds
        : [componentId];

      onDragStart(event, componentId);

      requestAnimationFrame(() => {
        nextDraggingIds.forEach((id) => {
          document
            .querySelectorAll<HTMLElement>(`[data-component-id="${id}"]`)
            .forEach((element) => {
              element.style.opacity = "0.4";
            });
        });
      });
    },
    [onDragStart, selectedComponentIds],
  );

  const handleNativeDragEnd = useCallback(() => {
    document
      .querySelectorAll<HTMLElement>("[data-component-id]")
      .forEach((element) => {
        element.style.opacity = "";
      });

    onDragEnd();
  }, [onDragEnd]);

  const dragHandle = (
    <ComponentDragHandle
      component={component}
      draggingIds={draggingIds}
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

  const containerMaxWidth =
    component.type === "container" ? component.props.maxWidth : undefined;

  const nodeStyle = {
    position: isAbsolute ? ("absolute" as const) : ("relative" as const),
    left: isAbsolute ? (component.layout?.x ?? 0) : undefined,
    top: isAbsolute ? (component.layout?.y ?? 0) : undefined,
    zIndex: isAbsolute ? 1000 : undefined,
    width: isAbsolute ? "max-content" : "100%",
    minWidth: 0,
    maxWidth: isAbsolute
      ? "none"
      : containerMaxWidth
        ? containerMaxWidth
        : "100%",
    marginLeft: containerMaxWidth ? "auto" : undefined,
    marginRight: containerMaxWidth ? "auto" : undefined,

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
          top: hasChildren(component) ? "-14px" : 0,
          transform: "translate(-50%, -50%)",
          zIndex: 120,
        }}
      >
        {dragHandle}
      </div>
    ) : null;

  const componentChildren = hasChildren(component) ? component.children : null;

  const sortedChildren = useMemo(() => {
    if (!componentChildren) {
      return [];
    }

    return [...componentChildren].sort((a, b) => a.order - b.order);
  }, [componentChildren]);

  const renderChildNode = (child: LayoutComponent) => (
    <LayoutComponentNode
      previewMode={previewMode}
      component={child}
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
  );

  if (component.type === "grid") {
    const children = sortedChildren;
    const columns = Math.max(1, component.props.columns ?? 2);
    const gap = component.props.gap ?? 8;

    return renderWithPositionParent(
      <div
        ref={handleComponentRef}
        data-component-id={component.id}
        style={nodeStyle}
      >
        <DivBox
          previewMode={previewMode}
          isSelected={isPrimarySelected}
          positionContextId={component.id}
          layout={component.layout}
          onLayoutChange={(layout, recordHistory) =>
            onLayoutChange(component.id, layout, recordHistory)
          }
          onComponentSelect={(multiSelect) =>
            onSelect(component.id, false, multiSelect)
          }
          onEdit={() => onEdit(component.id)}
          onCopy={() => onCopy(component.id)}
          onDelete={() => onDelete(component.id)}
          onToolbarVisibleChange={setEditToolbarVisible}
          snapLayout={snapLayout}
          style={{
            ...component.style,
            border: !previewMode ? "1px dashed #adb5bd" : "none",
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
          <div style={{ position: "relative", width: "100%" }}>
            {dragHandleView}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                gap,
                width: "100%",
                minWidth: 0,
              }}
            >
              {!previewMode && (
                <div style={{ gridColumn: "1 / -1" }}>
                  <CanvasDropZone
                    previewMode={previewMode}
                    parentId={component.id}
                    index={0}
                    direction="column"
                    draggingIds={draggingIds}
                    activeDropTarget={activeDropTarget}
                    setActiveDropTarget={setActiveDropTarget}
                    onDrop={onDrop}
                    onCreate={onCreate}
                  />
                </div>
              )}

              {children.map((child, index) => {
                const childIsAbsolute = child.layout?.position === "absolute";

                if (childIsAbsolute) {
                  return (
                    <div key={child.id} style={{ display: "contents" }}>
                      {renderChildNode(child)}
                    </div>
                  );
                }

                return (
                  <div
                    key={child.id}
                    style={{
                      minWidth: 0,
                      maxWidth: "100%",
                      width: "100%",
                    }}
                  >
                    {renderChildNode(child)}

                    {child.type !== "scrollToTopButton" && (
                      <CanvasDropZone
                        previewMode={previewMode}
                        parentId={component.id}
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
          </div>
        </DivBox>
      </div>,
    );
  }

  if (component.type === "container" || component.type === "flex") {
    const children = sortedChildren;
    const direction: ContainerDirection =
      component.props.direction ??
      (component.type === "flex" ? "row" : "column");
    const isRow = direction === "row";
    const justifyContent =
      component.props.justifyContent ??
      (component.type === "flex" ? "flex-start" : "space-between");
    const alignItems = component.props.alignItems ?? "stretch";

    return renderWithPositionParent(
      <div
        ref={handleComponentRef}
        data-component-id={component.id}
        style={nodeStyle}
      >
        <DivBox
          previewMode={previewMode}
          isSelected={isPrimarySelected}
          positionContextId={component.id}
          layout={component.layout}
          onLayoutChange={(layout, recordHistory) =>
            onLayoutChange(component.id, layout, recordHistory)
          }
          onComponentSelect={(multiSelect) =>
            onSelect(component.id, false, multiSelect)
          }
          onEdit={() => onEdit(component.id)}
          onCopy={() => onCopy(component.id)}
          onDelete={() => onDelete(component.id)}
          onToolbarVisibleChange={setEditToolbarVisible}
          snapLayout={snapLayout}
          style={{
            ...component.style,
            border: !previewMode ? "1px dashed #adb5bd" : "none",
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
          <div style={{ position: "relative", width: "100%" }}>
            {dragHandleView}

            <div
              style={{
                display: "flex",
                flexDirection: direction,
                gap: component.props.gap ?? 8,
                width: "100%",
                minWidth: 0,
                justifyContent,
                alignItems,
              }}
            >
              <CanvasDropZone
                previewMode={previewMode}
                parentId={component.id}
                index={0}
                direction={direction}
                draggingIds={draggingIds}
                activeDropTarget={activeDropTarget}
                setActiveDropTarget={setActiveDropTarget}
                onDrop={onDrop}
                onCreate={onCreate}
              />

              {children.map((child, index) => {
                const childIsAbsolute = child.layout?.position === "absolute";
                const widthMode =
                  child.layout?.widthMode ??
                  (child.type === "image" || child.type === "imageSlider"
                    ? "fill"
                    : undefined);
                const childWidth = child.layout?.width;

                const childWrapperStyle = childIsAbsolute
                  ? {
                      display: "contents",
                    }
                  : isRow
                    ? {
                        width:
                          widthMode === "fixed"
                            ? childWidth
                            : widthMode === "fill"
                              ? 0
                              : "auto",
                        flex:
                          widthMode === "fixed"
                            ? "0 0 auto"
                            : widthMode === "fill"
                              ? "1 1 0"
                              : "0 0 auto",
                        minWidth: 0,
                        maxWidth: "100%",
                      }
                    : {
                        width:
                          widthMode === "fixed"
                            ? childWidth
                            : widthMode === "auto"
                              ? "auto"
                              : "100%",
                        minWidth: 0,
                        maxWidth: "100%",
                      };

                return (
                  <div key={child.id} style={childWrapperStyle}>
                    {renderChildNode(child)}

                    {!childIsAbsolute &&
                      child.type !== "scrollToTopButton" &&
                      !isRow && (
                        <CanvasDropZone
                          previewMode={previewMode}
                          parentId={component.id}
                          index={index + 1}
                          direction={direction}
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

              {isRow && (
                <CanvasDropZone
                  previewMode={previewMode}
                  parentId={component.id}
                  index={children.length}
                  direction={direction}
                  draggingIds={draggingIds}
                  activeDropTarget={activeDropTarget}
                  setActiveDropTarget={setActiveDropTarget}
                  onDrop={onDrop}
                  onCreate={onCreate}
                />
              )}
            </div>
          </div>
        </DivBox>
      </div>,
    );
  }

  return renderWithPositionParent(
    <div
      ref={handleComponentRef}
      data-component-id={component.id}
      style={nodeStyle}
    >
      <DivBox
        previewMode={previewMode}
        isSelected={isPrimarySelected}
        positionContextId={component.id}
        layout={{
          ...component.layout,
          widthMode: effectiveWidthMode,
        }}
        onLayoutChange={(layout, recordHistory) =>
          onLayoutChange(component.id, layout, recordHistory)
        }
        onComponentSelect={(multiSelect) =>
          onSelect(component.id, false, multiSelect)
        }
        onEdit={() => onEdit(component.id)}
        onCopy={() => onCopy(component.id)}
        onDelete={() => onDelete(component.id)}
        onToolbarVisibleChange={setEditToolbarVisible}
        snapLayout={snapLayout}
        style={{
          ...component.style,
          position: "relative",
          zIndex: isAbsolute ? (component.layout?.zIndex ?? 100) : 0,
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

export default memo(LayoutComponentNode);
