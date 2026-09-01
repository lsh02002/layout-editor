// hooks/actions/useLayoutActions.ts

import { useCallback } from "react";

import type {
  ComponentLayout,
  LayoutComponent,
  SetComponents,
} from "../../../../types/types";

import {
  updateLayoutRecursive,
  updateComponentRecursive,
} from "../../utils/componentTree";

type Options = {
  selectedComponentIds: string[];
  setComponents: SetComponents;
  setEditLayout: React.Dispatch<React.SetStateAction<ComponentLayout>>;
  snapLayout: (layout: Partial<ComponentLayout>) => Partial<ComponentLayout>;
};

export const useLayoutActions = ({
  selectedComponentIds,
  setComponents,
  setEditLayout,
  snapLayout,
}: Options) => {
  const primarySelectedId = selectedComponentIds.at(-1) ?? null;

  const updateLayout = useCallback(
    (id: string, newLayout: Partial<ComponentLayout>, recordHistory = true) => {
      const snappedLayout = snapLayout(newLayout);

      setComponents(
        (prev) => updateLayoutRecursive(prev, id, snappedLayout),
        recordHistory,
      );

      if (primarySelectedId === id) {
        setEditLayout((prev) => ({
          ...prev,
          ...snappedLayout,
        }));
      }
    },
    [primarySelectedId, setComponents, setEditLayout, snapLayout],
  );

  const updateSelectedComponentImmediate = useCallback(
    (updater: (component: LayoutComponent) => LayoutComponent) => {
      if (!primarySelectedId) {
        return;
      }

      setComponents((items) =>
        updateComponentRecursive(items, primarySelectedId, updater),
      );
    },
    [primarySelectedId, setComponents],
  );

  return {
    updateLayout,
    updateSelectedComponentImmediate,
  };
};
