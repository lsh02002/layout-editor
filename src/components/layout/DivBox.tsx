import {
  useCallback,
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
  layout?: ComponentLayout;

  onLayoutChange?: (layout: Partial<ComponentLayout>) => void;

  onEdit?: () => void;
  onCopy?: () => void;
  onDelete?: () => void;

  previewMode?: boolean;
}

function DivBox({
  children,
  layout,
  onEdit,
  onCopy,
  onDelete,
  className = "",
  style,
  previewMode = false,
}: DivBoxProps) {
  const [over, setOver] = useState(false);

  const handleMouseMove: MouseEventHandler<HTMLDivElement> = (event) => {
    const target = event.target as HTMLElement;
    const closestDivBox = target.closest("[data-layout-box]");

    setOver(closestDivBox === event.currentTarget);
  };

  const handleMouseLeave: MouseEventHandler<HTMLDivElement> = () => {
    setOver(false);
  };

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

  const handleEdit = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();

      onEdit?.();
    },
    [onEdit],
  );

  const handleCopy = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();

      onCopy?.();
    },
    [onCopy],
  );

  const handleDelete = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();

      onDelete?.();
    },
    [onDelete],
  );

  const handleDoubleClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
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

  const handlePointerUp = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (event.pointerType === "mouse") {
        return;
      }
      event.stopPropagation();

      if (!isOwnDivBox(event.target, event.currentTarget)) {
        return;
      }

      onEdit?.();
    },
    [onEdit],
  );

  return (
    <div
      data-layout-box
      className={`d-inline-block ${className} bg-white`}
      style={{
        position:
          layout?.x !== undefined || layout?.y !== undefined
            ? "absolute"
            : "relative",

        left: layout?.x,
        top: layout?.y,

        width: layout?.width,
        height: layout?.height,

        outline: over ? "1px solid var(--bs-primary)" : "1px solid transparent",

        ...style,
      }}
      onDoubleClick={handleDoubleClick}
      onPointerUp={handlePointerUp}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {over && !previewMode && (
        <div
          className="position-absolute end-0 top-0 text-white"
          style={{
            background: "var(--bs-primary)",
            padding: "2px 8px",
            zIndex: 100,
            // transform: "translateY(-100%)",
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
