import {
  useCallback,
  useRef,
  useState,
  type HTMLAttributes,
  type MouseEvent,
  type MouseEventHandler,
  type PointerEvent,
  type ReactNode,
} from "react";

import EditMenuBox from "./EditMenuBox";

import type { ComponentLayout } from "../../../types/types";
import { resolveHeight, resolveWidth } from "../utils/layoutSize";

import { GripHorizontal, GripVertical } from "lucide-react";

interface DivBoxProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  previewMode?: boolean;
  isSelected?: boolean;
  layout?: ComponentLayout;
  positionContextId?: string | null;
  onLayoutChange?: (
    layout: Partial<ComponentLayout>,
    recordHistory?: boolean,
  ) => void;
  onComponentSelect?: (multiSelect?: boolean) => void;
  onEdit?: () => void;
  onCopy?: () => void;
  onDelete?: () => void;
  onToolbarVisibleChange?: (visible: boolean) => void;
  snapLayout: (layout: Partial<ComponentLayout>) => Partial<ComponentLayout>;
}

type PositionDragState = {
  pointerId: number;
  startX: number;
  startY: number;
  originalX: number;
  originalY: number;
  currentX: number;
  currentY: number;
};

type ResizeDirection =
  | "left"
  | "right"
  | "top"
  | "bottom"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

type ResizeDragState = {
  pointerId: number;
  direction: ResizeDirection;
  startX: number;
  startY: number;
  originalWidth: number;
  originalHeight: number;
  originalX: number;
  originalY: number;
  currentWidth: number;
  currentHeight: number;
  currentX: number;
  currentY: number;
};

