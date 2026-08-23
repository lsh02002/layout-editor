import { useCallback } from "react";

import type { LayoutComponent } from "../../../../types/types";

import { findComponentRecursive } from "../../utils/componentTree";

import type { BooleanSetter, SelectionSetter } from "../../../../types/types";

type Options = {
  components: LayoutComponent[];
  selectedComponentId: string | null;
  setSelectedComponentId: SelectionSetter;
  setShowEditModal: BooleanSetter;
  setShowFavoritePanel: BooleanSetter;
  loadComponentToEdit: (component: LayoutComponent) => void;
};

export const useSelectionActions = ({
  components,
  selectedComponentId,
  setSelectedComponentId,
  setShowEditModal,
  setShowFavoritePanel,
  loadComponentToEdit,
}: Options) => {
  const selectComponent = useCallback(
    (id: string, openEditPanel = false) => {
      const component = findComponentRecursive(components, id);

      if (!component) {
        return;
      }

      setSelectedComponentId(id);
      loadComponentToEdit(component);

      if (openEditPanel) {
        setShowFavoritePanel(false);
        setShowEditModal(true);
      }
    },
    [
      components,
      loadComponentToEdit,
      setSelectedComponentId,
      setShowEditModal,
      setShowFavoritePanel,
    ],
  );

  const editComponent = useCallback(
    (id: string) => {
      selectComponent(id, true);
    },
    [selectComponent],
  );

  const resetEditPanelToSelected = useCallback(() => {
    if (!selectedComponentId) {
      return;
    }

    const component = findComponentRecursive(components, selectedComponentId);

    if (!component) {
      return;
    }

    loadComponentToEdit(component);
  }, [components, loadComponentToEdit, selectedComponentId]);

  return {
    selectComponent,
    editComponent,
    resetEditPanelToSelected,
  };
};
