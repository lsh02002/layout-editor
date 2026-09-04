import type { LayoutComponent } from "../../../../types/types";
import FieldRenderer from "../../../canvas/renderers";
import { componentRegistry } from "../../registry/componentRegistry";

type Props = {
  type: LayoutComponent["type"];
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
};
export default function RegistryFieldsCreateForm({
  type,
  value,
  onChange,
}: Props) {
  const definition = componentRegistry[type];

  return (
    <>
      {Object.entries(definition.fields).map(([name, field]) => (
        <FieldRenderer
          key={name}
          name={name}
          field={field}
          value={value[name]}
          onChange={(nextValue) =>
            onChange({
              ...value,
              [name]: nextValue,
            })
          }
        />
      ))}
    </>
  );
}
