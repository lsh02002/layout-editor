import {
  useState,
  type HTMLAttributes,
  type MouseEventHandler,
  type ReactNode,
} from "react";
import EditMenuBox from "./EditMenuBox";

interface DivBoxProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  onEdit?: () => void;
  onCopy?: () => void;
  onDelete?: () => void;
}

function DivBox({
  children,
  onEdit,
  onCopy,
  onDelete,
  className = "",
  style,
  ...props
}: DivBoxProps) {
  const [over, setOver] = useState(false);

  const handleMouseOver: MouseEventHandler<HTMLDivElement> = (event) => {
    event.stopPropagation();
    setOver(true);
  };

  const handleMouseOut: MouseEventHandler<HTMLDivElement> = (event) => {
    event.stopPropagation();
    setOver(false);
  };

  const handleClick = (
      e: React.MouseEvent<HTMLButtonElement>,
      callback?: () => void,
    ) => {
      // HoverBox나 부모 컴포넌트의 클릭 이벤트 방지
      e.stopPropagation();
      callback?.();
    };

  return (
    <div
      {...props}
      className={`d-inline-block position-relative ${className} bg-white`}
      style={{
        outline: over ? "1px solid var(--bs-primary)" : "1px solid transparent",
        ...style,
      }}
      onMouseOver={handleMouseOver}
      onMouseOut={handleMouseOut}
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
            onEdit={(e) => handleClick(e, onEdit)}
            onCopy={(e) => handleClick(e, onCopy)}
            onDelete={(e) => handleClick(e, onDelete)}
          />
        </div>
      )}

      {children}
    </div>
  );
}

export default DivBox;
