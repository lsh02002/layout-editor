import { useCallback } from "react";

import type { LayoutComponent, BooleanSetter } from "../../../../types/types";

import { findComponentRecursive } from "../../utils/componentTree";

type Options = {
  components: LayoutComponent[];
  selectedComponentIds: string[];
  setSelectedComponentIds: React.Dispatch<React.SetStateAction<string[]>>;
  setShowEditModal: BooleanSetter;
  loadComponentToEdit: (component: LayoutComponent) => void;
};

export const useSelectionActions = ({
  components,
  selectedComponentIds,
  setSelectedComponentIds,
  setShowEditModal,
  loadComponentToEdit,
}: Options) => {
  const primarySelectedId = selectedComponentIds.at(-1) ?? null;
  const selectComponent = useCallback(
    (id: string, openEditPanel = false, multiSelect = false) => {
      const component = findComponentRecursive(components, id);

      if (!component) {
        return;
      }

      if (!multiSelect) {
        setSelectedComponentIds([id]);
        loadComponentToEdit(component);

        if (openEditPanel) {
          setShowEditModal(true);
        }

        return;
      }

      const alreadySelected = selectedComponentIds.includes(id);

      if (alreadySelected) {
        const nextIds = selectedComponentIds.filter(
          (selectedId) => selectedId !== id,
        );

        setSelectedComponentIds(nextIds);

        if (primarySelectedId === id) {
          const nextPrimaryId = nextIds.at(-1) ?? null;

          if (nextPrimaryId) {
            const nextComponent = findComponentRecursive(
              components,
              nextPrimaryId,
            );

            if (nextComponent) {
              loadComponentToEdit(nextComponent);
            }
          }
        }

        return;
      }

      setSelectedComponentIds([...selectedComponentIds, id]);

      loadComponentToEdit(component);

      if (openEditPanel) {
        setShowEditModal(true);
      }
    },
    [
      components,
      loadComponentToEdit,
      primarySelectedId,
      selectedComponentIds,
      setSelectedComponentIds,
      setShowEditModal,
    ],
  );

  const editComponent = useCallback(
    (id: string) => {
      selectComponent(id, true, false);
    },
    [selectComponent],
  );

  const resetEditPanelToSelected = useCallback(() => {
    if (!primarySelectedId) {
      return;
    }

    const component = findComponentRecursive(components, primarySelectedId);

    if (!component) {
      return;
    }

    loadComponentToEdit(component);
  }, [components, loadComponentToEdit, primarySelectedId]);

  return {
    selectComponent,
    editComponent,
    resetEditPanelToSelected,
  };
};
