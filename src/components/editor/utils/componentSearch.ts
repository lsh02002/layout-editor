import type { LayoutComponent } from "../../../types/types";
import { getComponentSearchText } from "../registry/componentRegistry";

export const normalizeSearchText = (value: string): string =>
  value
    .toLowerCase()
    .replace(/\u00A0/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

export const filterLayerComponents = (
  items: LayoutComponent[],
  search: string,
): LayoutComponent[] => {
  const keyword = normalizeSearchText(search);

  if (!keyword) {
    return items;
  }

  const filterRecursive = (
    component: LayoutComponent,
  ): LayoutComponent | null => {
    const searchText = normalizeSearchText(getComponentSearchText(component));
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

  return items
    .map(filterRecursive)
    .filter((component): component is LayoutComponent => component !== null);
};
