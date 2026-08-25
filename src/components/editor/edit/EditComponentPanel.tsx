import type { CSSProperties, Dispatch, SetStateAction } from "react";

import type {
  ComponentLayout,
  ComponentType,
  FavoriteComponent,
  LinkType,
  TemplateItem,
} from "../../../types/types";

import FavoritePanel from "../../favorites/FavoritePanel";
import type { EditTab } from "../hooks/useEditComponentForm";
import EditBasicTab from "./tabs/EditBasicTab";
import EditStyleTab from "./tabs/EditStyleTab";
import EditCssTab from "./tabs/EditCssTab";

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

type Props = {
  isMobile: boolean;
  showEditModal: boolean;
  setShowEditModal: Dispatch<SetStateAction<boolean>>;
  selectedComponentId: string | null;

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

  editTab: EditTab;
  setEditTab: Dispatch<SetStateAction<EditTab>>;

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

  resetEditPanelToSelected: () => void;
  saveEditedComponent: () => void;

  favoriteComponents: FavoriteComponent[];
  addSelectedComponentToFavorites: () => void;
  insertFavoriteComponent: (favorite: FavoriteComponent) => void;
  removeFavoriteComponent: (favoriteId: string) => void;

  editLayout: ComponentLayout;
  setEditLayout: Dispatch<SetStateAction<ComponentLayout>>;

  onLayoutChange: (id: string, layout: Partial<ComponentLayout>) => void;

  templateFiles: { name: string; data: TemplateItem }[];
  setTemplateFiles: (files: { name: string; data: TemplateItem }[]) => void;
  selectedTemplateId: string | null;
  setSelectedTemplateId: (id: string | null) => void;
};

function EditComponentPanel({
  isMobile,
  showEditModal,
  setShowEditModal,
  selectedComponentId,
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
  resetEditPanelToSelected,
  saveEditedComponent,
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
}: Props) {
  const tabMenus = [
    { key: "basic", label: "기본 설정" },
    { key: "style", label: "스타일" },
    { key: "css", label: "Custom CSS" },
  ];

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
                />
              )}

              {editTab === "style" && (
                <EditStyleTab
                  editStyle={editStyle}
                  setEditStyle={setEditStyle}
                  editContentStyle={editContentStyle}
                  setEditContentStyle={setEditContentStyle}
                  editLayout={editLayout}
                  setEditLayout={setEditLayout}
                  onLayoutChange={(layout) => {
                    if (!selectedComponentId) {
                      return;
                    }
                    onLayoutChange(selectedComponentId, layout);
                  }}
                />
              )}

              {editTab === "css" && (
                <EditCssTab value={editCustomCss} onChange={setEditCustomCss} />
              )}
            </>
          )}
        </div>

        {/* FOOTER */}
        {selectedComponentId && (
          <div className="editor-edit-panel-footer">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={() => {
                resetEditPanelToSelected();
              }}
            >
              초기화
            </button>

            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={saveEditedComponent}
            >
              저장
            </button>
          </div>
        )}
        <FavoritePanel
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
