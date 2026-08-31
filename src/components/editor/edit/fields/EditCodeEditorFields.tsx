import type { CodeLanguage } from "../../../../types/types";
import CodeEditor from "../../utils/codeEditor";
import EditComponentNameField from "./EditComponentNameField";

type Props = {
  componentName: string;
  value: string;
  language: CodeLanguage;

  onComponentNameChange: (value: string) => void;
  onValueChange: (value: string) => void;
  onLanguageChange: (value: CodeLanguage) => void;
};

function EditCodeEditorFields({
  componentName,
  value,
  language,
  onComponentNameChange,
  onValueChange,
  onLanguageChange,
}: Props) {
  return (
    <>
      <EditComponentNameField
        value={componentName}
        onChange={onComponentNameChange}
      />

      <div className="mb-3">
        <label className="form-label">Language</label>

        <select
          className="form-select"
          value={language}
          onChange={(e) => onLanguageChange(e.target.value as CodeLanguage)}
        >
          <option value="javascript">JavaScript</option>
          <option value="typescript">TypeScript</option>
          <option value="html">HTML</option>
          <option value="css">CSS</option>
          <option value="json">JSON</option>
        </select>
      </div>

      <div className="mb-3">
        <label className="form-label">Code</label>

        <div className="border rounded overflow-hidden">
          <CodeEditor
            data={value}
            setData={onValueChange}
            language={language}
            height="320px"
          />
        </div>
      </div>
    </>
  );
}

export default EditCodeEditorFields;
