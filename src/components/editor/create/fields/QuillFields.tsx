import type { Dispatch, SetStateAction } from "react";

import QuillEditorSimpleInput from "../../../form/QuillEditorSimpleInput";
import ComponentNameField from "./ComponentNameField";

type Props = {
  componentName: string;
  value: string;
  placeholder: string;
  onComponentNameChange: (value: string) => void;
  onValueChange: Dispatch<SetStateAction<string>>;
  onPlaceholderChange: (value: string) => void;
};

function QuillFields({
  componentName,
  value,
  placeholder,
  onComponentNameChange,
  onValueChange,
  onPlaceholderChange,
}: Props) {
  return (
    <>
      <ComponentNameField
        value={componentName}
        onChange={onComponentNameChange}
      />

      <div className="mb-3">
        <label className="form-label">Edit</label>

        <QuillEditorSimpleInput
          data={value}
          placeholder={placeholder || "본문을 입력하세요."}
          setData={onValueChange}
        />
      </div>

      <div className="mb-3">
        <label className="form-label">Placeholder</label>

        <input
          type="text"
          className="form-control"
          value={placeholder}
          onChange={(event) => onPlaceholderChange(event.target.value)}
          placeholder="내용을 입력하세요."
        />
      </div>
    </>
  );
}

export default QuillFields;
