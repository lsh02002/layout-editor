import { useEditorConfig } from "../../../../context/usehooks";
import type { LayoutComponent } from "../../../../types/types";
import { renderComponentEditor } from "../../registry/componentRegistry";

type Props = {
  component: LayoutComponent;
  updateComponent: (
    updater: (component: LayoutComponent) => LayoutComponent,
  ) => void;
};

function EditBasicTab({ component, updateComponent }: Props) {
  const { components: componentRegistry } = useEditorConfig();
  
  return (
    <>
      <div className="mb-3">
        <label className="form-label">타입</label>

        <input
          type="text"
          className="form-control"
          value={component.type}
          disabled
        />
      </div>

      {renderComponentEditor(componentRegistry, { component, updateComponent })}
    </>
  );
}

export default EditBasicTab;
