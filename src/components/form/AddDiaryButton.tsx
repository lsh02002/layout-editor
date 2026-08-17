import { useLocation, useNavigate } from "react-router-dom";

const AddDiaryButton = ({
  disabled,
  title = "+",
}: {
  disabled?: boolean;
  title?: string;
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = () => {
    if (location.pathname !== "/create") {
      navigate("/create");
    }
  };

  return (
    <button
      type="button"
      className="btn btn-info rounded-circle position-fixed d-flex align-items-center justify-content-center p-0"
      disabled={disabled}
      onClick={handleClick}
      style={{
        width: "50px",
        height: "50px",
        right: "10px",
        bottom: "80px",
        zIndex: 200,
      }}
    >
      {title}
    </button>
  );
};

export default AddDiaryButton;
