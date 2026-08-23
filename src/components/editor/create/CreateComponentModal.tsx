import type { Dispatch, SetStateAction } from "react";

import type {
  ComponentType,
  ContainerDirection,
  LinkType,
} from "../../../types/types";

import ButtonFields from "./fields/ButtonFields";
import ContainerFields from "./fields/ContainerFields";
import HeadingFields from "./fields/HeadingFields";
import ImageFields from "./fields/ImageFields";
import LinkFields from "./fields/LinkFields";
import QuillFields from "./fields/QuillFields";
import TextareaFields from "./fields/TextareaFields";

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

type Props = {
  open: boolean;
  newType: ComponentType;
  setNewType: Dispatch<SetStateAction<ComponentType>>;
  newTitle: string;
  setNewTitle: Dispatch<SetStateAction<string>>;
  newValue: string;
  setNewValue: Dispatch<SetStateAction<string>>;
  newPlaceholder: string;
  setNewPlaceholder: Dispatch<SetStateAction<string>>;
  newDirection: ContainerDirection;
  setNewDirection: Dispatch<SetStateAction<ContainerDirection>>;
  newImagePreviewUrl: string;
  setNewImagePreviewUrl: Dispatch<SetStateAction<string>>;
  newLinkType: LinkType;
  setNewLinkType: Dispatch<SetStateAction<LinkType>>;
  newLinkNewWindow: boolean;
  setNewLinkNewWindow: Dispatch<SetStateAction<boolean>>;
  newComponentName: string;
  setNewComponentName: Dispatch<SetStateAction<string>>;
  newHeadingText: string;
  setNewHeadingText: Dispatch<SetStateAction<string>>;
  newHeadingLevel: HeadingLevel;
  setNewHeadingLevel: Dispatch<SetStateAction<HeadingLevel>>;
  onClose: () => void;
  onCreate: () => void;
};

function CreateComponentModal(props: Props) {
  if (!props.open) {
    return null;
  }

  return (
    <>
      <div
        className="modal fade show"
        style={{
          display: "block",
          zIndex: 1055,
        }}
        tabIndex={-1}
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">컴포넌트 추가</h5>

              <button
                type="button"
                className="btn-close"
                onClick={props.onClose}
              />
            </div>

            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">타입</label>

                <select
                  className="form-select"
                  value={props.newType}
                  onChange={(event) =>
                    props.setNewType(event.target.value as ComponentType)
                  }
                >
                  <option value="container">Container</option>
                  <option value="heading">Heading</option>
                  <option value="textarea">TextArea</option>
                  <option value="quill">Quill Editor</option>
                  <option value="button">Button</option>
                  <option value="scrollToTopButton">
                    Scroll To Top Button
                  </option>
                  <option value="image">Image</option>
                  <option value="link">Link</option>
                </select>
              </div>

              {(props.newType === "button" ||
                props.newType === "scrollToTopButton") && (
                <ButtonFields
                  componentName={props.newComponentName}
                  title={props.newTitle}
                  onComponentNameChange={props.setNewComponentName}
                  onTitleChange={props.setNewTitle}
                />
              )}

              {props.newType === "heading" && (
                <HeadingFields
                  text={props.newHeadingText}
                  level={props.newHeadingLevel}
                  onTextChange={props.setNewHeadingText}
                  onLevelChange={props.setNewHeadingLevel}
                />
              )}

              {props.newType === "textarea" && (
                <TextareaFields
                  componentName={props.newComponentName}
                  value={props.newValue}
                  placeholder={props.newPlaceholder}
                  onComponentNameChange={props.setNewComponentName}
                  onValueChange={props.setNewValue}
                  onPlaceholderChange={props.setNewPlaceholder}
                />
              )}

              {props.newType === "quill" && (
                <QuillFields
                  componentName={props.newComponentName}
                  value={props.newValue}
                  placeholder={props.newPlaceholder}
                  onComponentNameChange={props.setNewComponentName}
                  onValueChange={props.setNewValue}
                  onPlaceholderChange={props.setNewPlaceholder}
                />
              )}

              {props.newType === "image" && (
                <ImageFields
                  componentName={props.newComponentName}
                  previewUrl={props.newImagePreviewUrl}
                  onComponentNameChange={props.setNewComponentName}
                  onPreviewUrlChange={props.setNewImagePreviewUrl}
                />
              )}

              {props.newType === "link" && (
                <LinkFields
                  componentName={props.newComponentName}
                  title={props.newTitle}
                  linkType={props.newLinkType}
                  value={props.newValue}
                  newWindow={props.newLinkNewWindow}
                  onComponentNameChange={props.setNewComponentName}
                  onTitleChange={props.setNewTitle}
                  onLinkTypeChange={props.setNewLinkType}
                  onValueChange={props.setNewValue}
                  onNewWindowChange={props.setNewLinkNewWindow}
                />
              )}

              {props.newType === "container" && (
                <ContainerFields
                  componentName={props.newComponentName}
                  direction={props.newDirection}
                  onComponentNameChange={props.setNewComponentName}
                  onDirectionChange={props.setNewDirection}
                />
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={props.onClose}
              >
                취소
              </button>

              <button
                type="button"
                className="btn btn-primary"
                onClick={props.onCreate}
              >
                새로 만들기
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        className="modal-backdrop fade show"
        style={{
          zIndex: 1050,
        }}
        onClick={props.onClose}
      />
    </>
  );
}

export default CreateComponentModal;
