import type { LayoutComponent } from "../../../../types/types";
import type { ComponentRegistry } from "../../registry/componentRegistry";
import {
  getComponentDefinition,
  renderComponentEditor,
} from "../../registry/componentRegistry";

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
  const definition = getComponentDefinition(componentRegistry, component.type);
  const supportsDisabled = definition.supportsDisabled === true;

  const disabled =
    "disabled" in component.props && component.props.disabled === true;

  const handleDisabledChange = (value: boolean) => {
    updateComponent((current) => {
      if (!("disabled" in current.props)) {
        return current;
      }

      return {
        ...current,

        props: {
          ...current.props,
          disabled: value,
        },
      } as LayoutComponent;
    });
  };

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

      {supportsDisabled && (
        <div className="form-check mb-3 mt-3">
          <input
            id="editDisabled"
            type="checkbox"
            className="form-check-input"
            checked={disabled}
            onChange={(event) => {
              handleDisabledChange(event.target.checked);
            }}
          />

          <label className="form-check-label" htmlFor="editDisabled">
            Disabled
          </label>
        </div>
      )}
    </>
  );
}

export default EditBasicTab;
