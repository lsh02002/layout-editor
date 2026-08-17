import { useState } from "react";
import ConfirmButton from "../form/ConfirmButton";
import DivBox from "./DivBox";

type ButtonAction = "alert" | "save" | "none";

const ButtonBox = () => {
  const [title, setTitle] = useState("버튼 예시");
  const [action, setAction] = useState<ButtonAction>("alert");

  const [isEditOpen, setIsEditOpen] = useState(false);

  const [tempTitle, setTempTitle] = useState(title);
  const [tempAction, setTempAction] = useState<ButtonAction>(action);

  const handleEdit = () => {
    setTempTitle(title);
    setTempAction(action);
    setIsEditOpen(true);
  };

  const handleApply = () => {
    setTitle(tempTitle);
    setAction(tempAction);
    setIsEditOpen(false);
  };

  const handleButtonClick = () => {
    switch (action) {
      case "alert":
        alert("버튼 클릭");
        break;

      case "save":
        alert("저장 실행");
        break;

      case "none":
        break;
    }
  };

  return (
    <>
      <DivBox
        onEdit={handleEdit}
        onCopy={() => alert("복사 클릭")}
        onDelete={() => alert("삭제 클릭")}
      >
        <ConfirmButton title={title} onClick={handleButtonClick} />
      </DivBox>

      {isEditOpen && (
        <>
          <div
            className="position-fixed top-0 start-0 w-100 h-100"
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.4)",
              zIndex: 9998,
            }}
            onClick={() => setIsEditOpen(false)}
          />

          <div
            className="position-fixed top-50 start-50 translate-middle bg-white rounded shadow p-4"
            style={{
              width: "min(90vw, 400px)",
              zIndex: 9999,
            }}
          >
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="m-0">버튼 편집</h5>

              <button
                type="button"
                className="btn-close"
                onClick={() => setIsEditOpen(false)}
              />
            </div>

            <div className="mb-3">
              <label className="form-label">버튼 제목</label>

              <input
                type="text"
                className="form-control"
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label className="form-label">클릭 동작</label>

              <select
                className="form-select"
                value={tempAction}
                onChange={(e) => setTempAction(e.target.value as ButtonAction)}
              >
                <option value="alert">알림 표시</option>

                <option value="save">저장</option>

                <option value="none">동작 없음</option>
              </select>
            </div>

            <div className="d-flex justify-content-end gap-2">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsEditOpen(false)}
              >
                취소
              </button>

              <button
                type="button"
                className="btn btn-primary"
                onClick={handleApply}
              >
                적용
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default ButtonBox;
