import type {
  ComponentLayout,
  LayoutComponent,
  TemplateItem,  
} from "../../../types/types";

import type {
  BooleanSetter,
  CommitHistory,
  FavoriteSetter,
  InsertTarget,
  InsertTargetSetter,
  SetComponents,
} from "../../../types/types";

import { useCreateActions } from "./actions/useCreateActions";
import { useCrudActions } from "./actions/useCrudActions";
import { useSelectionActions } from "./actions/useSelectionActions";
import { useEditSaveActions } from "./actions/useEditSaveActions";
import { useTemplateActions } from "./actions/useTemplateActions";
import { useLayoutActions } from "./actions/useLayoutActions";
import { useStyleActions } from "./actions/useStyleActions";
import type { ComponentRegistry, RegistryComponentType } from "../registry/componentRegistry";

type Options = {
  componentRegistry: ComponentRegistry;
  components: LayoutComponent[];

  selectedComponentIds: string[];
  setSelectedComponentIds: React.Dispatch<React.SetStateAction<string[]>>;

  showEditModal: boolean;
  setShowEditModal: BooleanSetter;

  setShowCreateModal: BooleanSetter;
  insertTarget: InsertTarget;
  setInsertTarget: InsertTargetSetter;

  draftComponent: LayoutComponent | null;

  newType: RegistryComponentType;
  setNewType: (type: RegistryComponentType) => void;
  resetCreateForm: () => void;
  makeNewComponent: () => LayoutComponent;

  loadComponentToEdit: (component: LayoutComponent) => void;

  commitHistory: CommitHistory;
  setComponents: SetComponents;

  setFavoriteComponents: FavoriteSetter;

  templates: TemplateItem[];
  selectedTemplateId: string | null;
  setSelectedTemplateId: (id: string | null) => void;

  setEditLayout: React.Dispatch<React.SetStateAction<Partial<ComponentLayout>>>;
  snapLayout: (layout: Partial<ComponentLayout>) => Partial<ComponentLayout>;

  resetEditForm: () => void;
};

export const useComponentActions = ({
  componentRegistry,
  components,
  draftComponent,
  selectedComponentIds,
  setSelectedComponentIds,
  setShowEditModal,
  setShowCreateModal,
  insertTarget,
  setInsertTarget,
  newType,
  setNewType,
  resetCreateForm,
  makeNewComponent,
  loadComponentToEdit,
  commitHistory,
  setComponents,
  templates,
  selectedTemplateId,
  setSelectedTemplateId,
  setEditLayout,
  snapLayout,
  resetEditForm,
}: Options) => {
  const createActions = useCreateActions({
    componentRegistry,
    components,
    insertTarget,
    setInsertTarget,
    setShowCreateModal,
    setShowEditModal,
    setSelectedComponentIds,
    newType,
    setNewType,
    resetCreateForm,
    makeNewComponent,
    loadComponentToEdit,
    commitHistory,
  });

  const crudActions = useCrudActions({
    components,
    selectedComponentIds,
    setSelectedComponentIds,
    commitHistory,
    resetEditForm,
  });

  const selectionActions = useSelectionActions({
    components,
    selectedComponentIds,
    setSelectedComponentIds,
    setShowEditModal,
    loadComponentToEdit,
  });

  const editActions = useEditSaveActions({
    draftComponent,
    setComponents,
  });

  const templateActions = useTemplateActions({
    templates,
    selectedTemplateId,
    setSelectedTemplateId,
    commitHistory,
  });

  const layoutActions = useLayoutActions({
    selectedComponentIds,
    setComponents,
    setEditLayout,
    snapLayout,
  });

  const styleActions = useStyleActions({
    selectedComponentIds,
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
