import { useCallback } from "react";
import type { LayoutComponent } from "../../../../types/types";
import { insertComponentRecursive } from "../../utils/componentTree";
import type { ComponentRegistry, RegistryComponentType } from "../../registry/componentRegistry";

import type {
  BooleanSetter,
  CommitHistory,
  InsertTarget,
  InsertTargetSetter,
} from "../../../../types/types";
import { canAddComponentType } from "../../utils/componentDisplayName";

type Options = {
  componentRegistry: ComponentRegistry;
  components: LayoutComponent[];
  insertTarget: InsertTarget;
  setInsertTarget: InsertTargetSetter;
  setShowCreateModal: BooleanSetter;
  setShowEditModal: BooleanSetter;
  setSelectedComponentIds: React.Dispatch<React.SetStateAction<string[]>>;
  newType: RegistryComponentType;
  setNewType: (type: RegistryComponentType) => void;
  resetCreateForm: () => void;
  makeNewComponent: () => LayoutComponent;
  loadComponentToEdit: (component: LayoutComponent) => void;
  commitHistory: CommitHistory;
};

export const useCreateActions = ({
  componentRegistry,
  components,
  insertTarget,
  setSelectedComponentIds,
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

    if (!canAddComponentType(componentRegistry, components, newType)) {
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

    setSelectedComponentIds([newComponent.id]);

    loadComponentToEdit(newComponent);

    setShowEditModal(true);
  }, [
    closeCreateModal,
    commitHistory,
    componentRegistry,
    components,
    insertTarget,
    loadComponentToEdit,
    makeNewComponent,
    newType,
    setSelectedComponentIds,
    setShowEditModal,
  ]);

  const openCreateModal = useCallback(
    (parentId: string | null, index: number, type?: RegistryComponentType) => {
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
