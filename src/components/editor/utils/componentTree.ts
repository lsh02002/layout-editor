import {
  isLayoutContainer,
  type ComponentLayout,
  type ComponentType,
  type LayoutComponent,
} from "../../../types/types";

export const normalizeOrder = (items: LayoutComponent[]): LayoutComponent[] =>
  items.map((item, index) => ({
    ...item,
    order: index,
  }));

export function hasComponentType(
  items: LayoutComponent[],
  type: ComponentType,
): boolean {
  for (const component of items) {
    if (component.type === type) {
      return true;
    }

    if (
      isLayoutContainer(component) &&
      hasComponentType(component.children, type)
    ) {
      return true;
    }
  }

  return false;
}

export const removeComponentRecursive = (
  items: LayoutComponent[],
  id: string,
): { items: LayoutComponent[]; removed: LayoutComponent | null } => {
  const directIndex = items.findIndex((item) => item.id === id);

  if (directIndex >= 0) {
    const next = [...items];
    const [removed] = next.splice(directIndex, 1);

    return {
      items: normalizeOrder(next),
      removed,
    };
  }

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];

    if (!isLayoutContainer(item)) {
      continue;
    }

    const result = removeComponentRecursive(item.children, id);

    if (result.removed) {
      const next = [...items];

      next[index] = {
        ...item,
        children: result.items,
      };

      return {
        items: normalizeOrder(next),
        removed: result.removed,
      };
    }
  }

  return {
    items,
    removed: null,
  };
};

export const cloneComponents = <T extends LayoutComponent>(
  components: T[],
): T[] => {
  const idMap = new Map<string, string>();

  // 1. 먼저 모든 기존 ID -> 새 ID 생성
  const createIdMap = (item: LayoutComponent) => {
    idMap.set(item.id, crypto.randomUUID());

    if (isLayoutContainer(item)) {
      item.children.forEach((child) => {
        createIdMap(child);
      });
    }
  };

  // 2. 전체 컴포넌트 ID 맵 생성
  components.forEach((component) => {
    createIdMap(component);
  });

  const remapCode = (code: string) => {
    let nextCode = code;

    idMap.forEach((newId, oldId) => {
      nextCode = nextCode.split(oldId).join(newId);
    });

    return nextCode;
  };

  const clone = <C extends LayoutComponent>(item: C): C => {
    const newId = idMap.get(item.id) ?? crypto.randomUUID();
    const oldPositionParentId = item.layout?.positionParentId ?? null;
    const newPositionParentId = oldPositionParentId
      ? (idMap.get(oldPositionParentId) ?? null)
      : null;
    const layout = item.layout
      ? {
          ...item.layout,
          positionParentId: newPositionParentId,
        }
      : undefined;

    const jsActions = item.jsActions?.map((action) => ({
      ...action,
      targetComponentId: action.targetComponentId
        ? idMap.get(action.targetComponentId)
        : undefined,
      code: remapCode(action.code),
    }));

    if (isLayoutContainer(item)) {
      return {
        ...item,
        id: newId,
        style: item.style ? { ...item.style } : undefined,
        contentStyle: item.contentStyle ? { ...item.contentStyle } : undefined,
        layout,
        jsActions,
        children: item.children.map((child) => clone(child)),
      } as C;
    }

    return {
      ...item,
      id: newId,
      style: item.style ? { ...item.style } : undefined,
      contentStyle: item.contentStyle ? { ...item.contentStyle } : undefined,
      layout,
      jsActions,
    } as C;
  };

  return components.map((component) => clone(component));
};

export const cloneComponent = <T extends LayoutComponent>(component: T): T => {
  return cloneComponents([component])[0];
};

export const insertComponentRecursive = (
  items: LayoutComponent[],
  parentId: string | null,
  index: number,
  component: LayoutComponent,
): LayoutComponent[] => {
  if (parentId === null) {
    const next = [...items];
    const safeIndex = Math.max(0, Math.min(index, next.length));

    next.splice(safeIndex, 0, component);

    return normalizeOrder(next);
  }

  return items.map((item) => {
    if (isLayoutContainer(item) && item.id === parentId) {
      const children = [...item.children];
      const safeIndex = Math.max(0, Math.min(index, children.length));

      children.splice(safeIndex, 0, component);

      return {
        ...item,
        children: normalizeOrder(children),
      };
    }

    if (isLayoutContainer(item)) {
      return {
        ...item,
        children: insertComponentRecursive(
          item.children,
          parentId,
          index,
          component,
        ),
      };
    }

    return item;
  });
};

export const findComponentLocation = (
  items: LayoutComponent[],
  id: string,
  parentId: string | null = null,
): { parentId: string | null; index: number } | null => {
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];

    if (item.id === id) {
      return { parentId, index };
    }

    if (isLayoutContainer(item)) {
      const found = findComponentLocation(item.children, id, item.id);

      if (found) {
        return found;
      }
    }
  }

  return null;
};

export const findComponentRecursive = (
  items: LayoutComponent[],
  id: string,
): LayoutComponent | undefined => {
  for (const item of items) {
    if (item.id === id) {
      return item;
    }

    if (isLayoutContainer(item)) {
      const found = findComponentRecursive(item.children, id);

      if (found) {
        return found;
      }
    }
  }

  return undefined;
};

export const containsComponent = (
  component: LayoutComponent,
  targetId: string,
): boolean => {
  if (component.id === targetId) {
    return true;
  }

  if (!isLayoutContainer(component)) {
    return false;
  }

  return component.children.some((child) => containsComponent(child, targetId));
};

export const updateLayoutRecursive = (
  items: LayoutComponent[],
  id: string,
  newLayout: Partial<ComponentLayout>,
): LayoutComponent[] => {
  let changed = false;

  const nextItems = items.map((item) => {
    if (item.id === id) {
      changed = true;

      return {
        ...item,
        layout: {
          ...item.layout,
          ...newLayout,
        },
      };
    }

    if (isLayoutContainer(item)) {
      const nextChildren = updateLayoutRecursive(item.children, id, newLayout);

      if (nextChildren !== item.children) {
        changed = true;

        return {
          ...item,
          children: nextChildren,
        };
      }
    }

    return item;
  });

  return changed ? nextItems : items;
};

export const updateComponentRecursive = (
  items: LayoutComponent[],
  id: string,
  updater: (component: LayoutComponent) => LayoutComponent,
): LayoutComponent[] => {
  return items.map((component) => {
    if (component.id === id) {
      return updater(component);
    }

    if (isLayoutContainer(component)) {
      return {
        ...component,
        children: updateComponentRecursive(component.children, id, updater),
      };
    }

    return component;
  });
};
