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
  onLayoutChange?: (
    layout: Partial<ComponentLayout>,
    recordHistory?: boolean,
  ) => void;
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
  currentX?: number;
  currentY?: number;
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

      const x = drag.originalX + deltaX;
      const y = drag.originalY + deltaY;

      drag.currentX = x;
      drag.currentY = y;

      onLayoutChange?.(
        {
          x,
          y,
        },
        false,
      );
    },
    [onLayoutChange],
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
          x: drag.originalX,
          y: drag.originalY,
        },
        false,
      );

      onLayoutChange?.(
        {
          x: drag.currentX,
          y: drag.currentY,
        },
        true,
      );

      positionDragRef.current = null;
      setMoving(false);
    },
    [onLayoutChange],
  );

  const handlePositionPointerCancel = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      const drag = positionDragRef.current;

      event.stopPropagation();

      if (!drag) {
        return;
      }

      onLayoutChange?.(
        {
          x: drag.originalX,
          y: drag.originalY,
        },
        false,
      );

      positionDragRef.current = null;
      setMoving(false);
    },
    [onLayoutChange],
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
      onClick={handleClick}
      onPointerUp={handlePointerUp}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        position: "relative",
        width: layout?.width ?? (isAbsolute ? "max-content" : undefined),
        maxWidth: isAbsolute ? "none" : undefined,
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
