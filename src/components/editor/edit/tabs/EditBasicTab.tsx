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

function EditBasicTab(props: Props) {
  return (
    <>
      <div className="mb-3">
        <label className="form-label">타입</label>
        <input
          type="text"
          className="form-control"
          value={props.editType}
          disabled
        />
      </div>

      {(props.editType === "button" ||
        props.editType === "scrollToTopButton") && (
        <EditButtonFields
          componentName={props.editComponentName}
          title={props.editTitle}
          placeholder={props.editType === "scrollToTopButton" ? "↑" : "버튼"}
          onComponentNameChange={props.setEditComponentName}
          onTitleChange={props.setEditTitle}
        />
      )}

      {props.editType === "heading" && (
        <EditHeadingFields
          value={props.editValue}
          level={props.editHeadingLevel}
          onValueChange={props.setEditValue}
          onLevelChange={props.setEditHeadingLevel}
        />
      )}

      {props.editType === "textarea" && (
        <EditTextareaFields
          componentName={props.editComponentName}
          value={props.editValue}
          placeholder={props.editPlaceholder}
          contentStyle={props.editContentStyle}
          onComponentNameChange={props.setEditComponentName}
          onValueChange={props.setEditValue}
          onPlaceholderChange={props.setEditPlaceholder}
        />
      )}

      {props.editType === "quill" && (
        <EditQuillFields
          componentName={props.editComponentName}
          value={props.editValue}
          placeholder={props.editPlaceholder}
          onComponentNameChange={props.setEditComponentName}
          onValueChange={props.setEditValue}
          onPlaceholderChange={props.setEditPlaceholder}
        />
      )}

      {props.editType === "image" && (
        <EditImageFields
          componentName={props.editComponentName}
          imageUrl={props.editImageUrl}
          previewUrl={props.editImagePreviewUrl}
          onComponentNameChange={props.setEditComponentName}
          onImageUrlChange={props.setEditImageUrl}
          onPreviewUrlChange={props.setEditImagePreviewUrl}
        />
      )}

      {props.editType === "link" && (
        <EditLinkFields
          componentName={props.editComponentName}
          title={props.editTitle}
          linkType={props.editLinkType}
          value={props.editValue}
          newWindow={props.editLinkNewWindow}
          onComponentNameChange={props.setEditComponentName}
          onTitleChange={props.setEditTitle}
          onLinkTypeChange={props.setEditLinkType}
          onValueChange={props.setEditValue}
          onNewWindowChange={props.setEditLinkNewWindow}
        />
      )}

      {props.editType === "container" && (
        <EditContainerFields
          componentName={props.editComponentName}
          direction={props.editDirection}
          onComponentNameChange={props.setEditComponentName}
          onDirectionChange={props.setEditDirection}
        />
      )}

      {props.editType !== "container" && (
        <div className="form-check mb-3">
          <input
            type="checkbox"
            className="form-check-input"
            id="editDisabled"
            checked={props.editDisabled}
            onChange={(event) => props.setEditDisabled(event.target.checked)}
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
