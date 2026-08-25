import type { LayoutComponent, TemplateItem } from "../../../types/types";

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
import { useTemplateActions } from "./actions/useTemplateActions";

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

  templates: TemplateItem[];
  selectedTemplateId: string | null;
  setSelectedTemplateId: (id: string | null) => void;
};

export const useComponentActions = ({
  components,
  selectedComponentId,
  setSelectedComponentId,
  setShowEditModal,
  setShowFavoritePanel,
  setShowCreateModal,
  insertTarget,
  setInsertTarget,
  newType,
  resetCreateForm,
  makeNewComponent,
  loadComponentToEdit,
  commitHistory,
  setComponents,
  setFavoriteComponents,
  editValues,
  templates,
  selectedTemplateId,
  setSelectedTemplateId,
}: Options) => {
  const createActions = useCreateActions({
    components,
    insertTarget,
    setInsertTarget,
    selectedComponentId,
    setSelectedComponentId,
    setShowCreateModal,
    setShowEditModal,
    newType,
    resetCreateForm,
    makeNewComponent,
    loadComponentToEdit,
    commitHistory,
  });

  const crudActions = useCrudActions({
    components,
    selectedComponentId,
    setSelectedComponentId,
    commitHistory,
  });

  const selectionActions = useSelectionActions({
    components,
    selectedComponentId,
    setSelectedComponentId,
    setShowEditModal,
    setShowFavoritePanel,
    loadComponentToEdit,
  });

  const editActions = useEditSaveActions({
    editValues,
    setComponents,
    setFavoriteComponents,
  });

  const templateActions = useTemplateActions({
    templates,
    selectedTemplateId,
    setSelectedTemplateId,
    commitHistory,
  });

  return {
    ...createActions,
    ...crudActions,
    ...selectionActions,
    ...editActions,
    ...templateActions,
  };
};
