import EditFieldFields from "../../edit/fields/EditFieldFields";
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
          <EditFieldFields
            key={name}
            name={name}
            field={field}
            value={value[name]}
            onChange={(nextValue: unknown) =>
              onChange({ ...value, [name]: nextValue })
            }
          />
        );
      })}
    </>
  );
}
