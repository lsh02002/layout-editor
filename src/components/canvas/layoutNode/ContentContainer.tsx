import type {
  ComponentProps,
  CSSProperties,
  HTMLAttributes,
  ReactNode,
  RefCallback,
  SyntheticEvent,
} from "react";
import DivBox from "../DivBox";
import CanvasDropZone, { type CanvasDropTarget } from "../CanvasDropZone";
import type {
  ComponentLayout,
  ContainerDirection,
  LayoutComponent,
} from "../../../types/types";
import { useRuntimeSelection } from "./useRuntimeSelection";

type RuntimeContainerComponent = Extract<
  LayoutComponent,
  {
    type: "container" | "flex" | "form";
  }
>;

type Props = {
  previewMode: boolean;
  canvasWidth: number;
  isMobile: boolean;
  component: RuntimeContainerComponent;
  children: LayoutComponent[];
  draggingIds: string[];
  activeDropTarget: CanvasDropTarget | null;
  runtimeCommandMode: string | null;
  setRuntimeCommandMode: (value: string | null) => void;
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
  onDrop: ComponentProps<typeof CanvasDropZone>["onDrop"];
  snapLayout: (layout: Partial<ComponentLayout>) => Partial<ComponentLayout>;
  nodeStyle: CSSProperties;
  jsEventProps: HTMLAttributes<HTMLDivElement>;
  executeJsActions: (
    eventName: string,
    event: SyntheticEvent<HTMLElement>,
  ) => void;
  handleComponentRef: RefCallback<HTMLDivElement>;
  renderWithPositionParent: (node: ReactNode) => ReactNode;
  dragHandleView: ReactNode;
  isPrimarySelected: boolean;
  isSelected: boolean;
  presentationEditStyle: CSSProperties;
  setEditToolbarVisible: (visible: boolean) => void;
  renderChildNode: (child: LayoutComponent) => ReactNode;
};

export default function ContentContainer({
  previewMode,
  canvasWidth,
  isMobile,
  component,
  children,
  draggingIds,
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
  snapLayout,
  nodeStyle,
  jsEventProps,
  executeJsActions,
  handleComponentRef,
  renderWithPositionParent,
  dragHandleView,
  isPrimarySelected,
  isSelected,
  presentationEditStyle,
  setEditToolbarVisible,
  renderChildNode,
}: Props) {
  const originalDirection: ContainerDirection =
    component.props.direction ??
    (component.type === "container" || component.type === "flex"
      ? "row"
      : "column");

  const direction: ContainerDirection =
    (isMobile || canvasWidth <= 420) && originalDirection === "row"
      ? "column"
      : originalDirection;

  const isRow = direction === "row";
  const justifyContent =
    component.props.justifyContent ??
    (component.type === "container" ? "space-between" : "flex-start");
  const alignItems = component.props.alignItems ?? "stretch";

  const {
    runtimeSelectionVisible,
    runtimeSelectionRect,
    onContextMenu,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
  } = useRuntimeSelection({
    previewMode,
    runtimeCommandMode,
    setRuntimeCommandMode,
  });

  const containerContent = (
    <>
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
          : isMobile
            ? {
                width: "100%",
                minWidth: 0,
                maxWidth: "100%",
                flex: "0 0 auto",
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
                        : "0 1 auto",

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
    </>
  );

  return renderWithPositionParent(
    <div
      ref={handleComponentRef}
      data-component-id={component.id}
      style={nodeStyle}
      {...jsEventProps}
      onClick={(event) => executeJsActions("click", event)}
      onContextMenu={onContextMenu}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
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

          ...presentationEditStyle,
        }}
      >
        <div style={{ position: "relative", width: "100%" }}>
          {dragHandleView}

          {previewMode && runtimeSelectionVisible && runtimeSelectionRect && (
            <div
              style={{
                position: "absolute",
                left: runtimeSelectionRect.left,
                top: runtimeSelectionRect.top,
                width: runtimeSelectionRect.width,
                height: runtimeSelectionRect.height,
                border: "1px solid #38bdf8",
                background: "rgba(56, 189, 248, 0.15)",
                pointerEvents: "none",
                zIndex: 9999,
              }}
            />
          )}

          {component.type === "form" ? (
            <form
              action={component.props.action || undefined}
              method={component.props.method ?? "post"}
              onSubmit={(event) => {
                event.preventDefault();
              }}
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
              {containerContent}
            </form>
          ) : (
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
              {containerContent}
            </div>
          )}
        </div>
      </DivBox>
    </div>,
  );
}
