import { useState } from "react";

import BuilderCanvas from "../canvas/BuilderCanvas";
import LayerPanel from "../layers/LayerPanel";
import ProjectToolbar from "../toolbar/ProjectToolbar";
import AutoSaveRestoreModal from "../modals/AutoSaveRestoreModal";
import ProjectCssModal from "../modals/ProjectCssModal";
import TemplateSaveModal from "../modals/TemplateSaveModal";
import LayoutEditorStyles from "./styles/LayoutEditorStyles";
import { useComponentHistory } from "./hooks/useComponentHistory";
import { useComponentDragDrop } from "./hooks/useComponentDragDrop";
import { useMediaQuery } from "./hooks/useMediaQuery";
import { useAutoSave } from "./hooks/useAutoSave";
import { useCreateComponentForm } from "./hooks/useCreateComponentForm";
import CreateComponentModal from "./create/CreateComponentModal";
import { useEditComponentForm } from "./hooks/useEditComponentForm";
import EditComponentPanel from "./edit/EditComponentPanel";
import { useFavoriteComponents } from "./hooks/useFavoriteComponents";
import { useEditorShortcuts } from "./hooks/useEditorShortcuts";
import { useProjectFiles } from "./hooks/useProjectFiles";
import { sanitizeFileName, useTemplates } from "./hooks/useTemplates";
import { collectComponentCustomCss } from "./utils/customCssUtils";
import { downloadHtmlFile } from "./utils/htmlExport";
import { updateLayoutRecursive } from "./utils/componentTree";
import { filterLayerComponents } from "./utils/componentSearch";
import { type ComponentLayout, type LayoutComponent } from "../../types/types";

import { data } from "../../data/data";
import { useComponentActions } from "./hooks/useComponentActions";

