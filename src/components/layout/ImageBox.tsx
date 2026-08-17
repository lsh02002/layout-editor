import { useState } from "react";
import { useModalManager } from "../../usehooks/usehooks";
import DivBox from "./DivBox";
import ImageInput from "../form/ImageInput";

const ImageBox = () => {
  const { openModal } = useModalManager();
  const [data, setData] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const onEdit = () => {
    openModal("imagebox");
  };

  const onCopy = () => {
    console.log("Copy clicked");
  };

  const onDelete = () => {
    console.log("Delete clicked");
  };

  return (
    <DivBox onEdit={onEdit} onCopy={onCopy} onDelete={onDelete}>
      <ImageInput
        name="imagebox"        
        data={data}
        setData={setData}
        previewUrls={previewUrls}
        setPreviewUrls={setPreviewUrls}
      />
    </DivBox>
  );
};

export default ImageBox;
