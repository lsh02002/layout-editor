import {
  useEffect,
  type CSSProperties,
  type Dispatch,
  type SetStateAction,
} from "react";

import type {
  ComponentLayout,
  ComponentType,
  FavoriteComponent,
  LayoutComponent,
  LinkType,
  TemplateItem,
  HeadingLevel,
  ContainerAlignItems,
  ContainerJustifyContent,
  CodeLanguage,
} from "../../../types/types";

import type { EditTab } from "../hooks/useEditComponentForm";
import EditBasicTab from "./tabs/EditBasicTab";
import EditStyleTab from "./tabs/EditStyleTab";
import EditCssTab from "./tabs/EditCssTab";
import ComponentLibraryPanel from "../librarypanel/ComponentLibraryPanel";
import { useLogin } from "../../../context/usehooks";

type Props = {
  isMobile: boolean;
  showEditModal: boolean;
  setShowEditModal: Dispatch<SetStateAction<boolean>>;

  selectedComponentId: string | null;

  /*
   * Undo / Redo가 실행될 때만 변경되는 값
   */
  editorSyncKey: number;

  editType: ComponentType;

  editTitle: string;
  setEditTitle: Dispatch<SetStateAction<string>>;

  editValue: string;
  setEditValue: Dispatch<SetStateAction<string>>;

  editPlaceholder: string;
  setEditPlaceholder: Dispatch<SetStateAction<string>>;

  editDirection: "row" | "column";
  setEditDirection: Dispatch<SetStateAction<"row" | "column">>;

  editDisabled: boolean;
  setEditDisabled: Dispatch<SetStateAction<boolean>>;

  editStyle: CSSProperties;
  setEditStyle: Dispatch<SetStateAction<CSSProperties>>;

  editContentStyle: CSSProperties;
  setEditContentStyle: Dispatch<SetStateAction<CSSProperties>>;

  editCustomCss: string;
  setEditCustomCss: Dispatch<SetStateAction<string>>;

  // editTab: EditTab;
  // setEditTab: Dispatch<SetStateAction<EditTab>>;

  editImageUrl: string;
  setEditImageUrl: Dispatch<SetStateAction<string>>;

  editImagePreviewUrl: string;
  setEditImagePreviewUrl: Dispatch<SetStateAction<string>>;

  editLinkType: LinkType;
  setEditLinkType: Dispatch<SetStateAction<LinkType>>;

  editLinkNewWindow: boolean;
  setEditLinkNewWindow: Dispatch<SetStateAction<boolean>>;

  editComponentName: string;
  setEditComponentName: Dispatch<SetStateAction<string>>;

  editHeadingLevel: HeadingLevel;
  setEditHeadingLevel: Dispatch<SetStateAction<HeadingLevel>>;

  editDividerThickness: number;
  setEditDividerThickness: Dispatch<SetStateAction<number>>;

  editDividerColor: string;
  setEditDividerColor: Dispatch<SetStateAction<string>>;

  editDividerLineStyle: "solid" | "dashed" | "dotted";
  setEditDividerLineStyle: Dispatch<
    SetStateAction<"solid" | "dashed" | "dotted">
  >;

  editSpacerHeight: number;
  setEditSpacerHeight: Dispatch<SetStateAction<number>>;

  editContainerGap: number;
  setEditContainerGap: Dispatch<SetStateAction<number>>;
  editContainerJustifyContent: ContainerJustifyContent;
  setEditContainerJustifyContent: Dispatch<
    SetStateAction<ContainerJustifyContent>
  >;
  editContainerAlignItems: ContainerAlignItems;
  setEditContainerAlignItems: Dispatch<SetStateAction<ContainerAlignItems>>;
  editContainerMaxWidth: number | undefined;
  setEditContainerMaxWidth: Dispatch<SetStateAction<number | undefined>>;

  resetEditPanelToSelected: () => void;

  favoriteComponents: FavoriteComponent[];

  addSelectedComponentToFavorites: () => void;

  insertFavoriteComponent: (favorite: FavoriteComponent) => void;

  removeFavoriteComponent: (favoriteId: string) => void;

  editLayout: ComponentLayout;

  setEditLayout: Dispatch<SetStateAction<ComponentLayout>>;

  onLayoutChange: (id: string, layout: Partial<ComponentLayout>) => void;

  templateFiles: {
    name: string;
    data: TemplateItem;
  }[];

  setTemplateFiles: (
    files: {
      name: string;
      data: TemplateItem;
    }[],
  ) => void;

  selectedTemplateId: string | null;

  setSelectedTemplateId: (id: string | null) => void;

  onImmediateChange: (
    updater: (component: LayoutComponent) => LayoutComponent,
  ) => void;

  onStyleApply: (
    target: "style" | "contentStyle",
    key: keyof CSSProperties,
    value: CSSProperties[keyof CSSProperties],
  ) => void;

  saveEditedComponent: () => void;

  positionParentOptions: {
    id: string;
    label: string;
    disabled?: boolean;
  }[];

  onPositionParentChange: (parentId: string | null) => void;

  editVideoControls: boolean;
  setEditVideoControls: Dispatch<SetStateAction<boolean>>;
  editVideoAutoplay: boolean;
  setEditVideoAutoplay: Dispatch<SetStateAction<boolean>>;
  editVideoMuted: boolean;
  setEditVideoMuted: Dispatch<SetStateAction<boolean>>;
  editVideoLoop: boolean;
  setEditVideoLoop: Dispatch<SetStateAction<boolean>>;

  editCodeLanguage: CodeLanguage;
  setEditCodeLanguage: Dispatch<SetStateAction<CodeLanguage>>;
};

