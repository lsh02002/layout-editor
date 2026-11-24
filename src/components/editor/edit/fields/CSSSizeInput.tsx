import { useState } from "react";
import {
  CSS_LENGTH_UNITS,
  type CSSLengthUnit,
  type CSSSizeMode,
} from "../../../../types/types";
import { isCSSLengthUnit, isCSSSizeMode } from "../../utils/cssSizeUtils";
import ApplyButton from "./ApplyButton";

export type CSSSizeValue = {
  mode: CSSSizeMode;
  value?: number;
  unit?: CSSLengthUnit;
};

type CSSSizeDraft = {
  mode: CSSSizeMode;
  value: string;
  unit: CSSLengthUnit;
};

type Props = {
  label: string;
  mode: CSSSizeMode;
  value?: number;
  unit?: CSSLengthUnit;
  defaultValue?: number;
  savedValue: CSSSizeValue;
  onChange: (size: CSSSizeValue) => void;
};

function CSSSizeInput({
  label,
  mode,
  value,
  unit = "px",
  defaultValue = 300,
  savedValue,
  onChange,
}: Props) {
  const [draft, setDraft] = useState<CSSSizeDraft | null>(null);

  const resolveValue = (input?: number): number => {
    return typeof input === "number" && Number.isFinite(input) && input >= 0
      ? input
      : defaultValue;
  };

  const resolvedValue = resolveValue(value);

  const current: CSSSizeDraft = draft ?? {
    mode,
    value: String(resolvedValue),
    unit,
  };

  const displayValue =
    current.mode === "fixed" ? current.value : (draft?.value ?? current.mode);

  // 현재 입력값을 실제 CSSSizeValue로 변환
  const parseValue = (
    input: string,
    currentUnit: CSSLengthUnit,
  ): CSSSizeValue | null => {
    const text = input.trim().toLowerCase();

    // auto, fill, min-content 등
    if (isCSSSizeMode(text) && text !== "fixed") {
      return {
        mode: text,
        value: resolvedValue,
        unit: currentUnit,
      };
    }

    // 300, 300px, 50%, 20rem 등
    const match = text.match(/^(\d*\.?\d+)\s*([a-z%]*)$/);

    if (!match) {
      return null;
    }

    const nextValue = Number(match[1]);
    const rawUnit = match[2];

    const nextUnit = rawUnit === "q" ? "Q" : rawUnit || currentUnit;

    if (
      !Number.isFinite(nextValue) ||
      nextValue < 0 ||
      !isCSSLengthUnit(nextUnit)
    ) {
      return null;
    }

    return {
      mode: "fixed",
      value: nextValue,
      unit: nextUnit,
    };
  };

  const parsedValue = parseValue(displayValue, current.unit);

  const isDirty =
    parsedValue?.mode !== savedValue.mode ||
    (parsedValue.mode === "fixed" &&
      (parsedValue.value !== resolveValue(savedValue.value) ||
        parsedValue.unit !== (savedValue.unit ?? "px")));

  const handleApply = () => {
    if (!parsedValue || !isDirty) {
      return;
    }

    onChange(parsedValue);
    setDraft(null);
  };

  const handleCancel = () => {
    setDraft(null);
  };

  return (
    <div>
      <label className="form-label">{label}</label>

      <div className="input-group input-group-sm position-relative">
        {/* Size Mode */}
        <select
          className="form-select"
          style={{
            flex: "0 0 100px",
            width: 100,
            minWidth: 0,
          }}
          value={current.mode}
          onChange={(event) => {
            const nextMode = event.target.value;

            if (!isCSSSizeMode(nextMode)) {
              return;
            }

            setDraft({
              ...current,
              mode: nextMode,
              value:
                nextMode === "fixed"
                  ? String(
                      parsedValue?.mode === "fixed"
                        ? parsedValue.value
                        : resolvedValue,
                    )
                  : nextMode,
            });
          }}
        >
          <option value="auto">Auto</option>
          <option value="fill">Fill</option>
          <option value="fixed">Fixed</option>
          <option value="min-content">Min Content</option>
          <option value="max-content">Max Content</option>
          <option value="fit-content">Fit Content</option>
        </select>

        {/* 직접 입력 */}
        <input
          type="text"
          className={`form-control ${parsedValue === null ? "is-invalid" : ""}`}
          style={{
            flex: "1 1 0",
            width: 0,
            minWidth: 0,
            textAlign: "right",
          }}
          value={displayValue}
          placeholder="Auto / 100px"
          onFocus={(event) => {
            event.currentTarget.select();
          }}
          onChange={(event) => {
            setDraft({
              ...current,
              value: event.target.value,
            });
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              handleApply();
            }

            if (event.key === "Escape") {
              event.preventDefault();
              handleCancel();
            }
          }}
        />

        {/* CSS Unit */}
        {current.mode === "fixed" && (
          <select
            className="form-select"
            style={{
              flex: "0 0 70px",
              width: 70,
              minWidth: 0,
            }}
            value={current.unit}
            onChange={(event) => {
              const nextUnit = event.target.value;

              if (!isCSSLengthUnit(nextUnit)) {
                return;
              }

              setDraft({
                ...current,
                value:
                  parsedValue?.mode === "fixed"
                    ? String(parsedValue.value)
                    : current.value,
                unit: nextUnit,
              });
            }}
          >
            {CSS_LENGTH_UNITS.map((lengthUnit) => (
              <option key={lengthUnit} value={lengthUnit}>
                {lengthUnit}
              </option>
            ))}
          </select>
        )}

        {/* Apply */}
        <ApplyButton
          onClick={handleApply}
          disabled={!isDirty || parsedValue === null}
        />

        {/* Dirty Indicator */}
        {isDirty && (
          <span
            style={{
              position: "absolute",
              top: -4,
              right: -4,
              width: 9,
              height: 9,
              backgroundColor: "var(--bs-primary)",
              borderRadius: "50%",
              border: "2px solid white",
              pointerEvents: "none",
            }}
            title="저장되지 않은 변경사항"
            aria-label="저장되지 않은 변경사항"
          />
        )}
      </div>
    </div>
  );
}

export default CSSSizeInput;
