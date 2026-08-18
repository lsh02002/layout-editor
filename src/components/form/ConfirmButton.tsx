import React from "react";

const ConfirmButton = ({
  disabled,
  title,
  style,
  onClick,
}: {
  disabled?: boolean;
  title: string;
  style?: React.CSSProperties;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
}) => {
  return (
    <button
      type="button"
      className="btn btn-primary w-100 mt-4"
      style={style}
      disabled={disabled}
      onClick={onClick}
    >
      {title}
    </button>
  );
};

export default ConfirmButton;
