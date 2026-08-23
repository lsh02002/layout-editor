import type { DragEvent, PointerEvent } from "react";
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

export default function LayoutComponentNode(props: Props) {
  const { component } = props;
  const isDragging = props.draggingId === component.id;

  const dragHandle = (
    <ComponentDragHandle
      component={component}
      draggingId={props.draggingId}
      layerSearch={props.layerSearch}
      onDragStart={props.onDragStart}
      onDragEnd={props.onDragEnd}
      onPointerDragStart={props.onPointerDragStart}
      onPointerDragMove={props.onPointerDragMove}
      onPointerDragEnd={props.onPointerDragEnd}
      onPointerDragCancel={props.onPointerDragCancel}
    />
  );

  const commonBoxProps = {
    layout: component.layout,
    onLayoutChange: (layout: Partial<ComponentLayout>) =>
      props.onLayoutChange(component.id, layout),
    onEdit: () => props.onEdit(component.id),
    onCopy: () => props.onCopy(component.id),
    onDelete: () => props.onDelete(component.id),
  };

  if (component.type === "container") {
    const children = [...component.children].sort((a, b) => a.order - b.order);
    const direction: ContainerDirection = component.props.direction ?? "column";
    const isRow = direction === "row";

    return (
      <div
        data-component-id={component.id}
        style={{
          opacity: isDragging ? 0.45 : 1,
          transition: "opacity 100ms ease",
        }}
      >
        {dragHandle}
        <DivBox
          {...commonBoxProps}
          style={{
            ...component.style,
            outline:
              props.selectedComponentId === component.id
                ? "2px solid #0d6efd"
                : component.style?.outline,
            outlineOffset:
              props.selectedComponentId === component.id
                ? 3
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
              parentId={component.id}
              index={0}
              direction={direction}
              draggingId={props.draggingId}
              activeDropTarget={props.activeDropTarget}
              setActiveDropTarget={props.setActiveDropTarget}
              onDrop={props.onDrop}
              onCreate={props.onCreate}
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
                <LayoutComponentNode {...props} component={child} />
                {child.type !== "scrollToTopButton" && !isRow && (
                  <CanvasDropZone
                    parentId={component.id}
                    index={index + 1}
                    direction={direction}
                    draggingId={props.draggingId}
                    activeDropTarget={props.activeDropTarget}
                    setActiveDropTarget={props.setActiveDropTarget}
                    onDrop={props.onDrop}
                    onCreate={props.onCreate}
                  />
                )}
              </div>
            ))}

            {isRow && (
              <CanvasDropZone
                parentId={component.id}
                index={children.length}
                direction={direction}
                draggingId={props.draggingId}
                activeDropTarget={props.activeDropTarget}
                setActiveDropTarget={props.setActiveDropTarget}
                onDrop={props.onDrop}
                onCreate={props.onCreate}
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
      style={{
        opacity: isDragging ? 0.45 : 1,
        transition: "opacity 100ms ease",
      }}
    >
      {dragHandle}
      <DivBox
        {...commonBoxProps}
        style={{
          ...component.style,
          outline:
            props.selectedComponentId === component.id
              ? "2px solid #0d6efd"
              : component.style?.outline,
          outlineOffset:
            props.selectedComponentId === component.id
              ? "2px"
              : component.style?.outlineOffset,
        }}
      >
        <CanvasComponentContent component={component} />
      </DivBox>
    </div>
  );
}
