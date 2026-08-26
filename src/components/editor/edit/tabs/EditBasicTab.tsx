import type { CSSProperties, Dispatch, SetStateAction } from "react";

import type {
  ComponentType,
  LayoutComponent,
  LinkType,
} from "../../../../types/types";

import EditButtonFields from "../fields/EditButtonFields";
import EditContainerFields from "../fields/EditContainerFields";
import EditHeadingFields from "../fields/EditHeadingFields";
import EditImageFields from "../fields/EditImageFields";
import EditLinkFields from "../fields/EditLinkFields";
import EditQuillFields from "../fields/EditQuillFields";
import EditTextareaFields from "../fields/EditTextareaFields";

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

type Props = {
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

  editContentStyle: CSSProperties;

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

  onImmediateChange: (
    updater: (component: LayoutComponent) => LayoutComponent,
  ) => void;

  // 텍스트 입력값 저장
  onSave: () => void;
};

function ApplyButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="d-flex justify-content-end">
      <button
        type="button"
        className="btn btn-outline-primary"
        onClick={onClick}
        title="적용"
        aria-label="적용"
        style={{
          width: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <i className="bi bi-check-lg" />
      </button>
    </div>
  );
}

function EditBasicTab({
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

  editContentStyle,

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

  onImmediateChange,
  onSave,
}: Props) {
  return (
    <>
      {/* 타입 */}
      <div className="mb-3">
        <label className="form-label">타입</label>

        <input type="text" className="form-control" value={editType} disabled />
      </div>

      {/* 버튼 */}
      {(editType === "button" || editType === "scrollToTopButton") && (
        <div className="mb-3">
          <EditButtonFields
            componentName={editComponentName}
            title={editTitle}
            placeholder={editType === "scrollToTopButton" ? "↑" : "버튼"}
            onComponentNameChange={setEditComponentName}
            onTitleChange={setEditTitle}
          />
        </div>
      )}

      {/* Heading */}
      {editType === "heading" && (
        <div className="mb-3">
          <EditHeadingFields
            value={editValue}
            level={editHeadingLevel}
            onValueChange={setEditValue}
            onLevelChange={(level) => {
              // 오른쪽 편집 state
              setEditHeadingLevel(level);

              // H1 ~ H6는 즉시 적용
              onImmediateChange((component) => {
                if (component.type !== "heading") {
                  return component;
                }

                return {
                  ...component,
                  props: {
                    ...component.props,
                    level,
                  },
                };
              });
            }}
          />
        </div>
      )}

      {/* Textarea */}
      {editType === "textarea" && (
        <div className="mb-3">
          <EditTextareaFields
            componentName={editComponentName}
            value={editValue}
            placeholder={editPlaceholder}
            contentStyle={editContentStyle}
            onComponentNameChange={setEditComponentName}
            onValueChange={setEditValue}
            onPlaceholderChange={setEditPlaceholder}
          />
        </div>
      )}

      {/* Quill */}
      {editType === "quill" && (
        <div className="mb-3">
          <EditQuillFields
            componentName={editComponentName}
            value={editValue}
            placeholder={editPlaceholder}
            onComponentNameChange={setEditComponentName}
            onValueChange={setEditValue}
            onPlaceholderChange={setEditPlaceholder}
          />
        </div>
      )}

      {/* Image */}
      {editType === "image" && (
        <div className="mb-3">
          <EditImageFields
            componentName={editComponentName}
            imageUrl={editImageUrl}
            previewUrl={editImagePreviewUrl}
            onComponentNameChange={setEditComponentName}
            onImageUrlChange={setEditImageUrl}
            onPreviewUrlChange={setEditImagePreviewUrl}
          />
        </div>
      )}

      {/* Link */}
      {editType === "link" && (
        <div className="mb-3">
          <EditLinkFields
            componentName={editComponentName}
            title={editTitle}
            linkType={editLinkType}
            value={editValue}
            newWindow={editLinkNewWindow}
            onComponentNameChange={setEditComponentName}
            onTitleChange={setEditTitle}
            onValueChange={setEditValue}
            onLinkTypeChange={(linkType) => {
              setEditLinkType(linkType);

              // link type은 즉시 적용
              onImmediateChange((component) => {
                if (component.type !== "link") {
                  return component;
                }

                return {
                  ...component,
                  props: {
                    ...component.props,
                    linkType,
                    newWindow:
                      linkType === "url" ? component.props.newWindow : false,
                  },
                };
              });

              if (linkType !== "url") {
                setEditLinkNewWindow(false);
              }
            }}
            onNewWindowChange={(newWindow) => {
              setEditLinkNewWindow(newWindow);

              // 새창 여부 즉시 적용
              onImmediateChange((component) => {
                if (component.type !== "link") {
                  return component;
                }

                return {
                  ...component,
                  props: {
                    ...component.props,
                    newWindow,
                  },
                };
              });
            }}
          />
        </div>
      )}

      {/* Container */}
      {editType === "container" && (
        <div className="mb-3">
          <EditContainerFields
            componentName={editComponentName}
            direction={editDirection}
            onComponentNameChange={setEditComponentName}
            onDirectionChange={(direction) => {
              setEditDirection(direction);

              // row / column 즉시 적용
              onImmediateChange((component) => {
                if (component.type !== "container") {
                  return component;
                }

                return {
                  ...component,
                  props: {
                    ...component.props,
                    direction,
                  },
                };
              });
            }}
          />
        </div>
      )}

      {/* Disabled */}
      {editType !== "container" && (
        <div className="form-check mb-3">
          <input
            type="checkbox"
            className="form-check-input"
            id="editDisabled"
            checked={editDisabled}
            onChange={(event) => {
              const checked = event.target.checked;

              setEditDisabled(checked);

              // 즉시 적용
              onImmediateChange(
                (component) =>
                  ({
                    ...component,
                    props: {
                      ...component.props,
                      disabled: checked,
                    },
                  }) as LayoutComponent,
              );
            }}
          />

          <label className="form-check-label" htmlFor="editDisabled">
            Disabled
          </label>
          <ApplyButton onClick={onSave} />
        </div>
      )}
    </>
  );
}

export default EditBasicTab;