function EditComponentPanel({
  isMobile,
  showEditModal,
  setShowEditModal,

  selectedComponentId,
  editorSyncKey,

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

  // editTab,
  // setEditTab,

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

  editDividerThickness,
  setEditDividerThickness,

  editDividerColor,
  setEditDividerColor,

  editDividerLineStyle,
  setEditDividerLineStyle,

  editSpacerHeight,
  setEditSpacerHeight,

  editContainerGap,
  setEditContainerGap,
  editContainerJustifyContent,
  setEditContainerJustifyContent,
  editContainerAlignItems,
  setEditContainerAlignItems,
  editContainerMaxWidth,
  setEditContainerMaxWidth,

  resetEditPanelToSelected,

  favoriteComponents,
  addSelectedComponentToFavorites,
  insertFavoriteComponent,
  removeFavoriteComponent,

  editLayout,
  setEditLayout,

  onLayoutChange,

  templateFiles,
  setTemplateFiles,

  selectedTemplateId,
  setSelectedTemplateId,

  onImmediateChange,

  onStyleApply,

  saveEditedComponent,

  positionParentOptions,
  onPositionParentChange,

  editVideoControls,
  setEditVideoControls,
  editVideoAutoplay,
  setEditVideoAutoplay,
  editVideoMuted,
  setEditVideoMuted,
  editVideoLoop,
  setEditVideoLoop,

  editCodeLanguage,
  setEditCodeLanguage,
}: Props) {
  const { editTab, setEditTab } = useLogin();

  const tabMenus = [
    {
      key: "basic",
      label: "기본 설정",
    },
    {
      key: "style",
      label: "스타일",
    },
    {
      key: "css",
      label: "Custom CSS",
    },
  ];

  useEffect(() => {
    if (!selectedComponentId) {
      return;
    }

    resetEditPanelToSelected();
  }, [editorSyncKey, resetEditPanelToSelected, selectedComponentId]);

  if (isMobile && !showEditModal) {
    return null;
  }

  return (
    <>
      {isMobile && showEditModal && (
        <div
          className="modal-backdrop fade show"
          style={{
            zIndex: 1190,
          }}
          onClick={() => setShowEditModal(false)}
        />
      )}

      <aside
        className="editor-edit-panel"
        style={{
          display: "block",
          zIndex: 1200,
        }}
        tabIndex={-1}
      >
        {/* HEADER */}
        <div className="editor-edit-panel-header">
          <h5 className="modal-title">컴포넌트 수정</h5>

          <div
            className="text-secondary"
            style={{
              fontSize: 12,
              marginTop: 2,
            }}
          >
            {selectedComponentId
              ? editComponentName || editType
              : "선택된 컴포넌트 없음"}
          </div>
        </div>

        {/* 모바일 닫기 */}
        {isMobile && (
          <button
            type="button"
            className="btn-close"
            onClick={() => {
              setShowEditModal(false);
            }}
          />
        )}

        {/* TAB */}
        <div className="px-3 pt-3">
          <ul className="nav nav-tabs">
            {tabMenus.map(({ key, label }) => (
              <li className="nav-item" key={key}>
                <button
                  type="button"
                  className={`nav-link ${editTab === key ? "active" : ""}`}
                  onClick={() => setEditTab(key as EditTab)}
                >
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* BODY */}
        <div className="editor-edit-panel-body">
          {!selectedComponentId ? (
            <div
              className="text-secondary text-center"
              style={{
                padding: "40px 20px",
                fontSize: 13,
              }}
            >
              편집할 컴포넌트를 선택해주세요.
            </div>
          ) : (
            <>
              {/* 기본 설정 */}
              {editTab === "basic" && (
                <EditBasicTab
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
                  editContentStyle={editContentStyle}
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
                  editContainerGap={editContainerGap}
                  setEditContainerGap={setEditContainerGap}
                  editContainerJustifyContent={editContainerJustifyContent}
                  setEditContainerJustifyContent={
                    setEditContainerJustifyContent
                  }
                  editContainerAlignItems={editContainerAlignItems}
                  setEditContainerAlignItems={setEditContainerAlignItems}
                  editContainerMaxWidth={editContainerMaxWidth}
                  setEditContainerMaxWidth={setEditContainerMaxWidth}
                  editVideoControls={editVideoControls}
                  setEditVideoControls={setEditVideoControls}
                  editVideoAutoplay={editVideoAutoplay}
                  setEditVideoAutoplay={setEditVideoAutoplay}
                  editVideoMuted={editVideoMuted}
                  setEditVideoMuted={setEditVideoMuted}
                  editVideoLoop={editVideoLoop}
                  setEditVideoLoop={setEditVideoLoop}
                  editCodeLanguage={editCodeLanguage}
                  setEditCodeLanguage={setEditCodeLanguage}
                  onImmediateChange={onImmediateChange}
                />
              )}

              {/* STYLE */}
              {editTab === "style" && (
                <EditStyleTab
                  editStyle={editStyle}
                  setEditStyle={setEditStyle}
                  editContentStyle={editContentStyle}
                  setEditContentStyle={setEditContentStyle}
                  editLayout={editLayout}
                  isContainer={editType === "container"}
                  setEditLayout={setEditLayout}
                  onLayoutChange={(layout) => {
                    if (!selectedComponentId) {
                      return;
                    }

                    onLayoutChange(selectedComponentId, layout);
                  }}
                  onApply={onStyleApply}
                  positionParentOptions={positionParentOptions}
                  onPositionParentChange={onPositionParentChange}
                />
              )}

              {/* CUSTOM CSS */}
              {editTab === "css" && (
                <EditCssTab
                  value={editCustomCss}
                  onValueChange={setEditCustomCss}
                  onApply={saveEditedComponent}
                />
              )}
            </>
          )}
        </div>
        {/* 스타일 초기화 */}
        <div className="d-flex justify-content-end p-2">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={() => {
              setEditStyle({});
              setEditContentStyle({});

              onImmediateChange((component) => ({
                ...component,
                style: {},
                contentStyle: {},
              }));
            }}
          >
            스타일 초기화
          </button>
        </div>

        <ComponentLibraryPanel
          favorites={favoriteComponents}
          hasSelectedComponent={Boolean(selectedComponentId)}
          onAddSelected={addSelectedComponentToFavorites}
          onInsert={insertFavoriteComponent}
          onRemove={removeFavoriteComponent}
          templateFiles={templateFiles}
          setTemplateFiles={setTemplateFiles}
          selectedTemplateId={selectedTemplateId}
          setSelectedTemplateId={setSelectedTemplateId}
        />
      </aside>
    </>
  );
}

export default EditComponentPanel;