function LayoutEditor() {
  const {
    components,
    commitHistory,
    setComponents,
    resetHistory,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useComponentHistory(data);

  const [showCreateModal, setShowCreateModal] = useState(false);

  const {
    newType,
    setNewType,
    newTitle,
    setNewTitle,
    newValue,
    setNewValue,
    newPlaceholder,
    setNewPlaceholder,
    newDirection,
    setNewDirection,
    newImagePreviewUrl,
    setNewImagePreviewUrl,
    newLinkType,
    setNewLinkType,
    newLinkNewWindow,
    setNewLinkNewWindow,
    newComponentName,
    setNewComponentName,
    newHeadingText,
    setNewHeadingText,
    newHeadingLevel,
    setNewHeadingLevel,
    resetCreateForm,
    makeNewComponent,
  } = useCreateComponentForm();

  const [showEditModal, setShowEditModal] = useState(
    () => window.innerWidth > 767.98,
  );

  const {
    editingComponentId,
    editType,
    editTitle,
    setEditTitle,
    editValue,
    setEditValue,
    editPlaceholder,
    setEditPlaceholder,
    editDirection,
    setEditDirection,
    editDisabled,
    setEditDisabled,
    editStyle,
    setEditStyle,
    editContentStyle,
    setEditContentStyle,
    editCustomCss,
    setEditCustomCss,
    editTab,
    setEditTab,
    editImageUrl,
    setEditImageUrl,
    editImagePreviewUrl,
    setEditImagePreviewUrl,
    editLinkType,
    setEditLinkType,
    editLinkNewWindow,
    setEditLinkNewWindow,
    editComponentName,
    setEditComponentName,
    editHeadingLevel,
    setEditHeadingLevel,
    loadComponentToEdit,
  } = useEditComponentForm();

  const [snapEnabled, setSnapEnabled] = useState(true);
  const [gridSize, setGridSize] = useState(10);

  const [insertTarget, setInsertTarget] = useState<{
    parentId: string | null;
    index: number;
  } | null>(null);

  const [showLayerPanel, setShowLayerPanel] = useState(
    () => window.innerWidth > 768,
  );

  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(
    null,
  );

  const [layerSearch, setLayerSearch] = useState("");

  const [showFavoritePanel, setShowFavoritePanel] = useState(false);

  const [projectCustomCss, setProjectCustomCss] = useState("");

  const [showProjectCssModal, setShowProjectCssModal] = useState(false);

  const [projectCssDraft, setProjectCssDraft] = useState("");

  const {
    lastAutoSavedAt,
    restoreData,
    showRestoreModal,
    setAutoSaveBaseline,
    discardAutoSave,
    consumeRestoreData,
  } = useAutoSave({
    components,
    projectCustomCss,
  });

  const isMobile = useMediaQuery("(max-width: 767.98px)");

  const restoreAutoSave = () => {
    if (!restoreData) {
      return;
    }

    const restoredCss = restoreData.projectCustomCss ?? "";

    resetHistory(restoreData.components);

    setProjectCustomCss(restoredCss);

    setSelectedComponentId(null);

    consumeRestoreData({
      ...restoreData,
      projectCustomCss: restoredCss,
    });
  };

  const {
    favoriteComponents,
    setFavoriteComponents,
    addSelectedComponentToFavorites,
    insertFavoriteComponent,
    removeFavoriteComponent,
  } = useFavoriteComponents({
    components,
    selectedComponentId,
    commitHistory,
    setSelectedComponentId,
  });

  useEditorShortcuts({
    components,
    selectedComponentId,
    commitHistory,
    setSelectedComponentId,
  });

  const { hasUnsavedChanges, saveProjectFile, loadProjectFile } =
    useProjectFiles({
      components,
      projectCustomCss,
      setProjectCustomCss,
      resetHistory,
      setSelectedComponentId,
      setAutoSaveBaseline,
    });

  const {
    showTemplateSaveModal,
    setShowTemplateSaveModal,
    templateSaveType,
    templateFileName,
    setTemplateFileName,
    loadTemplateFile,
    saveTemplateFromModal,
    openProjectTemplateSaveModal,
    openSelectedTemplateSaveModal,
  } = useTemplates({
    components,
    selectedComponentId,
    commitHistory,
    setSelectedComponentId,
  });

  const snapNumber = (value: number, size: number) => {
    return Math.round(value / size) * size;
  };

  const snapLayout = (
    layout: Partial<ComponentLayout>,
  ): Partial<ComponentLayout> => {
    if (!snapEnabled) {
      return layout;
    }

    const next = {
      ...layout,
    };

    Object.entries(next).forEach(([key, value]) => {
      if (typeof value !== "number") {
        return;
      }

      (next as Record<string, unknown>)[key] = snapNumber(value, gridSize);
    });

    return next;
  };

  const filteredLayerComponents = filterLayerComponents(
    components,
    layerSearch,
  );

  const {
    draggingId,
    activeDropTarget,
    setActiveDropTarget,
    handleDragStart,
    handleDragEnd,
    handlePointerDragStart,
    handlePointerDragMove,
    handlePointerDragEnd,
    handlePointerDragCancel,
    handleDrop,
  } = useComponentDragDrop({
    components,
    layerSearch,
    commitHistory,
  });

  const updateLayout = (id: string, newLayout: Partial<ComponentLayout>) => {
    // 그리드 스냅 적용
    const snappedLayout = snapLayout(newLayout);

    const updater = (prev: LayoutComponent[]) =>
      updateLayoutRecursive(prev, id, snappedLayout);

    // 일반 단발 변경
    setComponents(updater);
  };

  const {
    openCreateModal,
    closeCreateModal,
    createComponent,
    deleteComponent,
    copyComponent,
    // selectComponent,
    editComponent,
    resetEditPanelToSelected,
    saveEditedComponent,
  } = useComponentActions({
    components,
    selectedComponentId,
    setSelectedComponentId,
    showEditModal,
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
    editValues: {
      editingComponentId,
      editTitle,
      editValue,
      editPlaceholder,
      editDirection,
      editDisabled,
      editStyle,
      editContentStyle,
      editCustomCss,
      editImageUrl,
      editLinkType,
      editLinkNewWindow,
      editComponentName,
      editHeadingLevel,
    },
  });

  const componentCustomCss = collectComponentCustomCss(components);

  const openProjectCssModal = () => {
    setProjectCssDraft(projectCustomCss);

    setShowProjectCssModal(true);
  };

  const saveProjectCustomCss = () => {
    setProjectCustomCss(projectCssDraft);

    setShowProjectCssModal(false);
  };

  const downloadHtml = () => downloadHtmlFile(components, projectCustomCss);

  const showAnySidePanel = showLayerPanel || showFavoritePanel;

  return (
    <>
      <LayoutEditorStyles />
      {/* 프로젝트 전체 CSS */}
      <style>{projectCustomCss}</style>
      {/* 컴포넌트별 CSS */}
      <style>{componentCustomCss}</style>
      {showAnySidePanel && (
        <div
          className="editor-panel-backdrop"
          onClick={() => {
            setShowLayerPanel(false);
            setShowFavoritePanel(false);
          }}
        />
      )}
      <LayerPanel
        visible={showLayerPanel}
        components={filteredLayerComponents}
        selectedComponentId={selectedComponentId}
        draggingId={draggingId}
        search={layerSearch}
        activeDropTarget={activeDropTarget}
        onSearchChange={setLayerSearch}
        onClose={() => setShowLayerPanel(false)}
        //onSelect={selectComponent}
        onEdit={editComponent}
        onAddFavorite={addSelectedComponentToFavorites}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onPointerDragStart={handlePointerDragStart}
        onPointerDragMove={handlePointerDragMove}
        onPointerDragEnd={handlePointerDragEnd}
        onPointerDragCancel={handlePointerDragCancel}
        onDrop={handleDrop}
        onActiveDropTargetChange={setActiveDropTarget}
      />
      {!showLayerPanel && (
        <button
          type="button"
          className="
          btn
          btn-dark
          btn-sm
          desktop-layer-open-button
        "
          onClick={() => {
            setShowFavoritePanel(false);
            setShowLayerPanel(true);
          }}
          style={{
            position: "fixed",

            left: 16,
            top: 16,

            zIndex: 1100,
          }}
        >
          레이어
        </button>
      )}
      <div
        className="
        position-relative
        editor-main
      "
        style={{
          minHeight: "100vh",

          padding: "20px 28px 48px",

          marginLeft: showLayerPanel ? 280 : 0,
          marginRight: showEditModal ? 380 : showFavoritePanel ? 300 : 0,
        }}
      >
        <ProjectToolbar
          snapEnabled={snapEnabled}
          gridSize={gridSize}
          canUndo={canUndo}
          canRedo={canRedo}
          hasUnsavedChanges={hasUnsavedChanges}
          hasSelectedComponent={Boolean(selectedComponentId)}
          lastAutoSavedAt={lastAutoSavedAt}
          onSnapEnabledChange={setSnapEnabled}
          onGridSizeChange={setGridSize}
          onOpenProjectCss={openProjectCssModal}
          onUndo={undo}
          onRedo={redo}
          onSaveProject={saveProjectFile}
          onLoadProject={loadProjectFile}
          onDownloadHtml={downloadHtml}
          onOpenProjectTemplate={openProjectTemplateSaveModal}
          onOpenSelectedTemplate={openSelectedTemplateSaveModal}
          onLoadTemplate={loadTemplateFile}
        />

        <BuilderCanvas
          components={components}
          selectedComponentId={selectedComponentId}
          draggingId={draggingId}
          layerSearch={layerSearch}
          activeDropTarget={activeDropTarget}
          setActiveDropTarget={setActiveDropTarget}
          onLayoutChange={updateLayout}
          onEdit={editComponent}
          onCopy={copyComponent}
          onDelete={deleteComponent}
          onCreate={openCreateModal}
          onDrop={handleDrop}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onPointerDragStart={handlePointerDragStart}
          onPointerDragMove={handlePointerDragMove}
          onPointerDragEnd={handlePointerDragEnd}
          onPointerDragCancel={handlePointerDragCancel}
        />
      </div>
      <div className="editor-mobile-panel-buttons">
        <button
          type="button"
          className="btn btn-dark btn-sm"
          onClick={() => {
            setShowFavoritePanel(false);
            setShowLayerPanel((prev) => !prev);
          }}
          style={{
            flex: 1,
          }}
        >
          레이어
        </button>

        <button
          type="button"
          className="
          btn
          btn-warning
          btn-sm
        "
          onClick={() => {
            setShowLayerPanel(false);
            setShowFavoritePanel((prev) => !prev);
          }}
          style={{
            flex: 1,
          }}
        >
          ⭐ 즐겨찾기
          {favoriteComponents.length > 0 && <> ({favoriteComponents.length})</>}
        </button>
      </div>
      <AutoSaveRestoreModal
        data={showRestoreModal ? restoreData : null}
        onRestore={restoreAutoSave}
        onDiscard={discardAutoSave}
      />
      <TemplateSaveModal
        open={showTemplateSaveModal}
        type={templateSaveType}
        fileName={templateFileName}
        sanitizedFileName={sanitizeFileName(templateFileName)}
        onFileNameChange={setTemplateFileName}
        onClose={() => setShowTemplateSaveModal(false)}
        onSave={saveTemplateFromModal}
      />
      <ProjectCssModal
        open={showProjectCssModal}
        value={projectCssDraft}
        onChange={setProjectCssDraft}
        onClose={() => setShowProjectCssModal(false)}
        onSave={saveProjectCustomCss}
      />
      <CreateComponentModal
        open={showCreateModal}
        newType={newType}
        setNewType={setNewType}
        newTitle={newTitle}
        setNewTitle={setNewTitle}
        newValue={newValue}
        setNewValue={setNewValue}
        newPlaceholder={newPlaceholder}
        setNewPlaceholder={setNewPlaceholder}
        newDirection={newDirection}
        setNewDirection={setNewDirection}
        newImagePreviewUrl={newImagePreviewUrl}
        setNewImagePreviewUrl={setNewImagePreviewUrl}
        newLinkType={newLinkType}
        setNewLinkType={setNewLinkType}
        newLinkNewWindow={newLinkNewWindow}
        setNewLinkNewWindow={setNewLinkNewWindow}
        newComponentName={newComponentName}
        setNewComponentName={setNewComponentName}
        newHeadingText={newHeadingText}
        setNewHeadingText={setNewHeadingText}
        newHeadingLevel={newHeadingLevel}
        setNewHeadingLevel={setNewHeadingLevel}
        onClose={closeCreateModal}
        onCreate={createComponent}
      />
      <EditComponentPanel
        isMobile={isMobile}
        showEditModal={showEditModal}
        setShowEditModal={setShowEditModal}
        selectedComponentId={selectedComponentId}
        editType={editType}
        editTitle={editTitle}
        setEditTitle={setEditTitle}
        editValue={editValue}
        setEditValue={setEditValue}
        editPlaceholder={editPlaceholder}
        setEditPlaceholder={setEditPlaceholder}
        editDirection={editDirection}
        setEditDirection={setEditDirection}
        editDisabled={editDisabled}
        setEditDisabled={setEditDisabled}
        editStyle={editStyle}
        setEditStyle={setEditStyle}
        editContentStyle={editContentStyle}
        setEditContentStyle={setEditContentStyle}
        editCustomCss={editCustomCss}
        setEditCustomCss={setEditCustomCss}
        editTab={editTab}
        setEditTab={setEditTab}
        editImageUrl={editImageUrl}
        setEditImageUrl={setEditImageUrl}
        editImagePreviewUrl={editImagePreviewUrl}
        setEditImagePreviewUrl={setEditImagePreviewUrl}
        editLinkType={editLinkType}
        setEditLinkType={setEditLinkType}
        editLinkNewWindow={editLinkNewWindow}
        setEditLinkNewWindow={setEditLinkNewWindow}
        editComponentName={editComponentName}
        setEditComponentName={setEditComponentName}
        editHeadingLevel={editHeadingLevel}
        setEditHeadingLevel={setEditHeadingLevel}
        resetEditPanelToSelected={resetEditPanelToSelected}
        saveEditedComponent={saveEditedComponent}
        favoriteComponents={favoriteComponents}
        addSelectedComponentToFavorites={addSelectedComponentToFavorites}
        insertFavoriteComponent={insertFavoriteComponent}
        removeFavoriteComponent={removeFavoriteComponent}
      />
    </>
  );
}

export default LayoutEditor;
