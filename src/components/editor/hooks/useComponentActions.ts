import type {
  ComponentLayout,
  LayoutComponent,
  TemplateItem,
} from "../../../types/types";

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
import { useLayoutActions } from "./actions/useLayoutActions";
import { useStyleActions } from "./actions/useStyleActions";

type Options = {
  components: LayoutComponent[];

  selectedComponentId: string | null;
  setSelectedComponentId: SelectionSetter;

  showEditModal: boolean;
  setShowEditModal: BooleanSetter;

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

  setEditLayout: React.Dispatch<React.SetStateAction<Partial<ComponentLayout>>>;
  snapLayout: (layout: Partial<ComponentLayout>) => Partial<ComponentLayout>;

  resetEditForm: () => void;
};

export const useComponentActions = ({
  components,
  selectedComponentId,
  setSelectedComponentId,
  setShowEditModal,
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
  setEditLayout,
  snapLayout,
  resetEditForm,
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
    resetEditForm,
  });

  const selectionActions = useSelectionActions({
    components,
    selectedComponentId,
    setSelectedComponentId,
    setShowEditModal,
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

  const layoutActions = useLayoutActions({
    selectedComponentId,
    setComponents,
    setEditLayout,
    snapLayout,
  });

  const styleActions = useStyleActions({
    selectedComponentId,
    setComponents,
  });

  return {
    ...createActions,
    ...crudActions,
    ...selectionActions,
    ...editActions,
    ...layoutActions,
    ...styleActions,
    ...templateActions,
  };
};
