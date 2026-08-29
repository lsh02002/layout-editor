import type {
  ComponentLayout,
  ComponentType,
  LayoutComponent,
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
      component.type === "container" &&
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

    if (item.type !== "container") {
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

export const cloneComponent = (component: LayoutComponent): LayoutComponent => {
  const newId = crypto.randomUUID();

  if (component.type === "image") {
    return {
      ...component,
      id: newId,
      props: {
        ...component.props,
        urls: [...component.props.urls],
      },
      style: component.style ? { ...component.style } : undefined,
      contentStyle: component.contentStyle
        ? { ...component.contentStyle }
        : undefined,
      layout: component.layout ? { ...component.layout } : undefined,
    };
  }

  if (component.type === "container") {
    return {
      ...component,
      id: newId,
      props: { ...component.props },
      style: component.style ? { ...component.style } : undefined,
      contentStyle: component.contentStyle
        ? { ...component.contentStyle }
        : undefined,
      layout: component.layout ? { ...component.layout } : undefined,
      children: component.children.map(cloneComponent),
    };
  }

  return {
    ...component,
    id: newId,
    props: { ...component.props },
    style: component.style ? { ...component.style } : undefined,
    contentStyle: component.contentStyle
      ? { ...component.contentStyle }
      : undefined,
    layout: component.layout ? { ...component.layout } : undefined,
  } as LayoutComponent;
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
    if (item.type === "container" && item.id === parentId) {
      const children = [...item.children];
      const safeIndex = Math.max(0, Math.min(index, children.length));

      children.splice(safeIndex, 0, component);

      return {
        ...item,
        children: normalizeOrder(children),
      };
    }

    if (item.type === "container") {
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

    if (item.type === "container") {
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

    if (item.type === "container") {
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

  if (component.type !== "container") {
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

    if (item.type === "container") {
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
