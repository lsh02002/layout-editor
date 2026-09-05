import type { LayoutComponent } from "../../../types/types";
import {
  type ComponentRegistry,
  type ComponentRegistryShape,
  type RegistryComponentType,
} from "../registry/componentRegistry";

export function getComponentDisplayName(
  componentRegistry: ComponentRegistry,
  component: LayoutComponent,
): string {
  const definition = componentRegistry[
    component.type as RegistryComponentType
  ] as ComponentRegistryShape;

  return (
    definition.getDisplayName?.(component) ??
    component.name?.trim() ??
    definition.label
  );
}

export function getComponentMaxInstances(
  componentRegistry: ComponentRegistry,
  type: RegistryComponentType,
): number | undefined {
  const definition = componentRegistry[type] as ComponentRegistryShape;

  return definition.maxInstances;
}

export function canAddComponentType(
  componentRegistry: ComponentRegistry,
  components: LayoutComponent[],
  type: RegistryComponentType,
): boolean {
  const maxInstances = getComponentMaxInstances(componentRegistry, type);

  if (maxInstances === undefined) {
    return true;
  }

  let count = 0;

  const walk = (items: LayoutComponent[]) => {
    for (const component of items) {
      if (component.type === type) {
        count += 1;
      }

      if (component.type === "container") {
        walk(component.children);
      }
    }
  };

  walk(components);

  return count < maxInstances;
}