function DivBox({
  children,
  previewMode = false,
  layout,
  isSelected,
  positionContextId,
  onLayoutChange,
  onComponentSelect,
  onEdit,
  onCopy,
  onDelete,
  onToolbarVisibleChange,
  snapLayout,
  className = "",
  style,
}: DivBoxProps) {
  const [over, setOver] = useState(false);
  const [moving, setMoving] = useState(false);
  const positionDragRef = useRef<PositionDragState | null>(null);
  const positionElementRef = useRef<HTMLElement | null>(null);

  const resizeDragRef = useRef<ResizeDragState | null>(null);
  const resizeElementRef = useRef<HTMLElement | null>(null);

  const canResizeWidth = layout?.widthMode === "fixed";
  const canResizeHeight = layout?.heightMode === "fixed";

  const isAbsolute = layout?.position === "absolute";

  const isOwnDivBox = (
    target: EventTarget | null,
    currentTarget: HTMLElement,
  ) => {
    const element = target as HTMLElement | null;

    if (!element) {
      return false;
    }
    const closestDivBox = element.closest<HTMLElement>("[data-layout-box]");

    return closestDivBox === currentTarget;
  };

  const handleMouseMove: MouseEventHandler<HTMLDivElement> = (event) => {
    if (previewMode) {
      return;
    }

    const target = event.target as HTMLElement;
    const closestDivBox = target.closest("[data-layout-box]");
    setOver(closestDivBox === event.currentTarget);
    onToolbarVisibleChange?.(closestDivBox === event.currentTarget);
  };

  const handleMouseLeave: MouseEventHandler<HTMLDivElement> = () => {
    setOver(false);
    onToolbarVisibleChange?.(false);
  };

  const handleClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (previewMode) {
        return;
      }

      if (!isOwnDivBox(event.target, event.currentTarget)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const multiSelect = event.ctrlKey || event.metaKey;

      onComponentSelect?.(multiSelect);
    },
    [onComponentSelect, previewMode],
  );

  const handleEdit = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();

      if (previewMode) {
        return;
      }
      onEdit?.();
    },
    [onEdit, previewMode],
  );

  const handleCopy = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();

      if (previewMode) {
        return;
      }
      onCopy?.();
    },
    [onCopy, previewMode],
  );

  const handleDelete = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();

      if (previewMode) {
        return;
      }

      onDelete?.();
    },
    [onDelete, previewMode],
  );

  const handlePositionPointerDown = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      if (previewMode || !isAbsolute || !onLayoutChange) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      event.currentTarget.setPointerCapture(event.pointerId);

      const x = layout?.x ?? 0;
      const y = layout?.y ?? 0;

      const layoutBox =
        event.currentTarget.closest<HTMLElement>("[data-layout-box]");

      positionElementRef.current = layoutBox?.parentElement ?? null;

      positionDragRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        originalX: x,
        originalY: y,
        currentX: x,
        currentY: y,
      };

      setMoving(true);
    },
    [isAbsolute, layout?.x, layout?.y, onLayoutChange, previewMode],
  );

  const handlePositionPointerMove = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      const drag = positionDragRef.current;

      if (!drag || drag.pointerId !== event.pointerId) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const deltaX = event.clientX - drag.startX;
      const deltaY = event.clientY - drag.startY;

      const rawX = drag.originalX + deltaX;
      const rawY = drag.originalY + deltaY;

      const snapped = snapLayout({
        x: rawX,
        y: rawY,
      }) ?? {
        x: rawX,
        y: rawY,
      };

      const x = typeof snapped.x === "number" ? snapped.x : rawX;
      const y = typeof snapped.y === "number" ? snapped.y : rawY;

      drag.currentX = x;
      drag.currentY = y;

      const element = positionElementRef.current;

      if (element) {
        element.style.left = `${x}px`;
        element.style.top = `${y}px`;
      }
    },
    [snapLayout],
  );

  const handlePositionPointerUp = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      const drag = positionDragRef.current;

      if (!drag || drag.pointerId !== event.pointerId) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      onLayoutChange?.(
        {
          x: drag.currentX,
          y: drag.currentY,
        },
        true,
      );

      positionDragRef.current = null;
      positionElementRef.current = null;
      setMoving(false);
    },
    [onLayoutChange],
  );

  const handlePositionPointerCancel = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      const drag = positionDragRef.current;

      event.stopPropagation();

      if (!drag || drag.pointerId !== event.pointerId) {
        return;
      }

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      const element = positionElementRef.current;

      if (element) {
        element.style.left = `${drag.originalX}px`;
        element.style.top = `${drag.originalY}px`;
      }

      positionDragRef.current = null;
      positionElementRef.current = null;
      setMoving(false);
    },
    [],
  );

  const handleResizePointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>, direction: ResizeDirection) => {
      if (previewMode || !onLayoutChange) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const layoutBox =
        event.currentTarget.closest<HTMLElement>("[data-layout-box]");

      if (!layoutBox) {
        return;
      }

      const rect = layoutBox.getBoundingClientRect();

      event.currentTarget.setPointerCapture(event.pointerId);

      resizeElementRef.current = layoutBox;

      resizeDragRef.current = {
        pointerId: event.pointerId,
        direction,
        startX: event.clientX,
        startY: event.clientY,
        originalWidth: rect.width,
        originalHeight: rect.height,
        originalX: layout?.x ?? 0,
        originalY: layout?.y ?? 0,
        currentWidth: rect.width,
        currentHeight: rect.height,
        currentX: layout?.x ?? 0,
        currentY: layout?.y ?? 0,
      };
    },
    [layout?.x, layout?.y, onLayoutChange, previewMode],
  );

  const handleResizePointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const drag = resizeDragRef.current;

      if (!drag || drag.pointerId !== event.pointerId) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const deltaX = event.clientX - drag.startX;
      const deltaY = event.clientY - drag.startY;

      const resizeLeft =
        drag.direction === "left" ||
        drag.direction === "top-left" ||
        drag.direction === "bottom-left";

      const resizeRight =
        drag.direction === "right" ||
        drag.direction === "top-right" ||
        drag.direction === "bottom-right";

      const resizeTop =
        drag.direction === "top" ||
        drag.direction === "top-left" ||
        drag.direction === "top-right";

      const resizeBottom =
        drag.direction === "bottom" ||
        drag.direction === "bottom-left" ||
        drag.direction === "bottom-right";

      let width = drag.originalWidth;
      let height = drag.originalHeight;

      if (resizeLeft) {
        width = Math.max(20, Math.round(drag.originalWidth - deltaX));
      }

      if (resizeRight) {
        width = Math.max(20, Math.round(drag.originalWidth + deltaX));
      }

      if (resizeTop) {
        height = Math.max(20, Math.round(drag.originalHeight - deltaY));
      }

      if (resizeBottom) {
        height = Math.max(20, Math.round(drag.originalHeight + deltaY));
      }

      let nextLayout: Partial<ComponentLayout> = {};

      if (resizeLeft || resizeRight) {
        nextLayout.width = width;
      }

      if (resizeTop || resizeBottom) {
        nextLayout.height = height;
      }

      // absolute 컴포넌트는 왼쪽/위쪽 리사이즈 시
      // 반대편 위치를 고정하기 위해 x/y도 이동
      if (isAbsolute && resizeLeft) {
        nextLayout.x = drag.originalX + (drag.originalWidth - width);
      }

      if (isAbsolute && resizeTop) {
        nextLayout.y = drag.originalY + (drag.originalHeight - height);
      }

      nextLayout = snapLayout(nextLayout) ?? nextLayout;

      if (typeof nextLayout.width === "number") {
        drag.currentWidth = nextLayout.width;
      }

      if (typeof nextLayout.height === "number") {
        drag.currentHeight = nextLayout.height;
      }

      if (typeof nextLayout.x === "number") {
        drag.currentX = nextLayout.x;
      }

      if (typeof nextLayout.y === "number") {
        drag.currentY = nextLayout.y;
      }

      // 드래그 중 실시간 렌더링
      onLayoutChange?.(nextLayout, false);
    },
    [isAbsolute, onLayoutChange, snapLayout],
  );

  const handleResizePointerUp = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const drag = resizeDragRef.current;

      if (!drag || drag.pointerId !== event.pointerId) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      const nextLayout: Partial<ComponentLayout> = {};

      const resizeLeft =
        drag.direction === "left" ||
        drag.direction === "top-left" ||
        drag.direction === "bottom-left";

      const resizeRight =
        drag.direction === "right" ||
        drag.direction === "top-right" ||
        drag.direction === "bottom-right";

      const resizeTop =
        drag.direction === "top" ||
        drag.direction === "top-left" ||
        drag.direction === "top-right";

      const resizeBottom =
        drag.direction === "bottom" ||
        drag.direction === "bottom-left" ||
        drag.direction === "bottom-right";

      if (resizeLeft || resizeRight) {
        nextLayout.width = drag.currentWidth;
      }
      if (resizeTop || resizeBottom) {
        nextLayout.height = drag.currentHeight;
      }
      if (isAbsolute && resizeLeft) {
        nextLayout.x = drag.currentX;
      }
      if (isAbsolute && resizeTop) {
        nextLayout.y = drag.currentY;
      }
      onLayoutChange?.(nextLayout, true);
      resizeDragRef.current = null;
      resizeElementRef.current = null;
    },
    [isAbsolute, onLayoutChange],
  );

  const handleResizePointerCancel = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const drag = resizeDragRef.current;

      if (!drag || drag.pointerId !== event.pointerId) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      const resizeLeft =
        drag.direction === "left" ||
        drag.direction === "top-left" ||
        drag.direction === "bottom-left";

      const resizeRight =
        drag.direction === "right" ||
        drag.direction === "top-right" ||
        drag.direction === "bottom-right";

      const resizeTop =
        drag.direction === "top" ||
        drag.direction === "top-left" ||
        drag.direction === "top-right";

      const resizeBottom =
        drag.direction === "bottom" ||
        drag.direction === "bottom-left" ||
        drag.direction === "bottom-right";

      const originalLayout: Partial<ComponentLayout> = {};

      if (resizeLeft || resizeRight) {
        originalLayout.width = drag.originalWidth;
      }

      if (resizeTop || resizeBottom) {
        originalLayout.height = drag.originalHeight;
      }

      if (isAbsolute && resizeLeft) {
        originalLayout.x = drag.originalX;
      }

      if (isAbsolute && resizeTop) {
        originalLayout.y = drag.originalY;
      }

      // 드래그 중 변경된 값을 원래 값으로 복구
      onLayoutChange?.(originalLayout, false);

      resizeDragRef.current = null;
      resizeElementRef.current = null;
    },
    [isAbsolute, onLayoutChange],
  );

  const handlePointerUp = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (event.pointerType === "mouse") {
        return;
      }

      if (previewMode) {
        return;
      }

      event.stopPropagation();
      if (!isOwnDivBox(event.target, event.currentTarget)) {
        return;
      }

      onComponentSelect?.();
    },
    [onComponentSelect, previewMode],
  );

  const resolvedWidth = resolveWidth(layout);
  const resolvedHeight = resolveHeight(layout);

  return (
    <div
      data-layout-box
      data-position-context-id={positionContextId}
      className={`
        ${layout?.widthMode === "auto" ? "d-inline-block" : "d-block"} 
        ${className}        
      `}
      onClick={handleClick}
      onPointerUp={handlePointerUp}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        ...style,
        width: resolvedWidth ?? (isAbsolute ? "max-content" : undefined),
        height: resolvedHeight,
        boxSizing: "border-box",
        maxWidth: isAbsolute ? "none" : "100%",
        position: "relative",
        outline:
          style?.outline ??
          (!previewMode && over
            ? "1px solid #6f42c1"
            : "1px solid transparent"),
        outlineOffset:
          style?.outlineOffset ?? (!previewMode && over ? "-1px" : undefined),
      }}
    >
      {!previewMode && isAbsolute && (
        <button
          type="button"
          draggable={false}
          className="
              btn
              btn-light
              btn-sm
              rounded-circle
            "
          style={{
            position: "absolute",
            left: -40,
            top: 0,
            width: 32,
            height: 32,
            minWidth: 32,
            minHeight: 32,
            padding: 0,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: moving ? "grabbing" : "move",
            touchAction: "none",
            userSelect: "none",
            WebkitUserSelect: "none",
            border: "1px solid #cbd5e1",
            color: "#64748b",
            background: "#fff",
            boxShadow: "0 2px 8px rgba(15,23,42,.10)",
            zIndex: 110,
          }}
          onDragStart={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
          onPointerDown={handlePositionPointerDown}
          onPointerMove={handlePositionPointerMove}
          onPointerUp={handlePositionPointerUp}
          onPointerCancel={handlePositionPointerCancel}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
          title="자유 위치 이동"
          aria-label="자유 위치 이동"
        >
          ✥
        </button>
      )}
      {!previewMode && over && (
        <div
          data-edit-menu
          className="
              position-absolute
              end-0
              text-white
            "
          style={{
            top: 0,
            transform: "translateY(-100%)",
            background: "#6f42c1",
            padding: "2px 8px",
            borderRadius: "6px 6px 0 0",
            whiteSpace: "nowrap",
            zIndex: 100,
          }}
        >
          <EditMenuBox
            onEdit={handleEdit}
            onCopy={handleCopy}
            onDelete={handleDelete}
          />
        </div>
      )}

      {children}

      {!previewMode && isSelected && canResizeWidth && (
        <>
          <div
            onPointerDown={(event) => handleResizePointerDown(event, "left")}
            onPointerMove={handleResizePointerMove}
            onPointerUp={handleResizePointerUp}
            onPointerCancel={handleResizePointerCancel}
            style={{
              position: "absolute",
              top: 0,
              left: -4,
              width: 8,
              height: "100%",
              cursor: "ew-resize",
              touchAction: "none",
              zIndex: 120,
            }}
          >
            <GripHorizontal
              size={14}
              strokeWidth={2}
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                padding: 2,
                borderRadius: 4,
                background: "white",
                color: "#71717a",
                boxShadow: "0 1px 3px rgba(0,0,0,0.18)",
              }}
            />
          </div>

          <div
            onPointerDown={(event) => handleResizePointerDown(event, "right")}
            onPointerMove={handleResizePointerMove}
            onPointerUp={handleResizePointerUp}
            onPointerCancel={handleResizePointerCancel}
            style={{
              position: "absolute",
              top: 0,
              right: -4,
              width: 8,
              height: "100%",
              cursor: "ew-resize",
              touchAction: "none",
              zIndex: 120,
            }}
          >
            <GripHorizontal
              size={14}
              strokeWidth={2}
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                padding: 2,
                borderRadius: 4,
                background: "white",
                color: "#71717a",
                boxShadow: "0 1px 3px rgba(0,0,0,0.18)",
              }}
            />
          </div>
        </>
      )}

      {!previewMode && isSelected && canResizeHeight && (
        <>
          <div
            onPointerDown={(event) => handleResizePointerDown(event, "top")}
            onPointerMove={handleResizePointerMove}
            onPointerUp={handleResizePointerUp}
            onPointerCancel={handleResizePointerCancel}
            style={{
              position: "absolute",
              top: -4,
              left: 0,
              width: "100%",
              height: 8,
              cursor: "ns-resize",
              touchAction: "none",
              zIndex: 120,
            }}
          >
            <GripVertical
              size={14}
              strokeWidth={2}
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                padding: 2,
                borderRadius: 4,
                background: "white",
                color: "#71717a",
                boxShadow: "0 1px 3px rgba(0,0,0,0.18)",
              }}
            />
          </div>

          <div
            onPointerDown={(event) => handleResizePointerDown(event, "bottom")}
            onPointerMove={handleResizePointerMove}
            onPointerUp={handleResizePointerUp}
            onPointerCancel={handleResizePointerCancel}
            style={{
              position: "absolute",
              bottom: -4,
              left: 0,
              width: "100%",
              height: 8,
              cursor: "ns-resize",
              touchAction: "none",
              zIndex: 120,
            }}
          >
            <GripVertical
              size={14}
              strokeWidth={2}
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                padding: 2,
                borderRadius: 4,
                background: "white",
                color: "#71717a",
                boxShadow: "0 1px 3px rgba(0,0,0,0.18)",
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}

export default DivBox;
