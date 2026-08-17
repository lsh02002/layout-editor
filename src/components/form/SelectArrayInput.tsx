import { useMemo } from "react";
import { layout } from "../../theme/theme";
import { useModalManager } from "../../usehooks/usehooks";

type Option = { label: string; value: string; disabled?: boolean };

type SelectArrayProps = {
  disabled?: boolean;
  name: string;
  title: string;
  values: string[];
  setValues: (v: string[]) => void;
  options: Option[];
  placeholder?: string;
};

const SelectArrayInput = ({
  disabled,
  name,
  title,
  values,
  setValues,
  options,
  placeholder,
}: SelectArrayProps) => {
  const { openModal, closeModal, isOpen } = useModalManager();

  const isSelArrayOpen = isOpen(name);

  const mapByValue = useMemo(
    () => new Map(options.map((o) => [o.value, o])),
    [options],
  );

  const selectedLabels = values
    .map((v) => mapByValue.get(v)?.label || v)
    .filter(Boolean);

  const toggleValue = (v: string) => {
    const opt = mapByValue.get(v);
    if (opt?.disabled) return;

    setValues(
      values.includes(v) ? values.filter((x) => x !== v) : [...values, v],
    );
  };

  const displayValue =
    selectedLabels.length > 0
      ? selectedLabels.join(", ")
      : placeholder || `${title}을(를) 선택하세요`;

  return (
    <div className="w-100 mb-3">
      <label htmlFor={name} className="form-label fw-semibold">
        {title}
      </label>

      <button
        id={name}
        name={name}
        type="button"
        disabled={disabled}
        onClick={(e) => {
          (e.target as HTMLInputElement).blur();
          openModal(name);
        }}
        className={`form-control text-start d-flex align-items-center justify-content-between ${
          values.length === 0 ? "text-secondary" : ""
        }`}
      >
        <span>{displayValue}</span>
        <span aria-hidden>▾</span>
      </button>

      <div
        role="presentation"
        className="position-fixed start-0 w-100 h-100"
        onClick={() => closeModal(name)}
        aria-hidden={!isSelArrayOpen}
        style={{
          top: 0,
          bottom: 55,
          background: "rgba(0, 0, 0, 0.32)",
          opacity: isSelArrayOpen ? 1 : 0,
          pointerEvents: isSelArrayOpen ? "auto" : "none",
          transition: "opacity 160ms ease",
          zIndex: 100,
        }}
      />

      <aside
        aria-hidden={!isSelArrayOpen}
        className="w-100 start-0 position-fixed bg-white shadow d-flex flex-column"
        style={{
          bottom: 55,
          zIndex: 100,
          height: "70%",
          borderRadius: "20px 20px 0 0",
          transform: isSelArrayOpen ? "translateY(0)" : "translateY(100%)",
          transition: "transform 220ms ease",
        }}
      >
        <div className="w-100 d-flex align-items-center justify-content-between border-bottom px-3 py-2">
          <h2 className="m-0 fs-6 fw-bold">{title}</h2>
          <button
            type="button"
            className="btn border-0 bg-transparent fs-3 text-secondary px-1 py-0"
            onClick={() => closeModal(name)}
            aria-label="닫기"
          >
            ×
          </button>
        </div>

        <div
          className="w-100 p-2 d-flex justify-content-center overflow-auto"
          style={{ height: "100%" }}
        >
          <nav
            role="listbox"
            aria-multiselectable="true"
            style={{
              flex: 1,
              minHeight: 0,
              marginBottom: 80,
              width: "100%",
              scrollbarWidth: "thin",
              maxWidth: layout.maxWidth,
            }}
          >
            <div style={{ paddingBottom: 100 }}>
              {options.length === 0 && (
                <div className="px-3 py-3 text-secondary">
                  해당 {title}이 없습니다.
                </div>
              )}

              {options.map((opt) => {
                const checked = values.includes(opt.value);

                return (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={opt.disabled}
                    role="option"
                    aria-selected={checked}
                    onClick={() => toggleValue(opt.value)}
                    className={`w-100 d-flex align-items-center gap-2 text-start px-3 py-3 border-0 bg-white ${
                      checked ? "fw-bold" : ""
                    } ${opt.disabled ? "text-secondary" : ""}`}
                    style={{
                      borderBottom: "1px solid #eee",
                      cursor: opt.disabled ? "not-allowed" : "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      readOnly
                      disabled={opt.disabled}
                      className="form-check-input mt-0"
                    />
                    <span>{opt.label}</span>
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

export default SelectArrayInput;
