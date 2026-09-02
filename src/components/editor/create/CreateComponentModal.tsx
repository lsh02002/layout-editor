import type { Dispatch, SetStateAction } from "react";

import type {
  ComponentType,
  ContainerDirection,
  LinkType,
  HeadingLevel,
} from "../../../types/types";

import ButtonFields from "./fields/ButtonFields";
import ContainerFields from "./fields/ContainerFields";
import HeadingFields from "./fields/HeadingFields";
import ImageFields from "./fields/ImageFields";
import LinkFields from "./fields/LinkFields";
import QuillFields from "./fields/QuillFields";
import TextareaFields from "./fields/TextareaFields";
import ComponentNameField from "./fields/ComponentNameField";

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

function CreateComponentModal({
  open,
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
  onClose,
  onCreate,
}: Props) {
  if (!open) {
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

              <button type="button" className="btn-close" onClick={onClose} />
            </div>

            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">타입</label>

                <select
                  className="form-select"
                  value={newType}
                  onChange={(event) =>
                    setNewType(event.target.value as ComponentType)
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
                  <option value="imageSlider">Image Slider</option>
                  <option value="video">Video</option>
                  <option value="link">Link</option>
                  <option value="divider">Divider</option>
                  <option value="spacer">Spacer</option>
                  <option value="codeEditor">Code Editor</option>
                </select>
              </div>

              {(newType === "button" || newType === "scrollToTopButton") && (
                <ButtonFields
                  componentName={newComponentName}
                  title={newTitle}
                  onComponentNameChange={setNewComponentName}
                  onTitleChange={setNewTitle}
                />
              )}

              {newType === "heading" && (
                <HeadingFields
                  text={newHeadingText}
                  level={newHeadingLevel}
                  onTextChange={setNewHeadingText}
                  onLevelChange={setNewHeadingLevel}
                />
              )}

              {newType === "textarea" && (
                <TextareaFields
                  componentName={newComponentName}
                  value={newValue}
                  placeholder={newPlaceholder}
                  onComponentNameChange={setNewComponentName}
                  onValueChange={setNewValue}
                  onPlaceholderChange={setNewPlaceholder}
                />
              )}

              {newType === "quill" && (
                <QuillFields
                  componentName={newComponentName}
                  value={newValue}
                  placeholder={newPlaceholder}
                  onComponentNameChange={setNewComponentName}
                  onValueChange={setNewValue}
                  onPlaceholderChange={setNewPlaceholder}
                />
              )}

              {newType === "image" && (
                <ImageFields
                  componentName={newComponentName}
                  previewUrl={newImagePreviewUrl}
                  onComponentNameChange={setNewComponentName}
                  onPreviewUrlChange={setNewImagePreviewUrl}
                />
              )}

              {newType === "video" && (
                <>
                  <ComponentNameField
                    value={newComponentName}
                    onChange={setNewComponentName}
                  />

                  <div className="mb-3">
                    <label className="form-label">동영상 URL</label>

                    <input
                      type="url"
                      className="form-control"
                      value={newValue}
                      placeholder="https://example.com/video.mp4"
                      onChange={(event) => setNewValue(event.target.value)}
                    />
                  </div>
                </>
              )}

              {newType === "link" && (
                <LinkFields
                  componentName={newComponentName}
                  title={newTitle}
                  linkType={newLinkType}
                  value={newValue}
                  newWindow={newLinkNewWindow}
                  onComponentNameChange={setNewComponentName}
                  onTitleChange={setNewTitle}
                  onLinkTypeChange={setNewLinkType}
                  onValueChange={setNewValue}
                  onNewWindowChange={setNewLinkNewWindow}
                />
              )}

              {(newType === "divider" || newType === "spacer") && (
                <ComponentNameField
                  value={newComponentName}
                  onChange={setNewComponentName}
                />
              )}

              {newType === "codeEditor" && (
                <>
                  <ComponentNameField
                    value={newComponentName}
                    onChange={setNewComponentName}
                  />

                  <div className="mb-3">
                    <label className="form-label">초기 코드</label>

                    <textarea
                      className="form-control font-monospace"
                      rows={8}
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                    />
                  </div>
                </>
              )}

              {newType === "container" && (
                <ContainerFields
                  componentName={newComponentName}
                  direction={newDirection}
                  onComponentNameChange={setNewComponentName}
                  onDirectionChange={setNewDirection}
                />
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
              >
                취소
              </button>

              <button
                type="button"
                className="btn btn-primary"
                onClick={onCreate}
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
        onClick={onClose}
      />
    </>
  );
}

export default CreateComponentModal;
