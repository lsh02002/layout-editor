import type { CSSProperties, Dispatch, SetStateAction } from "react";

import type { ComponentType, LinkType } from "../../../../types/types";

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
};

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
}: Props) {
  return (
    <>
      <div className="mb-3">
        <label className="form-label">타입</label>
        <input type="text" className="form-control" value={editType} disabled />
      </div>

      {(editType === "button" || editType === "scrollToTopButton") && (
        <EditButtonFields
          componentName={editComponentName}
          title={editTitle}
          placeholder={editType === "scrollToTopButton" ? "↑" : "버튼"}
          onComponentNameChange={setEditComponentName}
          onTitleChange={setEditTitle}
        />
      )}

      {editType === "heading" && (
        <EditHeadingFields
          value={editValue}
          level={editHeadingLevel}
          onValueChange={setEditValue}
          onLevelChange={setEditHeadingLevel}
        />
      )}

      {editType === "textarea" && (
        <EditTextareaFields
          componentName={editComponentName}
          value={editValue}
          placeholder={editPlaceholder}
          contentStyle={editContentStyle}
          onComponentNameChange={setEditComponentName}
          onValueChange={setEditValue}
          onPlaceholderChange={setEditPlaceholder}
        />
      )}

      {editType === "quill" && (
        <EditQuillFields
          componentName={editComponentName}
          value={editValue}
          placeholder={editPlaceholder}
          onComponentNameChange={setEditComponentName}
          onValueChange={setEditValue}
          onPlaceholderChange={setEditPlaceholder}
        />
      )}

      {editType === "image" && (
        <EditImageFields
          componentName={editComponentName}
          imageUrl={editImageUrl}
          previewUrl={editImagePreviewUrl}
          onComponentNameChange={setEditComponentName}
          onImageUrlChange={setEditImageUrl}
          onPreviewUrlChange={setEditImagePreviewUrl}
        />
      )}

      {editType === "link" && (
        <EditLinkFields
          componentName={editComponentName}
          title={editTitle}
          linkType={editLinkType}
          value={editValue}
          newWindow={editLinkNewWindow}
          onComponentNameChange={setEditComponentName}
          onTitleChange={setEditTitle}
          onLinkTypeChange={setEditLinkType}
          onValueChange={setEditValue}
          onNewWindowChange={setEditLinkNewWindow}
        />
      )}

      {editType === "container" && (
        <EditContainerFields
          componentName={editComponentName}
          direction={editDirection}
          onComponentNameChange={setEditComponentName}
          onDirectionChange={setEditDirection}
        />
      )}

      {editType !== "container" && (
        <div className="form-check mb-3">
          <input
            type="checkbox"
            className="form-check-input"
            id="editDisabled"
            checked={editDisabled}
            onChange={(event) => setEditDisabled(event.target.checked)}
          />
          <label className="form-check-label" htmlFor="editDisabled">
            Disabled
          </label>
        </div>
      )}
    </>
  );
}

export default EditBasicTab;
