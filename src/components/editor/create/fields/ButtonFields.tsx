import ComponentNameField from "./ComponentNameField";

type Props = {
  componentName: string;
  title: string;
  onComponentNameChange: (value: string) => void;
  onTitleChange: (value: string) => void;
};

function ButtonFields({
  componentName,
  title,
  onComponentNameChange,
  onTitleChange,
}: Props) {
  return (
    <>
      <ComponentNameField
        value={componentName}
        onChange={onComponentNameChange}
      />

      <div className="mb-3">
        <label className="form-label">버튼 제목</label>

        <input
          type="text"
          className="form-control"
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          placeholder="버튼"
        />
      </div>
    </>
  );
}

export default ButtonFields;
