import {
  useCallback,
  useState,
  type HTMLAttributes,
  type MouseEventHandler,
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
}

function DivBox({
  children,
  layout,
  onEdit,
  onCopy,
  onDelete,
  className = "",
  style,
  ...props
}: DivBoxProps) {
  const [over, setOver] = useState(false);

  const handleMouseMove: MouseEventHandler<HTMLDivElement> = (event) => {
    const target = event.target as HTMLElement;

    // 현재 마우스 위치에서 가장 가까운 DivBox
    const closestDivBox = target.closest("[data-layout-box]");

    // 가장 가까운 DivBox가 자기 자신일 때만 메뉴 표시
    setOver(closestDivBox === event.currentTarget);
  };

  const handleMouseLeave: MouseEventHandler<HTMLDivElement> = () => {
    setOver(false);
  };

  const handleEdit = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      onEdit?.();
    },
    [onEdit],
  );

  const handleCopy = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      onCopy?.();
    },
    [onCopy],
  );

  const handleDelete = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      onDelete?.();
    },
    [onDelete],
  );

  return (
    <div
      {...props}
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
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {over && (
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
