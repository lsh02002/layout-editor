import { useCallback } from "react";

import type { LayoutComponent } from "../../../../types/types";

import {
  cloneComponent,
  findComponentLocation,
  findComponentRecursive,
  insertComponentRecursive,
  removeComponentRecursive,
} from "../../utils/componentTree";

import type { CommitHistory, SelectionSetter } from "../../../../types/types";

type Options = {
  components: LayoutComponent[];
  selectedComponentId: string | null;
  setSelectedComponentId: SelectionSetter;
  commitHistory: CommitHistory;
  resetEditForm: () => void;
};

export const useCrudActions = ({
  components,
  selectedComponentId,
  setSelectedComponentId,
  commitHistory,
  resetEditForm,
}: Options) => {
  const deleteComponent = useCallback(
    (id: string) => {
      commitHistory((prev) => removeComponentRecursive(prev, id).items);

      if (selectedComponentId === id) {
        setSelectedComponentId(null);
        resetEditForm();
      }
    },
    [commitHistory, selectedComponentId, setSelectedComponentId, resetEditForm],
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
