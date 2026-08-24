import type { CSSProperties, Dispatch, SetStateAction } from "react";
import type { ComponentLayout } from "../../../../types/types";

type Props = {
  editStyle: CSSProperties;
  setEditStyle: Dispatch<SetStateAction<CSSProperties>>;
  editContentStyle: CSSProperties;
  setEditContentStyle: Dispatch<SetStateAction<CSSProperties>>;
  editLayout: ComponentLayout;
  setEditLayout: Dispatch<SetStateAction<ComponentLayout>>;
  onLayoutChange: (layout: Partial<ComponentLayout>) => void;
};

function EditStyleTab({
  editStyle,
  setEditStyle,
  editContentStyle,
  setEditContentStyle,
  editLayout,
  setEditLayout,
  onLayoutChange,
}: Props) {
  const updateStyle = (
    key: keyof CSSProperties,
    value: CSSProperties[keyof CSSProperties],
  ) => {
    setEditStyle((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const updateContentStyle = (
    key: keyof CSSProperties,
    value: CSSProperties[keyof CSSProperties],
  ) => {
    setEditContentStyle((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <div className="row g-3">
      <div className="col-md-6">
        <label className="form-label">Width</label>
        <input
          type="text"
          className="form-control"
          placeholder="100%, 500px, auto"
          value={String(editStyle.width ?? "")}
          onChange={(event) =>
            updateStyle("width", event.target.value || undefined)
          }
        />
      </div>

      <div className="col-md-6">
        <label className="form-label">Height</label>
        <input
          type="text"
          className="form-control"
          placeholder="200px, auto"
          value={String(editStyle.height ?? "")}
          onChange={(event) =>
            updateStyle("height", event.target.value || undefined)
          }
        />
      </div>

      <div className="col-md-6">
        <label className="form-label">Margin</label>
        <input
          type="text"
          className="form-control"
          placeholder="16px"
          value={String(editStyle.margin ?? "")}
          onChange={(event) =>
            updateStyle("margin", event.target.value || undefined)
          }
        />
      </div>

      <div className="col-md-6">
        <label className="form-label">Padding</label>
        <input
          type="text"
          className="form-control"
          placeholder="16px"
          value={String(editStyle.padding ?? "")}
          onChange={(event) =>
            updateStyle("padding", event.target.value || undefined)
          }
        />
      </div>

      <div className="col-md-6">
        <label className="form-label">배경색</label>
        <input
          type="color"
          className="form-control form-control-color"
          value={
            typeof editStyle.backgroundColor === "string"
              ? editStyle.backgroundColor
              : "#ffffff"
          }
          onChange={(event) =>
            updateStyle("backgroundColor", event.target.value)
          }
        />
      </div>

      <div className="col-md-6">
        <label className="form-label">글자색</label>
        <input
          type="color"
          className="form-control form-control-color"
          value={
            typeof editContentStyle.color === "string"
              ? editContentStyle.color
              : "#000000"
          }
          onChange={(event) => updateContentStyle("color", event.target.value)}
        />
      </div>

      <div className="col-md-6">
        <label className="form-label">Border</label>
        <input
          type="text"
          className="form-control"
          placeholder="1px solid #ddd"
          value={String(editStyle.border ?? "")}
          onChange={(event) =>
            updateStyle("border", event.target.value || undefined)
          }
        />
      </div>

      <div className="col-md-6">
        <label className="form-label">Border Radius</label>
        <input
          type="text"
          className="form-control"
          placeholder="8px"
          value={String(editStyle.borderRadius ?? "")}
          onChange={(event) =>
            updateStyle("borderRadius", event.target.value || undefined)
          }
        />
      </div>

      <div className="col-md-6">
        <label className="form-label">Font Size</label>
        <input
          type="text"
          className="form-control"
          placeholder="16px"
          value={String(editContentStyle.fontSize ?? "")}
          onChange={(event) =>
            updateContentStyle("fontSize", event.target.value || undefined)
          }
        />
      </div>

      <div className="col-md-6">
        <label className="form-label">Text Align</label>

        <select
          className="form-select"
          value={String(editContentStyle.textAlign ?? "")}
          onChange={(event) =>
            updateContentStyle(
              "textAlign",
              event.target.value === ""
                ? undefined
                : (event.target.value as CSSProperties["textAlign"]),
            )
          }
        >
          <option value="">기본</option>
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </select>
      </div>

      <div className="col-md-6">
        <label className="form-label fw-semibold">위치 방식</label>

        <select
          className="form-select"
          value={editLayout.position ?? "relative"}
          onChange={(event) => {
            const position = event.target.value as "relative" | "absolute";
            const nextLayout: Partial<ComponentLayout> =
              position === "absolute"
                ? {
                    position: "absolute",
                    x: editLayout.x ?? 0,
                    y: editLayout.y ?? 0,
                  }
                : {
                    position: "relative",
                    x: undefined,
                    y: undefined,
                  };

            setEditLayout((prev) => ({
              ...prev,
              ...nextLayout,
            }));
            onLayoutChange(nextLayout);
          }}
        >
          <option value="relative">일반 배치</option>
          <option value="absolute">자유 배치</option>
        </select>

        <div className="form-text">
          자유 배치를 선택하면 캔버스에서 원하는 위치로 이동할 수 있습니다.
        </div>
      </div>

      {editLayout.position === "absolute" && (
        <div className="row g-2 mb-3">
          <div className="col-6">
            <label className="form-label">X</label>

            <div className="input-group">
              <input
                type="number"
                className="form-control"
                value={editLayout.x ?? 0}
                onChange={(event) => {
                  const x = Number(event.target.value) || 0;
                  setEditLayout((prev) => ({
                    ...prev,
                    x,
                  }));

                  const y = Number(event.target.value) || 0;
                  setEditLayout((prev) => ({
                    ...prev,
                    y,
                  }));
                  onLayoutChange({
                    x,
                    y,
                  });
                }}
              />

              <span className="input-group-text">px</span>
            </div>
          </div>

          <div className="col-6">
            <label className="form-label">Y</label>

            <div className="input-group">
              <input
                type="number"
                className="form-control"
                value={editLayout.y ?? 0}
                onChange={(event) => {
                  setEditLayout({
                    ...editLayout,

                    y: Number(event.target.value) || 0,
                  });
                }}
              />

              <span className="input-group-text">px</span>
            </div>
          </div>
        </div>
      )}

      <div className="col-12">
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm"
          onClick={() => {
            setEditStyle({});
            setEditContentStyle({});
          }}
        >
          스타일 초기화
        </button>
      </div>
    </div>
  );
}

export default EditStyleTab;
