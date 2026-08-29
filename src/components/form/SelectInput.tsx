import { useModalManager } from "../../context/usehooks";
// 경로는 프로젝트에 맞게 수정

export type Option = {
  label: string;
  value: string;
  disabled?: boolean;
};

const SelectInput = ({
  disabled,
  name,
  data,
  setData,
  options,
  placeholder,
}: {
  disabled?: boolean;
  name: string;
  data: string;
  setData: (v: string) => void;
  options: Option[];
  placeholder?: string;
}) => {
  const { openModal, closeModal, isOpen } = useModalManager();

  const isSelectOpen = isOpen(name);

  const openSelect = () => {
    if (disabled) return;
    openModal(name);
  };

  const closeSelect = () => {
    closeModal(name);
  };

  return (
    <div className="w-100 mb-3">
      <input
        disabled={disabled}
        name={name}
        value={data || placeholder || ""}
        readOnly
        onClick={(e) => {
          (e.target as HTMLInputElement).blur();
          openSelect();
        }}
        className={`form-control ${data === "" ? "text-secondary" : ""}`}
      />

      <div
        role="presentation"
        className="position-fixed start-0 w-100 h-100"
        onClick={closeSelect}
        aria-hidden={!isSelectOpen}
        style={{
          top: 0,
          bottom: 55,
          background: "rgba(0, 0, 0, 0.32)",
          opacity: isSelectOpen ? 1 : 0,
          pointerEvents: isSelectOpen ? "auto" : "none",
          transition: "opacity 160ms ease",
          zIndex: 100,
        }}
      />

      <aside
        aria-hidden={!isSelectOpen}
        className="w-100 start-0 position-fixed bg-white shadow d-flex flex-column"
        style={{
          bottom: 55,
          zIndex: 100,
          height: "70%",
          borderRadius: "20px 20px 0 0",
          transform: isSelectOpen ? "translateY(0)" : "translateY(100%)",
          transition: "transform 220ms ease",
        }}
      >
        <div className="w-100 d-flex align-items-center justify-content-between border-bottom px-3">
          <h2 className="m-0 fs-6 fw-bold">선택</h2>

          <button
            type="button"
            className="btn border-0 bg-transparent fs-3 text-secondary px-1 py-0"
            onClick={closeSelect}
            aria-label="닫기"
          >
            ×
          </button>
        </div>

        <div className="w-100 p-2 d-flex justify-content-center overflow-auto">
          <nav
            role="navigation"
            style={{
              flex: 1,
              minHeight: 0,
              marginBottom: 80,
              width: "100%",
              scrollbarWidth: "thin",
            }}
          >
            <div style={{ paddingBottom: 100 }}>
              {options.map((opt) => {
                const isSelected = opt.value === data;

                return (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={opt.disabled}
                    onClick={() => {
                      if (opt.disabled) return;

                      setData(opt.value);
                      closeSelect();
                    }}
                    className={`w-100 text-start px-3 py-3 border-0 bg-white ${
                      isSelected ? "fw-bold" : ""
                    } ${opt.disabled ? "text-secondary" : ""}`}
                    style={{
                      borderBottom: "1px solid #eee",
                      cursor: opt.disabled ? "not-allowed" : "pointer",
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </nav>
        </div>
      </aside>
    </div>
  );
};

export default SelectInput;
