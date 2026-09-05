import type { LayoutComponent } from "../../../types/types";
import {
  getComponentSearchText,
  type ComponentRegistry,
} from "../registry/componentRegistry";

export const normalizeSearchText = (value: string): string =>
  value
    .toLowerCase()
    .replace(/\u00A0/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

export function filterLayerComponents(
  componentRegistry: ComponentRegistry,
  components: LayoutComponent[],
  search: string,
): LayoutComponent[] {
  const keyword = normalizeSearchText(search);

  if (!keyword) {
    return components;
  }

  const filterRecursive = (
    component: LayoutComponent,
  ): LayoutComponent | null => {
    const searchText = normalizeSearchText(
      getComponentSearchText(componentRegistry, component),
    );
    const selfMatched = searchText.includes(keyword);

    if (component.type !== "container") {
      return selfMatched ? component : null;
    }

    const filteredChildren = component.children
      .map(filterRecursive)
      .filter((child): child is LayoutComponent => child !== null);

    if (selfMatched || filteredChildren.length > 0) {
      return {
        ...component,
        children: selfMatched ? component.children : filteredChildren,
      };
    }

    return null;
  };

  return components
    .map(filterRecursive)
    .filter((component): component is LayoutComponent => component !== null);
}
