import { type RefObject } from "react";

type Props = {
  disabled?: boolean;
  title?: string;
  scrollTarget?: RefObject<HTMLElement>; // 🔥 추가
  zIndex?: number;
};

const ScrollToTopButton = ({
  disabled,
  title = "↑",
  scrollTarget,
  zIndex = 400,
}: Props) => {
  const handleClick = () => {
    if (scrollTarget?.current) {
      // 👉 modal 같은 특정 영역 스크롤
      scrollTarget.current.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } else {
      // 👉 기본: window 스크롤
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  return (
    <button
      type="button"
      className="btn btn-secondary rounded-circle position-fixed d-flex align-items-center justify-content-center p-0"
      disabled={disabled}
      onClick={handleClick}
      style={{
        width: "50px",
        height: "50px",
        right: "10px",
        bottom: "80px",
        zIndex: zIndex,
      }}
    >
      {title}
    </button>
  );
};

export default ScrollToTopButton;
