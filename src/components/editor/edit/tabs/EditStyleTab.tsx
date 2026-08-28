import type { CSSProperties, Dispatch, SetStateAction } from "react";

import ApplyButton from "./ApplyButton";

import type { ComponentLayout } from "../../../../types/types";

type StyleTarget = "style" | "contentStyle";

type Props = {
  editStyle: CSSProperties;
  setEditStyle: Dispatch<SetStateAction<CSSProperties>>;

  editContentStyle: CSSProperties;
  setEditContentStyle: Dispatch<SetStateAction<CSSProperties>>;

  editLayout: ComponentLayout;
  setEditLayout: Dispatch<SetStateAction<ComponentLayout>>;

  onLayoutChange: (layout: Partial<ComponentLayout>) => void;

  // 컨테이너면 배경 관련 스타일은 style에,
  // 일반 컴포넌트면 contentStyle에 적용합니다.
  isContainer: boolean;

  onApply: (
    target: StyleTarget,
    key: keyof CSSProperties,
    value: CSSProperties[keyof CSSProperties],
  ) => void;
};

function EditStyleTab({
  editStyle,
  setEditStyle,
  editContentStyle,
  setEditContentStyle,
  editLayout,
  setEditLayout,
  onLayoutChange,
  isContainer = false,
  onApply,
}: Props) {
  /*
   * Style 입력값 변경
   *
   * 여기서는 오른쪽 에디터 state만 변경합니다.
   * 실제 컴포넌트 반영은 해당 필드의 적용 버튼을 눌렀을 때 합니다.
   */
  const updateStyle = (
    key: keyof CSSProperties,
    value: CSSProperties[keyof CSSProperties],
  ) => {
    setEditStyle((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  /*
   * Content Style 입력값 변경
   */
  const updateContentStyle = (
    key: keyof CSSProperties,
    value: CSSProperties[keyof CSSProperties],
  ) => {
    setEditContentStyle((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  /*
   * 배경 관련 스타일은 컨테이너 여부에 따라 저장 위치를 분기합니다.
   * - 컨테이너: style
   * - 일반 컴포넌트: contentStyle
   */
  const backgroundStyle = isContainer ? editStyle : editContentStyle;
  const backgroundTarget: StyleTarget = isContainer ? "style" : "contentStyle";

  const updateBackgroundStyle = (
    key: keyof CSSProperties,
    value: CSSProperties[keyof CSSProperties],
  ) => {
    if (isContainer) {
      updateStyle(key, value);
      return;
    }

    updateContentStyle(key, value);
  };

  const applyBackgroundStyle = (key: keyof CSSProperties) => {
    onApply(backgroundTarget, key, backgroundStyle[key]);
  };

  return (
    <div className="row g-3">
      {/* Width */}
      <div className="col-md-6">
        <label className="form-label">Width</label>

        <div className="input-group input-group-sm">
          <input
            type="text"
            className="form-control"
            placeholder="100%, 500px, auto"
            value={String(editStyle.width ?? "")}
            onChange={(event) => {
              updateStyle("width", event.target.value || undefined);

              setEditLayout((prev) => ({
                ...prev,
                width: event.target.value || undefined,
              }));
            }}
          />

          <ApplyButton
            onClick={() => {
              onApply("style", "width", editStyle.width);
              onLayoutChange({ width: editLayout.width });
            }}
          />
        </div>
      </div>

      {/* Height */}
      <div className="col-md-6">
        <label className="form-label">Height</label>

        <div className="input-group input-group-sm">
          <input
            type="text"
            className="form-control"
            placeholder="200px, auto"
            value={String(editStyle.height ?? "")}
            onChange={(event) => {
              updateStyle("height", event.target.value || undefined);

              setEditLayout((prev) => ({
                ...prev,
                height: event.target.value || undefined,
              }));
            }}
          />

          <ApplyButton
            onClick={() => {
              onApply("style", "height", editStyle.height);
              onLayoutChange({ height: editLayout.height });
            }}
          />
        </div>
      </div>

      {/* Margin */}
      <div className="col-md-6">
        <label className="form-label">Margin</label>

        <div className="input-group input-group-sm">
          <input
            type="text"
            className="form-control"
            placeholder="16px"
            value={String(editStyle.margin ?? "")}
            onChange={(event) =>
              updateStyle("margin", event.target.value || undefined)
            }
          />

          <ApplyButton
            onClick={() => onApply("style", "margin", editStyle.margin)}
          />
        </div>
      </div>

      {/* Padding */}
      <div className="col-md-6">
        <label className="form-label">Padding</label>

        <div className="input-group input-group-sm">
          <input
            type="text"
            className="form-control"
            placeholder="16px"
            value={String(editStyle.padding ?? "")}
            onChange={(event) =>
              updateStyle("padding", event.target.value || undefined)
            }
          />

          <ApplyButton
            onClick={() => onApply("style", "padding", editStyle.padding)}
          />
        </div>
      </div>

      {/* 배경색 */}
      <div className="col-md-6">
        <label className="form-label">배경색</label>

        <div className="input-group input-group-sm">
          <input
            type="color"
            className="form-control form-control-color"
            value={
              typeof backgroundStyle.backgroundColor === "string"
                ? backgroundStyle.backgroundColor
                : "#ffffff"
            }
            onChange={(event) =>
              updateBackgroundStyle("backgroundColor", event.target.value)
            }
          />

          <ApplyButton
            onClick={() => applyBackgroundStyle("backgroundColor")}
          />
        </div>
      </div>

      {/* 글자색 */}
      <div className="col-md-6">
        <label className="form-label">글자색</label>

        <div className="input-group input-group-sm">
          <input
            type="color"
            className="form-control form-control-color"
            value={
              typeof editContentStyle.color === "string"
                ? editContentStyle.color
                : "#000000"
            }
            onChange={(event) =>
              updateContentStyle("color", event.target.value)
            }
          />

          <ApplyButton
            onClick={() =>
              onApply("contentStyle", "color", editContentStyle.color)
            }
          />
        </div>
      </div>

      {/* Border */}
      <div className="col-md-6">
        <label className="form-label">Border</label>

        <div className="input-group input-group-sm">
          <input
            type="text"
            className="form-control"
            placeholder="1px solid #ddd"
            value={String(editStyle.border ?? "")}
            onChange={(event) =>
              updateStyle("border", event.target.value || undefined)
            }
          />

          <ApplyButton
            onClick={() => onApply("style", "border", editStyle.border)}
          />
        </div>
      </div>

      {/* Border Radius */}
      <div className="col-md-6">
        <label className="form-label">Border Radius</label>

        <div className="input-group input-group-sm">
          <input
            type="text"
            className="form-control"
            placeholder="8px"
            value={String(editStyle.borderRadius ?? "")}
            onChange={(event) =>
              updateStyle("borderRadius", event.target.value || undefined)
            }
          />

          <ApplyButton
            onClick={() =>
              onApply("style", "borderRadius", editStyle.borderRadius)
            }
          />
        </div>
      </div>

      {/* Font Size */}
      <div className="col-md-6">
        <label className="form-label">Font Size</label>

        <div className="input-group input-group-sm">
          <input
            type="text"
            className="form-control"
            placeholder="16px"
            value={String(editContentStyle.fontSize ?? "")}
            onChange={(event) =>
              updateContentStyle("fontSize", event.target.value || undefined)
            }
          />

          <ApplyButton
            onClick={() =>
              onApply("contentStyle", "fontSize", editContentStyle.fontSize)
            }
          />
        </div>
      </div>

      {/* Text Align */}
      <div className="col-md-6">
        <label className="form-label">Text Align</label>

        <div className="input-group input-group-sm">
          <select
            className="form-select"
            value={String(editContentStyle.textAlign ?? "")}
            onChange={(event) => {
              const textAlign =
                event.target.value === ""
                  ? undefined
                  : (event.target.value as CSSProperties["textAlign"]);

              updateContentStyle("textAlign", textAlign);
            }}
          >
            <option value="">기본</option>
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>

          <ApplyButton
            onClick={() =>
              onApply("contentStyle", "textAlign", editContentStyle.textAlign)
            }
          />
        </div>
      </div>

      {/* 배경 이미지 */}
      <div className="col-md-12">
        <label className="form-label">
          {isContainer ? "컨테이너 배경 이미지" : "배경 이미지"}
        </label>

        <div className="input-group input-group-sm">
          <input
            type="text"
            className="form-control"
            placeholder="https://example.com/image.jpg"
            value={
              typeof backgroundStyle.backgroundImage === "string"
                ? backgroundStyle.backgroundImage
                    .replace(/^url\(["']?/, "")
                    .replace(/["']?\)$/, "")
                : ""
            }
            onChange={(event) => {
              const value = event.target.value.trim();

              updateBackgroundStyle(
                "backgroundImage",
                value ? `url("${value}")` : undefined,
              );
            }}
          />

          <ApplyButton
            onClick={() => applyBackgroundStyle("backgroundImage")}
          />
        </div>
      </div>

      {/* 배경 이미지 크기 */}
      <div className="col-md-6">
        <label className="form-label">배경 크기</label>

        <div className="input-group input-group-sm">
          <select
            className="form-select"
            value={String(backgroundStyle.backgroundSize ?? "cover")}
            onChange={(event) =>
              updateBackgroundStyle("backgroundSize", event.target.value)
            }
          >
            <option value="cover">Cover</option>
            <option value="contain">Contain</option>
            <option value="auto">Auto</option>
            <option value="100% 100%">Stretch</option>
          </select>

          <ApplyButton onClick={() => applyBackgroundStyle("backgroundSize")} />
        </div>
      </div>

      {/* 배경 위치 */}
      <div className="col-md-6">
        <label className="form-label">배경 위치</label>

        <div className="input-group input-group-sm">
          <select
            className="form-select"
            value={String(backgroundStyle.backgroundPosition ?? "center")}
            onChange={(event) =>
              updateBackgroundStyle("backgroundPosition", event.target.value)
            }
          >
            <option value="center">Center</option>
            <option value="top">Top</option>
            <option value="bottom">Bottom</option>
            <option value="left">Left</option>
            <option value="right">Right</option>
            <option value="top left">Top Left</option>
            <option value="top right">Top Right</option>
            <option value="bottom left">Bottom Left</option>
            <option value="bottom right">Bottom Right</option>
          </select>

          <ApplyButton
            onClick={() => applyBackgroundStyle("backgroundPosition")}
          />
        </div>
      </div>

      {/* 배경 반복 */}
      <div className="col-md-6">
        <label className="form-label">배경 반복</label>

        <div className="input-group input-group-sm">
          <select
            className="form-select"
            value={String(backgroundStyle.backgroundRepeat ?? "no-repeat")}
            onChange={(event) =>
              updateBackgroundStyle("backgroundRepeat", event.target.value)
            }
          >
            <option value="no-repeat">반복 안함</option>
            <option value="repeat">반복</option>
            <option value="repeat-x">가로 반복</option>
            <option value="repeat-y">세로 반복</option>
          </select>

          <ApplyButton
            onClick={() => applyBackgroundStyle("backgroundRepeat")}
          />
        </div>
      </div>

      {/* 위치 방식 - 즉시 반영 */}
      <div className="col-md-6">
        <label className="form-label fw-semibold">위치 방식</label>

        <select
          className="form-select form-select-sm"
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

      {/* Absolute 좌표 */}
      {editLayout.position === "absolute" && (
        <>
          {/* X - 즉시 반영 */}
          <div className="col-md-6">
            <label className="form-label">X</label>

            <div className="input-group input-group-sm">
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

                  onLayoutChange({
                    x,
                  });
                }}
              />

              <span className="input-group-text">px</span>
            </div>
          </div>

          {/* Y - 즉시 반영 */}
          <div className="col-md-6">
            <label className="form-label">Y</label>

            <div className="input-group input-group-sm">
              <input
                type="number"
                className="form-control"
                value={editLayout.y ?? 0}
                onChange={(event) => {
                  const y = Number(event.target.value) || 0;

                  setEditLayout((prev) => ({
                    ...prev,
                    y,
                  }));

                  onLayoutChange({
                    y,
                  });
                }}
              />

              <span className="input-group-text">px</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default EditStyleTab;
