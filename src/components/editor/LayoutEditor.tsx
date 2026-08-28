import { useState } from "react";

export type CanvasViewport = "desktop" | "tablet" | "mobile";

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
import { filterLayerComponents } from "./utils/componentSearch";
import { type TemplateItem } from "../../types/types";

import { data } from "../../data/data";
import { useComponentActions } from "./hooks/useComponentActions";
import { useSnapLayout } from "./hooks/useSnapLayout";

function LayoutEditor() {
  const [previewMode, setPreviewMode] = useState(false);

  const [canvasViewport, setCanvasViewport] =
    useState<CanvasViewport>("desktop");

  const canvasWidthMap: Record<CanvasViewport, number> = {
    desktop: 1100,
    tablet: 768,
    mobile: 390,
  };

  const canvasWidth = canvasWidthMap[canvasViewport];

  const [templateFiles, setTemplateFiles] = useState<
    { name: string; data: TemplateItem }[]
  >([]);

  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null,
  );

  const [editorSyncKey, setEditorSyncKey] = useState(0);

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
    editLayout,
    setEditLayout,
    // Divider and Spacer specific states
    editDividerThickness,
    setEditDividerThickness,
    editDividerColor,
    setEditDividerColor,
    editDividerLineStyle,
    setEditDividerLineStyle,
    editSpacerHeight,
    setEditSpacerHeight,
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

  const [projectCustomCss, setProjectCustomCss] = useState("");

  const [showProjectCssModal, setShowProjectCssModal] = useState(false);

  const [projectCssDraft, setProjectCssDraft] = useState("");

  const {
    lastAutoSavedAt,
    restoreData,
    showRestoreModal,
    setAutoSaveBaseline,
    discardAutoSave,
    restoreAutoSave,
  } = useAutoSave({
    components,
    projectCustomCss,
    resetHistory,
    setProjectCustomCss,
    setSelectedComponentId,
  });

  const isMobile = useMediaQuery("(max-width: 767.98px)");

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

  const { snapLayout } = useSnapLayout({
    snapEnabled,
    gridSize,
  });

  const filteredLayerComponents = filterLayerComponents(
    components,
    layerSearch,
  );

  const {
    openCreateModal,
    closeCreateModal,
    createComponent,
    deleteComponent,
    copyComponent,
    selectComponent,
    editComponent,
    resetEditPanelToSelected,
    saveEditedComponent,
    dropTemplate,
    updateLayout,
    updateSelectedComponentImmediate,
    handleStyleApply,
  } = useComponentActions({
    components,
    selectedComponentId,
    setSelectedComponentId,
    showEditModal,
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
    templates: templateFiles.map((file) => file.data),
    selectedTemplateId,
    setSelectedTemplateId,
    setEditLayout,
    snapLayout,
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
      editDividerThickness,
      editDividerColor,
      editDividerLineStyle,
      editSpacerHeight,
      editLayout,
    },
  });

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
    dropTemplate,
    commitHistory,
  });

  const handleUndo = () => {
    undo();
    setEditorSyncKey((prev) => prev + 1);
  };

  const handleRedo = () => {
    redo();
    setEditorSyncKey((prev) => prev + 1);
  };

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

  return (
    <>
      <LayoutEditorStyles />
      {/* 프로젝트 전체 CSS */}
      <style>{projectCustomCss}</style>
      {/* 컴포넌트별 CSS */}
      <style>{componentCustomCss}</style>
      {/* 모바일에서 레이어 패널이 열려있을 때, 뒤쪽 클릭 방지용 백드롭 */}
      {isMobile && showLayerPanel && (
        <div
          className="editor-panel-backdrop"
          onClick={() => {
            setShowLayerPanel(false);
          }}
        />
      )}
      <LayerPanel
        previewMode={previewMode}
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
          marginRight: showEditModal ? 400 : 0,
        }}
      >
        <ProjectToolbar
          previewMode={previewMode}
          isMobile={isMobile}
          canvasViewport={canvasViewport}
          onCanvasViewportChange={setCanvasViewport}
          snapEnabled={snapEnabled}
          gridSize={gridSize}
          canUndo={canUndo}
          canRedo={canRedo}
          hasUnsavedChanges={hasUnsavedChanges}
          hasSelectedComponent={Boolean(selectedComponentId)}
          lastAutoSavedAt={lastAutoSavedAt}
          setSelectedComponentId={setSelectedComponentId}
          setPreviewMode={setPreviewMode}
          onSnapEnabledChange={setSnapEnabled}
          onGridSizeChange={setGridSize}
          onOpenProjectCss={openProjectCssModal}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onSaveProject={saveProjectFile}
          onLoadProject={loadProjectFile}
          onDownloadHtml={downloadHtml}
          onOpenProjectTemplate={openProjectTemplateSaveModal}
          onOpenSelectedTemplate={openSelectedTemplateSaveModal}
          onLoadTemplate={loadTemplateFile}
        />

        <BuilderCanvas
          previewMode={previewMode}
          canvasWidth={canvasWidth}
          components={components}
          selectedComponentId={selectedComponentId}
          draggingId={draggingId}
          layerSearch={layerSearch}
          activeDropTarget={activeDropTarget}
          setPreviewMode={setPreviewMode}
          setActiveDropTarget={setActiveDropTarget}
          onLayoutChange={updateLayout}
          onSelect={selectComponent}
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
            setShowLayerPanel((prev) => !prev);
          }}
          style={{
            flex: 1,
          }}
        >
          레이어
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
        editDividerThickness={editDividerThickness}
        setEditDividerThickness={setEditDividerThickness}
        editDividerColor={editDividerColor}
        setEditDividerColor={setEditDividerColor}
        editDividerLineStyle={editDividerLineStyle}
        setEditDividerLineStyle={setEditDividerLineStyle}
        editSpacerHeight={editSpacerHeight}
        setEditSpacerHeight={setEditSpacerHeight}
        resetEditPanelToSelected={resetEditPanelToSelected}
        saveEditedComponent={saveEditedComponent}
        favoriteComponents={favoriteComponents}
        addSelectedComponentToFavorites={addSelectedComponentToFavorites}
        insertFavoriteComponent={insertFavoriteComponent}
        removeFavoriteComponent={removeFavoriteComponent}
        editLayout={editLayout}
        setEditLayout={setEditLayout}
        onLayoutChange={updateLayout}
        templateFiles={templateFiles}
        setTemplateFiles={setTemplateFiles}
        selectedTemplateId={selectedTemplateId}
        setSelectedTemplateId={setSelectedTemplateId}
        onImmediateChange={updateSelectedComponentImmediate}
        editorSyncKey={editorSyncKey}
        onStyleApply={handleStyleApply}
      />
    </>
  );
}

export default LayoutEditor;
