import { useCallback, useEffect, useMemo, useState } from "react";

import BuilderCanvas from "../canvas/BuilderCanvas";
import LayerPanel from "./layerpanel/LayerPanel";
import ProjectToolbar from "./toolbar/ProjectToolbar";
import AutoSaveRestoreModal from "./modals/AutoSaveRestoreModal";
import ProjectCssModal from "./modals/ProjectCssModal";
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
import { useTemplates } from "./hooks/useTemplates";
import { collectComponentCustomCss } from "./utils/customCssUtils";
import { downloadHtmlFile } from "./utils/htmlexport/htmlExport";
import { filterLayerComponents } from "./utils/componentSearch";
import { type TemplateItem } from "../../types/types";

import { data } from "../../data/data";
import { useComponentActions } from "./hooks/useComponentActions";
import { useSnapLayout } from "./hooks/useSnapLayout";

import type { CanvasViewport, LeftPanelTab } from "../../types/types";
import { usePositionParent } from "./hooks/usePositionParent";
import ComponentPanel from "./componentpanel/ComponentPanel";
import { findComponentRecursive } from "./utils/componentTree";

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

  const [selectedComponentIds, setSelectedComponentIds] = useState<string[]>(
    [],
  );

  const [editorSyncKey, setEditorSyncKey] = useState(0);

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
    makeComponentByType,
  } = useCreateComponentForm();

  const [showEditModal, setShowEditModal] = useState(
    () => window.innerWidth > 767.98,
  );

  const {
    components,
    commitHistory,
    setComponents,
    resetHistory,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useComponentHistory({
    initialComponents: data,
    selectedComponentIds,
    setSelectedComponentIds,
  });

  const {
    draftComponent,
    editType,
    editStyle,
    setEditStyle,
    editContentStyle,
    setEditContentStyle,
    editCustomCss,
    setEditCustomCss,
    editComponentName,
    loadComponentToEdit,
    editLayout,
    setEditLayout,
    updateDraftComponent,
    resetEditForm,
  } = useEditComponentForm({ setComponents });

  useEffect(() => {
    if (!draftComponent) {
      return;
    }

    const component = findComponentRecursive(components, draftComponent.id);

    if (component) {
      return;
    }

    resetEditForm();
  }, [components, draftComponent, resetEditForm]);

  const [snapEnabled, setSnapEnabled] = useState(true);
  const [gridSize, setGridSize] = useState(10);

  const [insertTarget, setInsertTarget] = useState<{
    parentId: string | null;
    index: number;
  } | null>(null);

  const [leftPanelTab, setLeftPanelTab] = useState<LeftPanelTab>("layers");

  const [showLayerPanel, setShowLayerPanel] = useState(
    () => window.innerWidth > 768,
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
    setSelectedComponentIds,
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
    selectedComponentIds,
    commitHistory,
    setSelectedComponentIds,
  });

  useEditorShortcuts({
    components,
    selectedComponentIds,
    commitHistory,
    setSelectedComponentIds,
  });

  const { hasUnsavedChanges, saveProjectFile, loadProjectFile } =
    useProjectFiles({
      components,
      projectCustomCss,
      setProjectCustomCss,
      resetHistory,
      setSelectedComponentIds,
      setAutoSaveBaseline,
    });

  const { loadTemplateFile, saveProjectTemplate, saveSelectedTemplate } =
    useTemplates({
      components,
      selectedComponentIds,
      commitHistory,
      setSelectedComponentIds,
    });

  const { snapLayout } = useSnapLayout({
    snapEnabled,
    gridSize,
  });

  const filteredLayerComponents = useMemo(
    () => filterLayerComponents(components, layerSearch),
    [components, layerSearch],
  );

  const templates = useMemo(
    () => templateFiles.map((file) => file.data),
    [templateFiles],
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
    draftComponent,
    selectedComponentIds,
    setSelectedComponentIds,
    showEditModal,
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
    setFavoriteComponents,
    templates,
    selectedTemplateId,
    setSelectedTemplateId,
    setEditLayout,
    snapLayout,
    resetEditForm,
  });

  const {
    draggingIds,
    droppedIds,
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
    selectedComponentIds,
    dropTemplate,
    commitHistory,
    makeComponentByType,
    setSelectedComponentIds,
  });

  const { positionParentOptions, handlePositionParentChange } =
    usePositionParent({
      components,
      selectedComponentIds,
      setEditLayout,
      updateLayout,
    });

  const handleUndo = useCallback(() => {
    undo();
    setEditorSyncKey((prev) => prev + 1);
  }, [undo]);

  const handleRedo = useCallback(() => {
    redo();
    setEditorSyncKey((prev) => prev + 1);
  }, [redo]);

  const componentCustomCss = useMemo(
    () => collectComponentCustomCss(components),
    [components],
  );

  const openProjectCssModal = useCallback(() => {
    setProjectCssDraft(projectCustomCss);
    setShowProjectCssModal(true);
  }, [projectCustomCss]);

  const closeProjectCssModal = useCallback(() => {
    setShowProjectCssModal(false);
  }, []);

  const saveProjectCustomCss = useCallback(() => {
    setProjectCustomCss(projectCssDraft);
    setShowProjectCssModal(false);
  }, [projectCssDraft]);

  const downloadHtml = useCallback(
    () => downloadHtmlFile(components, projectCustomCss),
    [components, projectCustomCss],
  );

  const openLayerPanel = useCallback(() => {
    setShowLayerPanel(true);
  }, []);

  const closeLayerPanel = useCallback(() => {
    setShowLayerPanel(false);
  }, []);

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
            closeLayerPanel();
          }}
        />
      )}
      {showLayerPanel && (
        <aside
          className="editor-left-panel"
          style={{
            position: "fixed",
            left: 0,
            top: 0,
            bottom: 0,
            width: 280,
            zIndex: 1200,
            background: "#fff",
            borderRight: "1px solid #dee2e6",
            paddingTop: 30,

            display: "flex",
            flexDirection: "column",

            // 중요
            height: "100vh",
            overflow: "hidden",
          }}
        >
          {/* 탭 영역 */}
          <div
            className="editor-left-panel-tabs"
            style={{
              display: "flex",
              gap: 4,
              padding: 8,
              borderBottom: "1px solid #dee2e6",
              flexShrink: 0,
              background: "#fff",
              position: "relative",
              zIndex: 10,
            }}
          >
            <button
              type="button"
              className={`btn btn-sm ${
                leftPanelTab === "layers" ? "btn-dark" : "btn-outline-secondary"
              }`}
              style={{ flex: 1 }}
              onClick={() => setLeftPanelTab("layers")}
            >
              레이어
            </button>

            <button
              type="button"
              className={`btn btn-sm ${
                leftPanelTab === "components"
                  ? "btn-dark"
                  : "btn-outline-secondary"
              }`}
              style={{ flex: 1 }}
              onClick={() => setLeftPanelTab("components")}
            >
              새 컴포넌트
            </button>

            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={closeLayerPanel}
            >
              ×
            </button>
          </div>

          {/* 탭 콘텐츠 */}
          <div
            style={{
              flex: 1,
              minHeight: 0,
              overflow: "auto",
              position: "relative",
            }}
          >
            {leftPanelTab === "components" ? (
              <ComponentPanel />
            ) : (
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  height: "100%",
                }}
              >
                <LayerPanel
                  previewMode={previewMode}
                  visible
                  components={filteredLayerComponents}
                  selectedComponentIds={selectedComponentIds}
                  draggingIds={draggingIds}
                  search={layerSearch}
                  activeDropTarget={activeDropTarget}
                  setSelectedComponentIds={setSelectedComponentIds}
                  onSearchChange={setLayerSearch}
                  onSelect={selectComponent}
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
              </div>
            )}
          </div>
        </aside>
      )}
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
            setLeftPanelTab("components");
            openLayerPanel();
          }}
          style={{
            position: "fixed",

            left: 16,
            top: 16,

            zIndex: 1100,
          }}
        >
          패널
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
          hasSelectedComponent={selectedComponentIds.length > 0}
          lastAutoSavedAt={lastAutoSavedAt}
          onClearSelection={() => setSelectedComponentIds([])}
          setPreviewMode={setPreviewMode}
          onSnapEnabledChange={setSnapEnabled}
          onGridSizeChange={setGridSize}
          onOpenProjectCss={openProjectCssModal}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onSaveProject={saveProjectFile}
          onLoadProject={loadProjectFile}
          onDownloadHtml={downloadHtml}
          onOpenProjectTemplate={saveProjectTemplate}
          onOpenSelectedTemplate={saveSelectedTemplate}
          onLoadTemplate={loadTemplateFile}
        />

        <BuilderCanvas
          previewMode={previewMode}
          canvasWidth={canvasWidth}
          components={components}
          droppedIds={droppedIds}
          selectedComponentIds={selectedComponentIds}
          draggingIds={draggingIds}
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
          snapLayout={snapLayout}
        />
      </div>
      <div className="editor-mobile-panel-buttons">
        <button
          type="button"
          className={`btn btn-sm ${
            showLayerPanel && leftPanelTab === "components"
              ? "btn-dark"
              : "btn-outline-dark"
          }`}
          onClick={() => {
            setLeftPanelTab("components");
            setShowLayerPanel(true);
          }}
          style={{ flex: 1 }}
        >
          컴포넌트
        </button>

        <button
          type="button"
          className={`btn btn-sm ${
            showLayerPanel && leftPanelTab === "layers"
              ? "btn-dark"
              : "btn-outline-dark"
          }`}
          onClick={() => {
            setLeftPanelTab("layers");
            setShowLayerPanel(true);
          }}
          style={{ flex: 1 }}
        >
          레이어
        </button>
      </div>
      <AutoSaveRestoreModal
        data={showRestoreModal ? restoreData : null}
        onRestore={restoreAutoSave}
        onDiscard={discardAutoSave}
      />

      <ProjectCssModal
        open={showProjectCssModal}
        value={projectCssDraft}
        onChange={setProjectCssDraft}
        onClose={closeProjectCssModal}
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
        draftComponent={draftComponent}
        updateDraftComponent={updateDraftComponent}
        selectedComponentIds={selectedComponentIds}
        editorSyncKey={editorSyncKey}
        editType={editType}
        editComponentName={editComponentName}
        editStyle={editStyle}
        setEditStyle={setEditStyle}
        editContentStyle={editContentStyle}
        setEditContentStyle={setEditContentStyle}
        editCustomCss={editCustomCss}
        setEditCustomCss={setEditCustomCss}
        resetEditPanelToSelected={resetEditPanelToSelected}
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
        onStyleApply={handleStyleApply}
        saveEditedComponent={saveEditedComponent}
        positionParentOptions={positionParentOptions}
        onPositionParentChange={handlePositionParentChange}
      />
    </>
  );
}

export default LayoutEditor;
