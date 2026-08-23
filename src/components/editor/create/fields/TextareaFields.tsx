import ComponentNameField from "./ComponentNameField";

type Props = {
  componentName: string;
  value: string;
  placeholder: string;
  onComponentNameChange: (value: string) => void;
  onValueChange: (value: string) => void;
  onPlaceholderChange: (value: string) => void;
};

function TextareaFields({
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

        <input
          type="text"
          className="form-control"
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          placeholder="내용을 입력하세요."
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

export default TextareaFields;
