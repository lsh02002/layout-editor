import { useCallback } from "react";

import type { LayoutComponent } from "../../../../types/types";

import { findComponentRecursive } from "../../utils/componentTree";

import type { BooleanSetter, SelectionSetter } from "../../../../types/types";

type Options = {
  components: LayoutComponent[];
  selectedComponentId: string | null;
  setSelectedComponentId: SelectionSetter;
  selectedComponentIds: string[];
  setSelectedComponentIds: (ids: string[]) => void;
  setShowEditModal: BooleanSetter;
  loadComponentToEdit: (component: LayoutComponent) => void;
};

export const useSelectionActions = ({
  components,
  selectedComponentId,
  setSelectedComponentId,
  selectedComponentIds,
  setSelectedComponentIds,
  setShowEditModal,
  loadComponentToEdit,
}: Options) => {
  const selectComponent = useCallback(
    (id: string, openEditPanel = false, multiSelect = false) => {
      const component = findComponentRecursive(components, id);

      if (!component) {
        return;
      }

      // 일반 클릭
      if (!multiSelect) {
        setSelectedComponentIds([id]);
        setSelectedComponentId(id);
        loadComponentToEdit(component);

        if (openEditPanel) {
          setShowEditModal(true);
        }

        return;
      }

      // Ctrl / Cmd + 클릭
      const alreadySelected = selectedComponentIds.includes(id);

      if (alreadySelected) {
        const nextIds = selectedComponentIds.filter(
          (selectedId) => selectedId !== id,
        );

        setSelectedComponentIds(nextIds);

        // 현재 대표 선택까지 해제한 경우
        if (selectedComponentId === id) {
          const nextPrimaryId = nextIds.at(-1) ?? null;

          setSelectedComponentId(nextPrimaryId);

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

      // 새 컴포넌트 추가 선택
      setSelectedComponentIds([...selectedComponentIds, id]);

      // 마지막으로 누른 것을 대표 선택으로
      setSelectedComponentId(id);
      loadComponentToEdit(component);

      if (openEditPanel) {
        setShowEditModal(true);
      }
    },
    [
      components,
      loadComponentToEdit,
      selectedComponentId,
      selectedComponentIds,
      setSelectedComponentId,
      setSelectedComponentIds,
      setShowEditModal,
    ],
  );

  const editComponent = useCallback(
    (id: string) => {
      // 편집 버튼은 단일 선택 취급
      selectComponent(id, true, false);
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
