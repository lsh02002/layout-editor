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

import type { ComponentLayout } from "../../types/types";

interface DivBoxProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  previewMode?: boolean;
  layout?: ComponentLayout;
  onLayoutChange?: (layout: Partial<ComponentLayout>) => void;
  onEdit?: () => void;
  onCopy?: () => void;
  onDelete?: () => void;
}

type PositionDragState = {
  pointerId: number;
  startX: number;
  startY: number;
  originalX: number;
  originalY: number;
};

function DivBox({
  children,
  previewMode = false,
  layout,
  onLayoutChange,
  onEdit,
  onCopy,
  onDelete,
  className = "",
  style,
}: DivBoxProps) {
  const [over, setOver] = useState(false);
  const [moving, setMoving] = useState(false);
  const positionDragRef = useRef<PositionDragState | null>(null);
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
  };

  const handleMouseLeave: MouseEventHandler<HTMLDivElement> = () => {
    setOver(false);
  };

  const handleDoubleClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (previewMode) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      if (!isOwnDivBox(event.target, event.currentTarget)) {
        return;
      }
      onEdit?.();
    },
    [onEdit, previewMode],
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

  /*
   * 자유 위치 이동 시작
   */
  const handlePositionPointerDown = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      if (previewMode || !isAbsolute || !onLayoutChange) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      event.currentTarget.setPointerCapture(event.pointerId);

      positionDragRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        originalX: layout?.x ?? 0,
        originalY: layout?.y ?? 0,
      };

      setMoving(true);
    },
    [isAbsolute, layout?.x, layout?.y, onLayoutChange, previewMode],
  );

  const handlePositionPointerMove = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      const drag = positionDragRef.current;

      if (!drag || !onLayoutChange) {
        return;
      }

      if (drag.pointerId !== event.pointerId) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const deltaX = event.clientX - drag.startX;
      const deltaY = event.clientY - drag.startY;

      onLayoutChange({
        x: drag.originalX + deltaX,
        y: drag.originalY + deltaY,
      });
    },
    [onLayoutChange],
  );

  const handlePositionPointerUp = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      const drag = positionDragRef.current;

      if (!drag) {
        return;
      }

      if (drag.pointerId !== event.pointerId) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      positionDragRef.current = null;

      setMoving(false);
    },
    [],
  );

  const handlePositionPointerCancel = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      event.stopPropagation();

      positionDragRef.current = null;

      setMoving(false);
    },
    [],
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

      onEdit?.();
    },
    [onEdit, previewMode],
  );

  return (
    <div
      data-layout-box
      className={`
        d-inline-block
        ${className}
        bg-white
      `}
      onDoubleClick={handleDoubleClick}
      onPointerUp={handlePointerUp}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        position: "relative",
        width: layout?.width,
        height: layout?.height,
        outline:
          !previewMode && over
            ? "1px solid var(--bs-primary)"
            : "1px solid transparent",
        ...style,
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
            background: "var(--bs-primary)",
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
    </div>
  );
}

export default DivBox;
