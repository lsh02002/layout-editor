import type { LayoutComponent, ComponentType } from "../../../types/types";
import { componentRegistry } from "../registry/componentRegistry";

export function getComponentDisplayName(component: LayoutComponent): string {
  const definition = componentRegistry[component.type];
  const displayName = definition.getDisplayName?.(component);

  if (displayName?.trim()) {
    return displayName.trim();
  }

  if (component.name?.trim()) {
    return component.name.trim();
  }

  if (
    "title" in component.props &&
    typeof component.props.title === "string" &&
    component.props.title.trim()
  ) {
    return component.props.title.trim();
  }

  return definition.label;
}

export function getComponentMaxInstances(
  type: ComponentType,
): number | undefined {
  return componentRegistry[type].maxInstances;
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
