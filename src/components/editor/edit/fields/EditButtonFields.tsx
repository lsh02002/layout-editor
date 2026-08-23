import EditComponentNameField from "./EditComponentNameField";

type Props = {
  componentName: string;
  title: string;
  placeholder?: string;
  onComponentNameChange: (value: string) => void;
  onTitleChange: (value: string) => void;
};

function EditButtonFields({
  componentName,
  title,
  placeholder = "버튼",
  onComponentNameChange,
  onTitleChange,
}: Props) {
  return (
    <>
      <EditComponentNameField
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
          placeholder={placeholder}
        />
      </div>
    </>
  );
}

export default EditButtonFields;
