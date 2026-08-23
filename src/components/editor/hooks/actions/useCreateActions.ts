import { useCallback } from "react";

import type { LayoutComponent } from "../../../../types/types";

import {
  hasComponentType,
  insertComponentRecursive,
} from "../../utils/componentTree";

import type {
  BooleanSetter,
  CommitHistory,
  InsertTarget,
  InsertTargetSetter,
  SelectionSetter,
} from "./types";

type Options = {
  components: LayoutComponent[];
  insertTarget: InsertTarget;
  setInsertTarget: InsertTargetSetter;
  setShowCreateModal: BooleanSetter;
  selectedComponentId: string | null;
  setSelectedComponentId: SelectionSetter;
  newType: LayoutComponent["type"];
  resetCreateForm: () => void;
  makeNewComponent: () => LayoutComponent;
  commitHistory: CommitHistory;
};

export const useCreateActions = ({
  components,
  insertTarget,
  setInsertTarget,
  setShowCreateModal,
  setSelectedComponentId,
  newType,
  resetCreateForm,
  makeNewComponent,
  commitHistory,
}: Options) => {
  const openCreateModal = useCallback(
    (parentId: string | null, index: number) => {
      setInsertTarget({
        parentId,
        index,
      });

      resetCreateForm();
      setShowCreateModal(true);
    },
    [resetCreateForm, setInsertTarget, setShowCreateModal],
  );

  const closeCreateModal = useCallback(() => {
    setShowCreateModal(false);
    setInsertTarget(null);
  }, [setInsertTarget, setShowCreateModal]);

  const createComponent = useCallback(() => {
    if (!insertTarget) {
      return;
    }

    if (
      newType === "scrollToTopButton" &&
      hasComponentType(components, "scrollToTopButton")
    ) {
      alert("Scroll To Top Button은 한번만 등록 가능합니다.");
      return;
    }

    const newComponent = makeNewComponent();

    commitHistory((prev) =>
      insertComponentRecursive(
        prev,
        insertTarget.parentId,
        insertTarget.index,
        newComponent,
      ),
    );

    setSelectedComponentId(newComponent.id);

    closeCreateModal();
  }, [
    closeCreateModal,
    commitHistory,
    components,
    insertTarget,
    makeNewComponent,
    newType,
    setSelectedComponentId,
  ]);

  return {
    openCreateModal,
    closeCreateModal,
    createComponent,
  };
};
