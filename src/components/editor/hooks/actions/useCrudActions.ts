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
  selectedComponentIds: string[];
  setSelectedComponentId: SelectionSetter;
  setSelectedComponentIds: React.Dispatch<React.SetStateAction<string[]>>;
  commitHistory: CommitHistory;
  resetEditForm: () => void;
};

export const useCrudActions = ({
  components,
  selectedComponentId,
  selectedComponentIds,
  setSelectedComponentId,
  setSelectedComponentIds,
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

  const deleteSelectedComponents = useCallback(() => {
    if (selectedComponentIds.length === 0) {
      return;
    }

    const selectedSet = new Set(selectedComponentIds);

    const removeSelected = (items: LayoutComponent[]): LayoutComponent[] => {
      return (
        items
          // 선택된 컴포넌트 제거
          .filter((component) => !selectedSet.has(component.id))
          // 컨테이너 자식도 재귀 삭제
          .map((component) => {
            if (component.type !== "container") {
              return component;
            }

            return {
              ...component,
              children: removeSelected(component.children),
            };
          })
          // order 재정렬
          .map((component, index) => ({
            ...component,
            order: index,
          }))
      );
    };

    commitHistory((prev) => removeSelected(prev));

    // 선택 초기화
    setSelectedComponentIds([]);
    setSelectedComponentId(null);
  }, [
    selectedComponentIds,
    commitHistory,
    setSelectedComponentIds,
    setSelectedComponentId,
  ]);

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
    deleteSelectedComponents,
    copyComponent,
  };
};
