import { useCallback, useState } from "react";
import type { LayoutComponent } from "../../../types/types";
import type {
  ComponentRegistry,
  RegistryComponentType,
} from "../registry/componentRegistry";

export const useCreateComponentForm = (
  componentRegistry: ComponentRegistry,
) => {
  const [newType, setNewType] = useState<RegistryComponentType>("heading");
  const [newComponentName, setNewComponentName] = useState("");
  const [newProps, setNewProps] = useState<Record<string, unknown>>(() =>
    structuredClone(componentRegistry.heading.defaultProps),
  );
  const makeComponentByType = useCallback(
    (
      type: RegistryComponentType,
      props: Record<string, unknown> = {},
      name?: string,
    ): LayoutComponent => {
      const definition = componentRegistry[type];
      const mergedProps = {
        ...structuredClone(definition.defaultProps),
        ...props,
      };
      const component = definition.createComponent(
        crypto.randomUUID(),
        mergedProps,
      );
      return {
        ...component,
        name: name?.trim() || component.name,
      } as LayoutComponent;
    },
    [componentRegistry],
  );

  const resetCreateForm = useCallback(() => {
    setNewType("textarea");
    setNewComponentName("");
    setNewProps(structuredClone(componentRegistry.textarea.defaultProps));
  }, [componentRegistry]);
  const changeNewType = useCallback(
    (type: RegistryComponentType) => {
      setNewType(type);
      setNewProps(structuredClone(componentRegistry[type].defaultProps));
    },
    [componentRegistry],
  );

  const makeNewComponent = useCallback((): LayoutComponent => {
    return makeComponentByType(newType, newProps, newComponentName);
  }, [makeComponentByType, newType, newProps, newComponentName]);

  return {
    newType,
    setNewType,
    newComponentName,
    setNewComponentName,
    resetCreateForm,
    makeNewComponent,
    makeComponentByType,
    newProps,
    setNewProps,
    changeNewType,
  };
};
