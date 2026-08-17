import ScrollToTopButton from "../form/ScrollToTopButton";
import DivBox from "./DivBox";

const ScrollToTopButtonBox = () => {
  return (
    <DivBox
      className="position-fixed bottom-0 end-0 m-3"
      style={{ zIndex: 100 }}
    >
      <ScrollToTopButton />
    </DivBox>
  );
};

export default ScrollToTopButtonBox;
