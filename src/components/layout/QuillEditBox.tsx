import DivBox from "./DivBox";
import QuillEditorInput from "../form/QuillEditorInput";
import { useState } from "react";
import { useModalManager } from "../../usehooks/usehooks";

const QuillEditBox = () => {
  const { openModal } = useModalManager();
  const [data, setData] = useState("");

  const onEdit = () => {    
    openModal("quilleditbox");
  };

  const onCopy = () => {
    console.log("Copy clicked");
  };

  const onDelete = () => {
    console.log("Delete clicked");
  };

  return (
    <DivBox onEdit={onEdit} onCopy={onCopy} onDelete={onDelete}>
      <QuillEditorInput
        name="quilleditbox"        
        data={data}
        setData={setData}
      />
    </DivBox>
  );
};

export default QuillEditBox;
