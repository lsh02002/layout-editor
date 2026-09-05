import type { LayoutComponent, ComponentType } from "../../../types/types";
import {
  componentRegistry,
  type ComponentRegistryShape,
} from "../registry/componentRegistry";

export function getComponentDisplayName(component: LayoutComponent): string {
  const definition = componentRegistry[
    component.type as ComponentType
  ] as ComponentRegistryShape;

  return (
    definition.getDisplayName?.(component) ??
    component.name?.trim() ??
    definition.label
  );
}

export function getComponentMaxInstances(
  type: ComponentType,
): number | undefined {
  const definition = componentRegistry[type] as ComponentRegistryShape;

  return definition.maxInstances;
}

export function canAddComponentType(
  components: LayoutComponent[],
  type: ComponentType,
): boolean {
  const maxInstances = getComponentMaxInstances(type);

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
