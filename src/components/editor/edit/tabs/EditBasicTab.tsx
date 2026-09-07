import type { LayoutComponent } from "../../../../types/types";
import type { ComponentRegistry } from "../../registry/componentRegistry";
import { renderComponentEditor } from "../../registry/componentRegistry";

type Props = {
  componentRegistry: ComponentRegistry;
  component: LayoutComponent;

  updateComponent: (
    updater: (component: LayoutComponent) => LayoutComponent,
  ) => void;
};

function EditBasicTab({
  componentRegistry,
  component,
  updateComponent,
}: Props) {
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
