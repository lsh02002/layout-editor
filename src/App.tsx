import DivBox from "./components/layout/DivBox";
import QuillEditBox from "./components/layout/QuillEditBox";
import ImageEditBox from "./components/layout/ImageBox";
import ButtonBox from "./components/layout/ButtonBox";
import TextAreaBox from "./components/layout/TextAreaBox";

function App() {
  return (
    <>
      <DivBox className="m-3">
        <div>안녕하세요</div>
        <DivBox className="m-3">
          <div>반가워요</div>
        </DivBox>
        <DivBox className="m-3">
          <div style={{ width: "200px", height: "200px" }}>반가워요</div>
        </DivBox>
        <TextAreaBox />
        <QuillEditBox />
        <ImageEditBox />
        <ButtonBox />
      </DivBox>
    </>
  );
}

export default App;
