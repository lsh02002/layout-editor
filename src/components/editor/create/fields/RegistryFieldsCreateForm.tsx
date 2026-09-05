import FieldRenderer from "../../../canvas/renderers";
import {
  type ComponentRegistry,
  type RegistryComponentType,
} from "../../registry/componentRegistry";

type Props = {
  componentRegistry: ComponentRegistry;
  type: RegistryComponentType;
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
};
export default function RegistryFieldsCreateForm({
  componentRegistry,
  type,
  value,
  onChange,
}: Props) {
  const definition = componentRegistry[type];

  return (
    <>
      {Object.entries(definition.fields).map(([name, field]) => {
        if (!field) {
          return null;
        }
        return (
          <FieldRenderer
            key={name}
            name={name}
            field={field}
            value={value[name]}
            onChange={(nextValue) => onChange({ ...value, [name]: nextValue })}
          />
        );
      })}
    </>
  );
}
