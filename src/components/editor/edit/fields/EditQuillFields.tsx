import type { Dispatch, SetStateAction } from "react";

import QuillEditorSimpleInput from "../../../form/QuillEditorSimpleInput";
import EditComponentNameField from "./EditComponentNameField";

type Props = {
  componentName: string;
  value: string;
  placeholder: string;
  onComponentNameChange: (value: string) => void;
  onValueChange: Dispatch<SetStateAction<string>>;
  onPlaceholderChange: (value: string) => void;
};

function EditQuillFields({
  componentName,
  value,
  placeholder,
  onComponentNameChange,
  onValueChange,
  onPlaceholderChange,
}: Props) {
  return (
    <>
      <EditComponentNameField
        value={componentName}
        onChange={onComponentNameChange}
      />

      <div className="mb-3">
        <label className="form-label">내용</label>

        <QuillEditorSimpleInput data={value} setData={onValueChange} />
      </div>

      <div className="mb-3">
        <label className="form-label">Placeholder</label>

        <input
          type="text"
          className="form-control"
          value={placeholder}
          onChange={(event) => onPlaceholderChange(event.target.value)}
          placeholder="본문을 입력하세요."
        />
      </div>
    </>
  );
}

export default EditQuillFields;
