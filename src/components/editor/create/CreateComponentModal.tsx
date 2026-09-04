import type { Dispatch, SetStateAction } from "react";

import type {
  ComponentType,
  ContainerDirection,
  HeadingLevel,
  LinkType,
} from "../../../types/types";

import {
  componentRegistryEntries,
  renderComponentCreateForm,
} from "../registry/componentRegistry";

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

  const createForm = renderComponentCreateForm(newType, {
    values: {
      componentName: newComponentName,
      title: newTitle,
      value: newValue,
      placeholder: newPlaceholder,
      direction: newDirection,
      imagePreviewUrl: newImagePreviewUrl,
      linkType: newLinkType,
      linkNewWindow: newLinkNewWindow,
      headingText: newHeadingText,
      headingLevel: newHeadingLevel,
    },

    setComponentName: setNewComponentName,
    setTitle: setNewTitle,
    setValue: setNewValue,
    setPlaceholder: setNewPlaceholder,
    setDirection: setNewDirection,
    setImagePreviewUrl: setNewImagePreviewUrl,
    setLinkType: setNewLinkType,
    setLinkNewWindow: setNewLinkNewWindow,
    setHeadingText: setNewHeadingText,
    setHeadingLevel: setNewHeadingLevel,
  });

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
                  onChange={(event) => {
                    setNewType(event.target.value as ComponentType);
                  }}
                >
                  {componentRegistryEntries.map(([type, definition]) => (
                    <option key={type} value={type}>
                      {definition.label}
                    </option>
                  ))}
                </select>
              </div>

              {createForm}
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
