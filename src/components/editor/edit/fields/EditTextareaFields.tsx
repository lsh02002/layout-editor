import type { CSSProperties } from "react";

import EditComponentNameField from "./EditComponentNameField";

type Props = {
  componentName: string;
  value: string;
  placeholder: string;
  contentStyle: CSSProperties;
  onComponentNameChange: (value: string) => void;
  onValueChange: (value: string) => void;
  onPlaceholderChange: (value: string) => void;
};

function EditTextareaFields({
  componentName,
  value,
  placeholder,
  contentStyle,
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

        <textarea
          className="form-control"
          rows={5}
          value={value}
          style={contentStyle}
          placeholder={placeholder}
          onChange={(event) => onValueChange(event.target.value)}
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

export default EditTextareaFields;
