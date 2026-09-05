import type { Dispatch, SetStateAction } from "react";
import {
  type ComponentRegistry,
  type RegistryComponentType,
} from "../registry/componentRegistry";
import { useEditorConfig } from "../../../context/usehooks";
import RegistryFieldsCreateForm from "./fields/RegistryFieldsCreateForm";

type Props = {
  open: boolean;
  newType: RegistryComponentType;
  setNewType: (type: RegistryComponentType) => void;
  newComponentName: string;
  setNewComponentName: Dispatch<SetStateAction<string>>;
  newProps: Record<string, unknown>;
  setNewProps: Dispatch<SetStateAction<Record<string, unknown>>>;
  onClose: () => void;
  onCreate: () => void;
};

function CreateComponentModal({
  open,
  newType,
  setNewType,
  newComponentName,
  setNewComponentName,
  newProps,
  setNewProps,
  onClose,
  onCreate,
}: Props) {
  const { components: componentRegistry } = useEditorConfig();

  const componentEntries = Object.entries(componentRegistry) as [
    RegistryComponentType,
    ComponentRegistry[RegistryComponentType],
  ][];

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
                  onChange={(event) => {
                    const type = event.target.value as RegistryComponentType;
                    setNewType(type);
                  }}
                >
                  {componentEntries.map(([type, definition]) => (
                    <option key={type} value={type}>
                      {definition.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label">컴포넌트명</label>
                <input
                  type="text"
                  className="form-control"
                  value={newComponentName}
                  onChange={(event) => setNewComponentName(event.target.value)}
                />
              </div>
              <RegistryFieldsCreateForm
                componentRegistry={componentRegistry}
                type={newType}
                value={newProps}
                onChange={setNewProps}
              />
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
