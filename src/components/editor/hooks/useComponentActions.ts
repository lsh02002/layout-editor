import type { LayoutComponent } from "../../../types/types";

import type {
  BooleanSetter,
  CommitHistory,
  EditValues,
  FavoriteSetter,
  InsertTarget,
  InsertTargetSetter,
  SelectionSetter,
  SetComponents,
} from "../../../types/types";

import { useCreateActions } from "./actions/useCreateActions";

import { useCrudActions } from "./actions/useCrudActions";

import { useSelectionActions } from "./actions/useSelectionActions";

import { useEditSaveActions } from "./actions/useEditSaveActions";

type Options = {
  components: LayoutComponent[];

  selectedComponentId: string | null;
  setSelectedComponentId: SelectionSetter;

  showEditModal: boolean;
  setShowEditModal: BooleanSetter;
  setShowFavoritePanel: BooleanSetter;

  setShowCreateModal: BooleanSetter;
  insertTarget: InsertTarget;
  setInsertTarget: InsertTargetSetter;

  newType: LayoutComponent["type"];
  resetCreateForm: () => void;
  makeNewComponent: () => LayoutComponent;

  loadComponentToEdit: (component: LayoutComponent) => void;

  commitHistory: CommitHistory;
  setComponents: SetComponents;

  setFavoriteComponents: FavoriteSetter;

  editValues: EditValues;
};

export const useComponentActions = (options: Options) => {
  const createActions = useCreateActions({
    components: options.components,
    insertTarget: options.insertTarget,
    setInsertTarget: options.setInsertTarget,
    setShowCreateModal: options.setShowCreateModal,
    selectedComponentId: options.selectedComponentId,
    setSelectedComponentId: options.setSelectedComponentId,
    newType: options.newType,
    resetCreateForm: options.resetCreateForm,
    makeNewComponent: options.makeNewComponent,
    commitHistory: options.commitHistory,
  });

  const crudActions = useCrudActions({
    components: options.components,
    selectedComponentId: options.selectedComponentId,
    setSelectedComponentId: options.setSelectedComponentId,
    commitHistory: options.commitHistory,
  });

  const selectionActions = useSelectionActions({
    components: options.components,
    selectedComponentId: options.selectedComponentId,
    setSelectedComponentId: options.setSelectedComponentId,
    showEditModal: options.showEditModal,
    setShowEditModal: options.setShowEditModal,
    setShowFavoritePanel: options.setShowFavoritePanel,
    loadComponentToEdit: options.loadComponentToEdit,
  });

  const editActions = useEditSaveActions({
    editValues: options.editValues,
    setComponents: options.setComponents,
    setFavoriteComponents: options.setFavoriteComponents,
  });

  return {
    ...createActions,
    ...crudActions,
    ...selectionActions,
    ...editActions,
  };
};
