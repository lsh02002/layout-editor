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
    (
      id: string,
      openEditPanel = false,
      multiSelect = false,
      scrollToComponent = false,
    ) => {
      const component = findComponentRecursive(components, id);

      if (!component) {
        return;
      }

      const scrollToCanvasComponent = () => {
        if (!scrollToComponent) {
          return;
        }

        requestAnimationFrame(() => {
          const canvas = document.querySelector<HTMLElement>(
            "[data-builder-canvas]",
          );

          if (!canvas) {
            return;
          }

          const element = canvas.querySelector<HTMLElement>(
            `[data-component-id="${CSS.escape(id)}"]`,
          );

          if (!element) {
            return;
          }

          const rect = element.getBoundingClientRect();

          const margin = 150;
          const isVisible =
            rect.top >= margin &&
            rect.left >= margin &&
            rect.bottom <= window.innerHeight - margin &&
            rect.right <= window.innerWidth - margin;

          if (isVisible) {
            return;
          }

          element.scrollIntoView({
            behavior: "smooth",
            block: "start",
            inline: "nearest",
          });
        });
      };

      if (!multiSelect) {
        setSelectedComponentIds([id]);

        loadComponentToEdit(component);

        if (openEditPanel) {
          setShowEditModal(true);
        }

        scrollToCanvasComponent();

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
      scrollToCanvasComponent();
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
