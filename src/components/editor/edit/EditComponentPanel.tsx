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
  TemplateItem,
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

  draftComponent?: LayoutComponent | null;
  updateDraftComponent?: (
    updater: (component: LayoutComponent) => LayoutComponent,
  ) => void;

  selectedComponentIds: string[];

  /*
   * Undo / Redo가 실행될 때만 변경되는 값
   */
  editorSyncKey: number;

  editType: ComponentType;
  editComponentName: string;

  editStyle: CSSProperties;
  setEditStyle: Dispatch<SetStateAction<CSSProperties>>;

  editContentStyle: CSSProperties;
  setEditContentStyle: Dispatch<SetStateAction<CSSProperties>>;

  editCustomCss: string;
  setEditCustomCss: Dispatch<SetStateAction<string>>;

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
};

function EditComponentPanel({
  isMobile,
  showEditModal,
  setShowEditModal,

  draftComponent,
  updateDraftComponent,

  selectedComponentIds,
  editorSyncKey,

  editType,
  editComponentName,

  editStyle,
  setEditStyle,
  editContentStyle,
  setEditContentStyle,

  editCustomCss,
  setEditCustomCss,

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
}: Props) {
  const { editTab, setEditTab } = useLogin();
  const isMultiSelected = selectedComponentIds?.length > 1;
  const primarySelectedId = selectedComponentIds.at(-1) ?? null;

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
    if (!primarySelectedId || isMultiSelected) {
      return;
    }

    resetEditPanelToSelected();
  }, [
    editorSyncKey,
    resetEditPanelToSelected,
    primarySelectedId,
    isMultiSelected,
  ]);

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
          <h5 className="modal-title">
            {isMultiSelected ? "멀티 셀렉션" : "컴포넌트 수정"}
          </h5>

          <div
            className="text-secondary"
            style={{
              fontSize: 12,
              marginTop: 2,
            }}
          >
            {isMultiSelected
              ? `${selectedComponentIds?.length}개 컴포넌트 선택됨`
              : primarySelectedId
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
        {!isMultiSelected && (
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
        )}

        {/* BODY */}
        <div className="editor-edit-panel-body">
          {isMultiSelected ? (
            <div
              style={{
                padding: 16,
              }}
            >
              <div
                style={{
                  padding: 16,
                  border: "1px solid #dee2e6",
                  borderRadius: 8,
                  backgroundColor: "#f8f9fa",
                }}
              >
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                  }}
                >
                  {selectedComponentIds?.length}개 컴포넌트 선택됨
                </div>

                <div
                  className="text-secondary"
                  style={{
                    marginTop: 6,
                    fontSize: 12,
                    lineHeight: 1.5,
                  }}
                >
                  여러 컴포넌트가 선택되어 있습니다.
                </div>
              </div>
            </div>
          ) : !primarySelectedId ? (
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
              {editTab === "basic" &&
                (draftComponent && updateDraftComponent ? (
                  <EditBasicTab
                    component={draftComponent}
                    updateComponent={updateDraftComponent}
                  />
                ) : (
                  <div
                    className="text-secondary text-center"
                    style={{
                      padding: "40px 20px",
                      fontSize: 13,
                    }}
                  >
                    편집 데이터를 불러오는 중입니다.
                  </div>
                ))}

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
                    if (!primarySelectedId) {
                      return;
                    }

                    onLayoutChange(primarySelectedId, layout);
                  }}
                  onApply={onStyleApply}
                  positionParentOptions={positionParentOptions}
                  onPositionParentChange={onPositionParentChange}
                />
              )}

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

        {!isMultiSelected && primarySelectedId && (
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
        )}

        <ComponentLibraryPanel
          favorites={favoriteComponents}
          hasSelectedComponent={selectedComponentIds.length === 1}
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
