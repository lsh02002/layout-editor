import { useState } from "react";
import { useModalManager } from "../../usehooks/usehooks";
import DivBox from "./DivBox";
import TextAreaInput from "../form/TextAreaInput";

const TextAreaBox = () => {
  const { openModal } = useModalManager();
  const [data, setData] = useState("");

  const onEdit = () => {
    openModal("textareabox");
  };

  const onCopy = () => {
    console.log("Copy clicked");
  };

  const onDelete = () => {
    console.log("Delete clicked");
  };

  return (
    <DivBox onEdit={onEdit} onCopy={onCopy} onDelete={onDelete}>
      <TextAreaInput
        name="textareabox"
        rows={6}
        data={data}
        setData={setData}
      />
    </DivBox>
  );
};

export default TextAreaBox;
