import {
  useCallback,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type MouseEventHandler,
  type ReactNode,
} from "react";
import EditMenuBox from "./EditMenuBox";
import type { ComponentLayout } from "../../types/types";

interface DivBoxProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  layout?: ComponentLayout;
  onLayoutChange?: (newLayout: Partial<ComponentLayout>) => void;
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

  const handleMouseEnter: MouseEventHandler<HTMLDivElement> = (event) => {
    event.stopPropagation();
    setOver(true);
  };

  const handleMouseLeave: MouseEventHandler<HTMLDivElement> = (event) => {
    event.stopPropagation();
    setOver(false);
  };

  const handleEdit = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      onEdit?.();
    },
    [onEdit],
  );

  const handleCopy = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      onCopy?.();
    },
    [onCopy],
  );

  const handleDelete = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      onDelete?.();
    },
    [onDelete],
  );

  const layoutStyle: CSSProperties = {
    width: layout?.width,
    height: layout?.height,

    ...(layout?.x !== undefined || layout?.y !== undefined
      ? {
          position: "absolute",
          left: layout?.x,
          top: layout?.y,
        }
      : {
          position: "relative",
        }),
  };

  return (
    <div
      {...props}
      className={`d-inline-block ${className} bg-white`}
      style={{
        ...layoutStyle,

        outline: over ? "1px solid var(--bs-primary)" : "1px solid transparent",

        ...style,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {over && (
        <div
          className="position-absolute end-0 top-0 text-white"
          style={{
            background: "var(--bs-primary)",
            padding: "2px 8px",
            zIndex: 10,
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
