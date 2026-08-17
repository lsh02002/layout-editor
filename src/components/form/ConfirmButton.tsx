import React from "react";

const ConfirmButton = ({
  disabled,
  title,
  onClick,
}: {
  disabled?: boolean;
  title: string;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
}) => {
  return (
    <button type="button" className="btn btn-primary w-100 mt-4" disabled={disabled} onClick={onClick}>
      {title}
    </button>
  );
};

export default ConfirmButton;
