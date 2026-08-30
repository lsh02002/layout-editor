import type { HeadingLevel } from "../../../../types/types";

type Props = {
  value: string;
  level: HeadingLevel;
  onValueChange: (value: string) => void;
  onLevelChange: (value: HeadingLevel) => void;
};

function EditHeadingFields({
  value,
  level,
  onValueChange,
  onLevelChange,
}: Props) {
  return (
    <>
      <div className="mb-3">
        <label className="form-label">제목</label>

        <input
          type="text"
          className="form-control"
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
        />
      </div>

      <div className="mb-3">
        <label className="form-label">Heading Level</label>

        <select
          className="form-select"
          value={level}
          onChange={(event) =>
            onLevelChange(Number(event.target.value) as HeadingLevel)
          }
        >
          <option value={1}>H1</option>
          <option value={2}>H2</option>
          <option value={3}>H3</option>
          <option value={4}>H4</option>
          <option value={5}>H5</option>
          <option value={6}>H6</option>
        </select>
      </div>
    </>
  );
}

export default EditHeadingFields;
