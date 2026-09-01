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
} from "../../../../types/types";

type Options = {
  components: LayoutComponent[];
  insertTarget: InsertTarget;
  setInsertTarget: InsertTargetSetter;
  setShowCreateModal: BooleanSetter;
  setShowEditModal: BooleanSetter;
  setSelectedComponentId: SelectionSetter;
  newType: LayoutComponent["type"];
  setNewType: (type: LayoutComponent["type"]) => void;
  resetCreateForm: () => void;
  makeNewComponent: () => LayoutComponent;
  loadComponentToEdit: (component: LayoutComponent) => void;
  commitHistory: CommitHistory;
};

export const useCreateActions = ({
  components,
  insertTarget,
  setSelectedComponentId,
  setInsertTarget,
  setShowCreateModal,
  setShowEditModal,
  newType,
  setNewType,
  resetCreateForm,
  makeNewComponent,
  loadComponentToEdit,
  commitHistory,
}: Options) => {
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

    closeCreateModal();

    setSelectedComponentId(newComponent.id);

    loadComponentToEdit(newComponent);

    setShowEditModal(true);
  }, [
    closeCreateModal,
    commitHistory,
    components,
    insertTarget,
    loadComponentToEdit,
    makeNewComponent,
    newType,
    setSelectedComponentId,
    setShowEditModal,
  ]);

  const openCreateModal = useCallback(
    (
      parentId: string | null,
      index: number,
      type?: LayoutComponent["type"],
    ) => {
      setInsertTarget({
        parentId,
        index,
      });

      resetCreateForm();

      if (type) {
        setNewType(type);
      }

      setShowCreateModal(true);
    },
    [resetCreateForm, setInsertTarget, setShowCreateModal, setNewType],
  );

  return {
    openCreateModal,
    closeCreateModal,
    createComponent,
  };
};
