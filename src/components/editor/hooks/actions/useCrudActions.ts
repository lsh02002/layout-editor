import { useCallback } from "react";

import type { LayoutComponent } from "../../../../types/types";

import {
  cloneComponent,
  findComponentLocation,
  findComponentRecursive,
  insertComponentRecursive,
  removeComponentRecursive,
} from "../../utils/componentTree";

import type { CommitHistory } from "../../../../types/types";

type Options = {
  components: LayoutComponent[];
  selectedComponentIds: string[];
  setSelectedComponentIds: React.Dispatch<React.SetStateAction<string[]>>;
  commitHistory: CommitHistory;
  resetEditForm: () => void;
};

export const useCrudActions = ({
  components,
  selectedComponentIds,
  setSelectedComponentIds,
  commitHistory,
  resetEditForm,
}: Options) => {
  const deleteComponent = useCallback(
    (id: string) => {
      commitHistory((prev) => removeComponentRecursive(prev, id).items);

      if (selectedComponentIds.includes(id)) {
        setSelectedComponentIds((prev) =>
          prev.filter((selectedId) => selectedId !== id),
        );
        resetEditForm();
      }
    },
    [
      commitHistory,
      selectedComponentIds,
      setSelectedComponentIds,
      resetEditForm,
    ],
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
    resetEditForm();
  }, [
    selectedComponentIds,
    commitHistory,
    setSelectedComponentIds,
    resetEditForm,
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

      setSelectedComponentIds([cloned.id]);
    },
    [commitHistory, components, setSelectedComponentIds],
  );

  return {
    deleteComponent,
    deleteSelectedComponents,
    copyComponent,
  };
};
