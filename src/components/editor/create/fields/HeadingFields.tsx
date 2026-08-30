import type { HeadingLevel } from "../../../../types/types";

type Props = {
  text: string;
  level: HeadingLevel;
  onTextChange: (value: string) => void;
  onLevelChange: (value: HeadingLevel) => void;
};

function HeadingFields({ text, level, onTextChange, onLevelChange }: Props) {
  return (
    <>
      <div className="mb-3">
        <label className="form-label">제목</label>

        <input
          type="text"
          className="form-control"
          value={text}
          onChange={(event) => onTextChange(event.target.value)}
          placeholder="제목을 입력하세요"
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

export default HeadingFields;
