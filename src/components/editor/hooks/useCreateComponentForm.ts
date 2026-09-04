import { useCallback, useState } from "react";

import type { ComponentType, LayoutComponent } from "../../../types/types";

import {
  componentRegistry,
  createComponentFromProps,
  createDefaultComponent,
} from "../registry/componentRegistry";

export const useCreateComponentForm = () => {
  const [newType, setNewType] = useState<ComponentType>("heading");
  const [newComponentName, setNewComponentName] = useState("");
  const [newProps, setNewProps] = useState<Record<string, unknown>>(() =>
    structuredClone(componentRegistry.heading.defaultProps)
  );

  const resetCreateForm = useCallback(() => {
    setNewType("textarea");
    setNewComponentName("");
    setNewProps(structuredClone(componentRegistry[newType].defaultProps));
  }, [newType]);

  const changeNewType = useCallback((type: ComponentType) => {
    setNewType(type);
    setNewProps(structuredClone(componentRegistry[type].defaultProps));
  }, []);

  const makeNewComponent = useCallback(() => {
    return createComponentFromProps(newType, newProps, newComponentName);
  }, [newType, newProps, newComponentName]);

  const makeComponentByType = useCallback(
    (type: ComponentType): LayoutComponent => {
      return createDefaultComponent(type);
    },
    [],
  );

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
