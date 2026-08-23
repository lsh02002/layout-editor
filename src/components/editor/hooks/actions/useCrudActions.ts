import { useCallback } from "react";

import type { LayoutComponent } from "../../../../types/types";

import {
  cloneComponent,
  findComponentLocation,
  findComponentRecursive,
  insertComponentRecursive,
  removeComponentRecursive,
} from "../../utils/componentTree";

import type { CommitHistory, SelectionSetter } from "./types";

type Options = {
  components: LayoutComponent[];
  selectedComponentId: string | null;
  setSelectedComponentId: SelectionSetter;
  commitHistory: CommitHistory;
};

export const useCrudActions = ({
  components,
  selectedComponentId,
  setSelectedComponentId,
  commitHistory,
}: Options) => {
  const deleteComponent = useCallback(
    (id: string) => {
      commitHistory((prev) => removeComponentRecursive(prev, id).items);

      if (selectedComponentId === id) {
        setSelectedComponentId(null);
      }
    },
    [commitHistory, selectedComponentId, setSelectedComponentId],
  );

  const copyComponent = useCallback(
    (id: string) => {
      const component = findComponentRecursive(components, id);

      const location = findComponentLocation(components, id);

      if (!component || !location) {
        return;
      }

      const cloned = cloneComponent(component);

      commitHistory((prev) =>
        insertComponentRecursive(
          prev,
          location.parentId,
          location.index + 1,
          cloned,
        ),
      );

      setSelectedComponentId(cloned.id);
    },
    [commitHistory, components, setSelectedComponentId],
  );

  return {
    deleteComponent,
    copyComponent,
  };
};
