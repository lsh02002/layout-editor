import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type SetStateAction,
  type SyntheticEvent,
  type Dispatch,
} from "react";
import type { DragEvent, PointerEvent } from "react";
import DivBox from "./DivBox";
import {
  isLayoutContainer,
  type CanvasComponent,
  type LayoutComponent,
  type ComponentLayout,
} from "../../types/types";
import CanvasComponentContent from "./CanvasComponentContent";
import CanvasDropZone, { type CanvasDropTarget } from "./CanvasDropZone";
import ComponentDragHandle from "./ComponentDragHandle";
import { builderState } from "../editor/utils/builderState";
import { runtimeUnits } from "../editor/utils/RuntimeUnitManager";
import { createBuilderApi } from "./layoutNode/createBuilderApi";
import { useComponentDrag } from "./layoutNode/useComponentDrag";
import { usePositionParent } from "./layoutNode/usePositionParent";
import ContentContainer from "./layoutNode/ContentContainer";

type LayoutComponentNodeProps = {
  previewMode: boolean;
  canvasWidth: number;
  isMobile: boolean;
  component: LayoutComponent;
  selectedComponentIds: string[];
  draggingIds: string[];
  droppedIds: string[];
  layerSearch: string;
  activeDropTarget: CanvasDropTarget | null;
  runtimeCommandMode: string | null;
  setRuntimeCommandMode: Dispatch<SetStateAction<string | null>>;
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
  canvasWidth,
  isMobile,
  component,
  selectedComponentIds,
  draggingIds,
  droppedIds,
  layerSearch,
  activeDropTarget,
  runtimeCommandMode,
  setRuntimeCommandMode,
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
}: LayoutComponentNodeProps) {
  useSyncExternalStore(
    builderState.subscribe,
    builderState.getVersion,
    builderState.getVersion,
  );

  const [renderedWidth, setRenderedWidth] = useState<number>(0);
  const [editToolbarVisible, setEditToolbarVisible] = useState(false);
  const textBinding = component.stateBindings?.find(
    (binding) => binding.target === "text",
  );

  const valueBinding = component.stateBindings?.find(
    (binding) => binding.target === "value",
  );

  const visibleBinding = component.stateBindings?.find(
    (binding) => binding.target === "visible",
  );

  const boundText = textBinding
    ? builderState.get(textBinding.stateKey, "")
    : undefined;

  const boundValue = valueBinding
    ? builderState.get(valueBinding.stateKey, "")
    : undefined;

  const isStateVisible = visibleBinding
    ? Boolean(builderState.get(visibleBinding.stateKey, true))
    : true;

  const isSelected = selectedComponentIds.includes(component.id);
  const isPrimarySelected = selectedComponentIds.at(-1) === component.id;
  const isAbsolute = component.layout?.position === "absolute";

  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

  const executeJsActions = useCallback(
    (eventName: string, event: SyntheticEvent<HTMLElement>) => {
      if (!previewMode) {
        return;
      }
      const actions = component.jsActions ?? [];
      const matchedActions = actions.filter(
        (action) =>
          action.enabled !== false &&
          action.event === eventName &&
          action.code.trim(),
      );
      if (matchedActions.length === 0) {
        return;
      }
      matchedActions.forEach((action) => {
        if (action.preventDefault) {
          event.preventDefault();
        }

        if (action.stopPropagation) {
          event.stopPropagation();
        }

        const fn = new AsyncFunction(
          "event",
          "element",
          "component",
          "builder",
          action.code,
        );
        void fn(
          event,
          event.currentTarget,
          component,
          createBuilderApi(),
        ).catch((error: unknown) => {
          console.error(`JS Action 실행 실패: ${action.event}`, error);
        });
      });
    },
    [AsyncFunction, component, previewMode],
  );

  const jsEventProps = previewMode
    ? {
        onClick: (event: SyntheticEvent<HTMLElement>) =>
          executeJsActions("click", event),
        onDoubleClick: (event: SyntheticEvent<HTMLElement>) =>
          executeJsActions("dblclick", event),
        onMouseEnter: (event: SyntheticEvent<HTMLElement>) =>
          executeJsActions("mouseenter", event),
        onMouseLeave: (event: SyntheticEvent<HTMLElement>) =>
          executeJsActions("mouseleave", event),
        onFocus: (event: SyntheticEvent<HTMLElement>) =>
          executeJsActions("focus", event),
        onBlur: (event: SyntheticEvent<HTMLElement>) =>
          executeJsActions("blur", event),
        onInput: (event: SyntheticEvent<HTMLElement>) =>
          executeJsActions("input", event),
        onChange: (event: SyntheticEvent<HTMLElement>) =>
          executeJsActions("change", event),
      }
    : {};

  const positionParentId = component.layout?.positionParentId ?? null;

  const { componentRef, handleComponentRef, renderWithPositionParent } =
    usePositionParent({
      isAbsolute,
      positionParentId,
    });

  const justDropped = !isAbsolute && droppedIds.includes(component.id);

  useEffect(() => {
    if (!previewMode || !component.runtimeUnit?.enabled) {
      return;
    }

    const frameId = requestAnimationFrame(() => {
      runtimeUnits.spawn(component.id);
    });

    return () => {
      cancelAnimationFrame(frameId);
      runtimeUnits.reset(component.id);
    };
  }, [component.id, component.runtimeUnit, previewMode]);

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
  }, [componentRef, isSelected]);

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

  const { handleNativeDragStart, handleNativeDragEnd } = useComponentDrag({
    selectedComponentIds,
    onDragStart,
    onDragEnd,
  });

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

  const isPresentationSlide =
    component.type === "container" &&
    component.props.presentationSlide === true;

  const presentationEditStyle =
    isPresentationSlide && !previewMode
      ? {
          position: "relative" as const,
          left: undefined,
          top: undefined,
          right: undefined,
          bottom: undefined,
          opacity: 1,
          zIndex: "auto",
          pointerEvents: "auto" as const,
          transform: undefined,
        }
      : {};

  const containerMaxWidth =
    component.type === "container" ? component.props.maxWidth : undefined;

  const nodeStyle = {
    display: previewMode && !isStateVisible ? "none" : undefined,

    position: isAbsolute ? ("absolute" as const) : ("relative" as const),
    left: isAbsolute ? (component.layout?.x ?? 0) : undefined,
    top: isAbsolute ? (component.layout?.y ?? 0) : undefined,
    zIndex: isAbsolute ? (component.layout?.zIndex ?? 1000) : undefined,
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

    scrollMarginTop: "150px",

    pointerEvents:
      isPresentationSlide && previewMode
        ? component.style?.pointerEvents
        : undefined,

    cursor:
      previewMode && runtimeCommandMode === "attackMove"
        ? "crosshair"
        : "pointer",

    ...presentationEditStyle,
  };

  const dragHandleView =
    !previewMode && !isAbsolute && isSelected ? (
      <div
        style={{
          position: "absolute",
          left: 0,
          top: isLayoutContainer(component) ? "-14px" : 0,
          transform: "translate(-50%, -50%)",
          zIndex: 120,
        }}
      >
        {dragHandle}
      </div>
    ) : null;

  const componentChildren = isLayoutContainer(component)
    ? component.children
    : null;

  const sortedChildren = useMemo(() => {
    if (!componentChildren) {
      return [];
    }

    return [...componentChildren].sort((a, b) => a.order - b.order);
  }, [componentChildren]);

  if (!isStateVisible) {
    return null;
  }

  const renderChildNode = (child: LayoutComponent) => (
    <LayoutComponentNode
      previewMode={previewMode}
      canvasWidth={canvasWidth}
      isMobile={isMobile}
      component={child}
      selectedComponentIds={selectedComponentIds}
      draggingIds={draggingIds}
      droppedIds={droppedIds}
      layerSearch={layerSearch}
      activeDropTarget={activeDropTarget}
      runtimeCommandMode={runtimeCommandMode}
      setRuntimeCommandMode={setRuntimeCommandMode}
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

  const canvasComponent = component as CanvasComponent;
  let boundComponent: CanvasComponent = canvasComponent;

  if (previewMode && textBinding && "text" in canvasComponent.props) {
    boundComponent = {
      ...canvasComponent,
      props: {
        ...canvasComponent.props,
        text: String(boundText ?? ""),
      },
    } as CanvasComponent;
  }

  if (previewMode && valueBinding && "value" in canvasComponent.props) {
    boundComponent = {
      ...boundComponent,
      props: {
        ...boundComponent.props,
        value: String(boundValue ?? ""),
      },
    } as CanvasComponent;
  }

  if (component.type === "grid") {
    const children = sortedChildren;
    const columns = Math.max(1, component.props.columns ?? 2);
    const gap = component.props.gap ?? 8;

    return renderWithPositionParent(
      <div
        ref={handleComponentRef}
        data-component-id={component.id}
        style={nodeStyle}
        {...jsEventProps}
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
            transition: "opacity 120ms ease",
            outline:
              !previewMode && isSelected
                ? "2px solid #0d6efd"
                : !previewMode
                  ? "1px dashed #adb5bd"
                  : component.style?.outline,
            outlineOffset: !previewMode && isSelected ? "2px" : "-1px",
          }}
        >
          <div style={{ position: "relative", width: "100%" }}>
            {dragHandleView}

            {children.length === 0 && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: component.props.gap ?? 8,
                  width: "100%",
                  minWidth: 0,
                }}
              >
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

            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                gap,
                width: "100%",
                minWidth: 0,
                position: "relative",
              }}
            >
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

  if (
    component.type === "container" ||
    component.type === "flex" ||
    component.type === "form"
  ) {
    return (
      <ContentContainer
        previewMode={previewMode}
        canvasWidth={canvasWidth}
        isMobile={isMobile}
        component={component}
        children={sortedChildren}
        draggingIds={draggingIds}
        activeDropTarget={activeDropTarget}
        runtimeCommandMode={runtimeCommandMode}
        setRuntimeCommandMode={setRuntimeCommandMode}
        setActiveDropTarget={setActiveDropTarget}
        onLayoutChange={onLayoutChange}
        onSelect={onSelect}
        onEdit={onEdit}
        onCopy={onCopy}
        onDelete={onDelete}
        onCreate={onCreate}
        onDrop={onDrop}
        snapLayout={snapLayout}
        nodeStyle={nodeStyle}
        jsEventProps={jsEventProps}
        executeJsActions={executeJsActions}
        handleComponentRef={handleComponentRef}
        renderWithPositionParent={renderWithPositionParent}
        dragHandleView={dragHandleView}
        isPrimarySelected={isPrimarySelected}
        isSelected={isSelected}
        presentationEditStyle={presentationEditStyle}
        setEditToolbarVisible={setEditToolbarVisible}
        renderChildNode={renderChildNode}
      />
    );
  }

  return renderWithPositionParent(
    <div
      ref={handleComponentRef}
      data-component-id={component.id}
      data-runtime-unit-id={component.id}
      data-runtime-unit-config={
        component.runtimeUnit?.enabled
          ? JSON.stringify(component.runtimeUnit)
          : undefined
      }
      style={nodeStyle}
      {...jsEventProps}
      onClick={(event) => {
        executeJsActions("click", event);

        if (!previewMode) {
          return;
        }

        const clickedUnit = runtimeUnits.get(component.id);

        if (clickedUnit) {
          const selectedIds = runtimeUnits.getSelected();

          const selectedUnits = selectedIds
            .map((id) => runtimeUnits.get(id))
            .filter(
              (
                unit,
              ): unit is NonNullable<ReturnType<typeof runtimeUnits.get>> =>
                Boolean(unit),
            );

          const canAttack = selectedUnits.some(
            (unit) => unit.team !== clickedUnit.team,
          );

          if (canAttack) {
            runtimeUnits.attackSelected(clickedUnit.id);
          } else {
            runtimeUnits.select(clickedUnit.id, event.shiftKey);
          }

          event.preventDefault();
          event.stopPropagation();

          return;
        }
      }}
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
        <CanvasComponentContent component={boundComponent} />
      </DivBox>
    </div>,
  );
}

export default memo(LayoutComponentNode);
