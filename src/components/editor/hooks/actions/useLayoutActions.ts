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
  selectedComponentId: string | null;
  setComponents: SetComponents;
  setEditLayout: React.Dispatch<React.SetStateAction<ComponentLayout>>;
  snapLayout: (layout: Partial<ComponentLayout>) => Partial<ComponentLayout>;
};

export const useLayoutActions = ({
  selectedComponentId,
  setComponents,
  setEditLayout,
  snapLayout,
}: Options) => {
  const updateLayout = useCallback(
    (id: string, newLayout: Partial<ComponentLayout>, recordHistory = true) => {
      const snappedLayout = snapLayout(newLayout);

      setComponents(
        (prev) => updateLayoutRecursive(prev, id, snappedLayout),
        recordHistory,
      );

      if (selectedComponentId === id) {
        setEditLayout((prev) => ({
          ...prev,
          ...snappedLayout,
        }));
      }
    },
    [selectedComponentId, setComponents, setEditLayout, snapLayout],
  );

  const updateSelectedComponentImmediate = useCallback(
    (updater: (component: LayoutComponent) => LayoutComponent) => {
      if (!selectedComponentId) {
        return;
      }

      setComponents((items) =>
        updateComponentRecursive(items, selectedComponentId, updater),
      );
    },
    [selectedComponentId, setComponents],
  );

  return {
    updateLayout,
    updateSelectedComponentImmediate,
  };
};
