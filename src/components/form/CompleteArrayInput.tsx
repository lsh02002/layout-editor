import React, { useCallback, useEffect, useRef, useState } from "react";
import { layout } from "../../theme/theme";
import { useModalManager } from "../../usehooks/usehooks";
type Option = { id: string; name: string };

export type CompleteArrayInputPropsType = {
  name?: string;
  title?: string;
  values: string[];
  setValues: React.Dispatch<React.SetStateAction<string[]>>;
  fetchOptions: (query: string) => Promise<Option[]>;
  createOption?: (name: string) => Promise<Option>;
  deleteOption?: (id: string) => Promise<void>;
  hydrateSelected?: (ids: string[]) => Promise<Option[]>;
  placeholder?: string;
  debounceMs?: number;
  onError?: (err: unknown) => void;
};

export const CompleteArrayInput: React.FC<CompleteArrayInputPropsType> = ({
  name,
  title,
  values,
  setValues,
  fetchOptions,
  createOption,
  deleteOption,
  hydrateSelected,
  placeholder = "추가...",
  debounceMs = 250,
  onError,
}) => {
  const { openModal, closeModal, isOpen } = useModalManager();

  const modalKey = name || "complete-array";
  const isComArrayOpen = isOpen(modalKey);

  const [input, setInput] = useState("");
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMap, setSelectedMap] = useState<Map<string, Option>>(
    () => new Map(),
  );

  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isComArrayOpen) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = window.setTimeout(async () => {
      setLoading(true);

      try {
        const list = await fetchOptions(input.trim());
        setOptions(list);
      } catch (err) {
        onError?.(err);
      } finally {
        setLoading(false);
      }
    }, debounceMs);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [isComArrayOpen, input, fetchOptions, debounceMs, onError]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        if (!hydrateSelected || values.length === 0) return;

        const hydrated = await hydrateSelected(values);
        if (cancelled) return;

        const m = new Map<string, Option>();
        hydrated.forEach((o) => m.set(o.id, o));
        setSelectedMap(m);
      } catch (err) {
        onError?.(err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [values, hydrateSelected, onError]);

  const addId = useCallback(
    (option: Option) => {
      setValues((prev) =>
        prev.includes(option.id) ? prev : [...prev, option.id],
      );

      setSelectedMap((prev) => {
        const m = new Map(prev);
        m.set(option.id, option);
        return m;
      });
    },
    [setValues],
  );

  const removeId = useCallback(
    (id: string) => {
      setValues((prev) => prev.filter((x) => x !== id));
    },
    [setValues],
  );

  const toggleOption = useCallback(
    (option: Option) => {
      if (values.includes(option.id)) {
        removeId(option.id);
      } else {
        addId(option);
      }
    },
    [values, addId, removeId],
  );

  const handleCreate = useCallback(async () => {
    if (!createOption) return;

    const nextName = input.trim();
    if (!nextName) return;

    try {
      const created = await createOption(nextName);

      setOptions((prev) =>
        prev.some((o) => o.id === created.id) ? prev : [created, ...prev],
      );

      addId(created);
      setInput("");
    } catch (err) {
      onError?.(err);
    }
  }, [createOption, input, addId, onError]);

  const handleDeleteOption = useCallback(
    async (option: Option) => {
      if (!deleteOption) return;

      try {
        await deleteOption(option.id);
        removeId(option.id);
        setOptions((prev) => prev.filter((o) => o.id !== option.id));
      } catch (err) {
        onError?.(err);
      }
    },
    [deleteOption, removeId, onError],
  );

  const selectedLabels = values.map((id) => selectedMap.get(id)?.name ?? id);

  const displayValue =
    selectedLabels.length > 0
      ? selectedLabels.join(", ")
      : placeholder || `${title || "항목"}을(를) 선택하세요`;

  return (
    <div className="w-100 mb-3">
      {title && <label className="form-label fw-semibold">{title}</label>}

      <button
        id={name}
        name={name}
        type="button"
        onClick={() => openModal(modalKey)}
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
        onClick={() => closeModal(modalKey)}
        aria-hidden={!isComArrayOpen}
        style={{
          top: 0,
          bottom: 55,
          background: "rgba(0, 0, 0, 0.32)",
          opacity: isComArrayOpen ? 1 : 0,
          pointerEvents: isComArrayOpen ? "auto" : "none",
          transition: "opacity 160ms ease",
          zIndex: 10,
        }}
      />

      <aside
        aria-hidden={!isComArrayOpen}
        className="w-100 start-0 position-fixed bg-white shadow d-flex flex-column"
        style={{
          bottom: 55,
          zIndex: 80,
          height: "80%",
          borderRadius: "20px 20px 0 0",
          transform: isComArrayOpen ? "translateY(0)" : "translateY(100%)",
          transition: "transform 220ms ease",
        }}
      >
        <div className="w-100 d-flex align-items-center justify-content-between border-bottom px-3 py-2">
          <h2 className="m-0 fs-6 fw-bold">{title}</h2>

          <button
            type="button"
            className="btn border-0 bg-transparent fs-3 text-secondary px-1 py-0"
            onClick={() => closeModal(modalKey)}
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
            <div className="p-2">
              <input
                name={name}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={placeholder}
                className="form-control"
                autoFocus
              />
            </div>

            {values.length > 0 && (
              <div className="d-flex flex-wrap gap-2 px-2 pb-2">
                {values.map((id) => {
                  const label = selectedMap.get(id)?.name ?? id;

                  return (
                    <span
                      key={id}
                      className="badge text-bg-secondary d-inline-flex align-items-center gap-1 px-3 py-2"
                    >
                      {label}
                      <button
                        type="button"
                        className="btn-close btn-close-white ms-1"
                        aria-label="삭제"
                        onClick={() => removeId(id)}
                        style={{ fontSize: "0.55rem" }}
                      />
                    </span>
                  );
                })}
              </div>
            )}

            <div style={{ paddingBottom: 100 }}>
              {loading && (
                <div className="px-3 py-3 text-secondary">불러오는 중...</div>
              )}

              {!loading && createOption && input.trim() && (
                <button
                  type="button"
                  className="w-100 text-start px-3 py-3 border-0 bg-white fw-semibold"
                  onClick={handleCreate}
                  style={{ borderBottom: "1px solid #eee" }}
                >
                  “{input.trim()}” 추가
                </button>
              )}

              {!loading && options.length === 0 && (
                <div className="px-3 py-3 text-secondary">
                  검색 결과가 없습니다.
                </div>
              )}

              {!loading &&
                options.map((opt) => {
                  const checked = values.includes(opt.id);

                  return (
                    <div
                      key={opt.id}
                      className="w-100 d-flex align-items-center"
                      style={{ borderBottom: "1px solid #eee" }}
                    >
                      <button
                        type="button"
                        role="option"
                        aria-selected={checked}
                        onClick={() => toggleOption(opt)}
                        className={`flex-grow-1 d-flex align-items-center gap-2 text-start px-3 py-3 border-0 bg-white ${
                          checked ? "fw-bold" : ""
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          readOnly
                          className="form-check-input mt-0"
                        />
                        <span>{opt.name}</span>
                      </button>

                      {deleteOption && (
                        <button
                          type="button"
                          className="btn btn-sm text-danger me-2"
                          onClick={() => handleDeleteOption(opt)}
                        >
                          삭제
                        </button>
                      )}
                    </div>
                  );
                })}
            </div>
          </nav>
        </div>
      </aside>
    </div>
  );
};
