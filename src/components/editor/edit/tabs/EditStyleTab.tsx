import {
  useState,
  type CSSProperties,
  type Dispatch,
  type SetStateAction,
} from "react";

import ApplyButton from "../fields/ApplyButton";

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

  positionParentOptions: {
    id: string;
    label: string;
    disabled?: boolean;
  }[];

  onPositionParentChange: (parentId: string | null) => void;
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
  positionParentOptions,
  onPositionParentChange,
}: Props) {
  const [widthApplied, setWidthApplied] = useState(false);
  const [heightApplied, setHeightApplied] = useState(false);

  const hideResizeMessage = () => {
    setWidthApplied(false);
    setHeightApplied(false);
  };

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
          <select
            className="form-select"
            value={editLayout.widthMode ?? "auto"}
            onChange={(event) => {
              hideResizeMessage();

              const widthMode = event.target.value as "auto" | "fill" | "fixed";

              const width =
                widthMode === "fixed"
                  ? (editLayout.width ?? 300)
                  : editLayout.width;

              setEditLayout((prev) => ({
                ...prev,
                widthMode,
                width,
              }));

              onLayoutChange({
                widthMode,
                width: widthMode === "fixed" ? width : undefined,
              });

              setWidthApplied(widthMode === "fixed");
            }}
          >
            <option value="auto">Auto</option>
            <option value="fill">Fill</option>
            <option value="fixed">Fixed</option>
          </select>

          {editLayout.widthMode === "fixed" && (
            <input
              type="number"
              className="form-control"
              value={Number(editLayout.width ?? 300)}
              onChange={(event) => {
                const width = Number(event.target.value);

                setEditLayout((prev) => ({
                  ...prev,
                  width,
                }));

                onLayoutChange({
                  widthMode: "fixed",
                  width,
                });
              }}
            />
          )}
        </div>

        {widthApplied && (
          <div className="form-text">
            지금 박스 왼쪽 오른쪽 드래그해서 너비 변경할 수 있음!
          </div>
        )}
      </div>

      {/* Height */}
      <div className="col-md-6">
        <label className="form-label">Height</label>

        <div className="input-group input-group-sm">
          <select
            className="form-select"
            value={editLayout.heightMode ?? "auto"}
            onChange={(event) => {
              hideResizeMessage();

              const heightMode = event.target.value as
                | "auto"
                | "fill"
                | "fixed";

              const height =
                heightMode === "fixed"
                  ? (editLayout.height ?? 100)
                  : editLayout.height;

              setEditLayout((prev) => ({
                ...prev,
                heightMode,
                height,
              }));

              onLayoutChange({
                heightMode,
                height: heightMode === "fixed" ? height : undefined,
              });

              setHeightApplied(heightMode === "fixed");
            }}
          >
            <option value="auto">Auto</option>
            <option value="fill">Fill</option>
            <option value="fixed">Fixed</option>
          </select>

          {editLayout.heightMode === "fixed" && (
            <input
              type="number"
              className="form-control"
              value={Number(editLayout.height ?? 100)}
              onChange={(event) => {
                const height = Number(event.target.value);

                setEditLayout((prev) => ({
                  ...prev,
                  height,
                }));

                onLayoutChange({
                  heightMode: "fixed",
                  height,
                });
              }}
            />
          )}
        </div>

        {heightApplied && (
          <div className="form-text">
            지금 박스 위아래 부분 드래그해서 높이 변경할 수 있음!
          </div>
        )}
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
            onChange={(event) => {
              hideResizeMessage();

              updateStyle("margin", event.target.value || undefined);
            }}
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
            onChange={(event) => {
              hideResizeMessage();

              updateStyle("padding", event.target.value || undefined);
            }}
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
            onChange={(event) => {
              hideResizeMessage();

              updateBackgroundStyle("backgroundColor", event.target.value);
            }}
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
            onChange={(event) => {
              hideResizeMessage();

              updateContentStyle("color", event.target.value);
            }}
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
            onChange={(event) => {
              hideResizeMessage();

              updateStyle("border", event.target.value || undefined);
            }}
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
            onChange={(event) => {
              hideResizeMessage();

              updateStyle("borderRadius", event.target.value || undefined);
            }}
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
            onChange={(event) => {
              hideResizeMessage();

              updateContentStyle("fontSize", event.target.value || undefined);
            }}
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
              hideResizeMessage();

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
              hideResizeMessage();

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
            onChange={(event) => {
              hideResizeMessage();

              updateBackgroundStyle("backgroundSize", event.target.value);
            }}
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
            onChange={(event) => {
              hideResizeMessage();

              updateBackgroundStyle("backgroundPosition", event.target.value);
            }}
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
      <div className="col-md-12">
        <label className="form-label">배경 반복</label>

        <div className="input-group input-group-sm">
          <select
            className="form-select"
            value={String(backgroundStyle.backgroundRepeat ?? "no-repeat")}
            onChange={(event) => {
              hideResizeMessage();

              updateBackgroundStyle("backgroundRepeat", event.target.value);
            }}
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
            hideResizeMessage();

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
          <div className="col-6">
            <label className="form-label">기준 컴포넌트</label>

            <select
              className="form-select form-select-sm"
              value={editLayout.positionParentId ?? ""}
              style={{
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
              onChange={(event) => {
                hideResizeMessage();

                const value = event.target.value || null;

                setEditLayout((prev) => ({
                  ...prev,
                  positionParentId: value,
                }));

                onPositionParentChange(value);
              }}
            >
              {positionParentOptions.map((component) => {
                const maxLength = 18;

                const label =
                  component.label.length > maxLength
                    ? `${component.label.slice(0, maxLength)}...`
                    : component.label;

                return (
                  <option
                    key={component.id}
                    value={component.id}
                    title={component.label}
                    disabled={component.disabled}
                  >
                    {label}
                  </option>
                );
              })}
            </select>

            {/* X - 즉시 반영 */}
            <div className="row-md-2">
              <label className="form-label">X</label>

              <div className="input-group input-group-sm">
                <input
                  type="number"
                  className="form-control"
                  value={editLayout.x ?? 0}
                  onChange={(event) => {
                    hideResizeMessage();

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
            <div className="row-md-2">
              <label className="form-label">Y</label>

              <div className="input-group input-group-sm">
                <input
                  type="number"
                  className="form-control"
                  value={editLayout.y ?? 0}
                  onChange={(event) => {
                    hideResizeMessage();

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
          </div>
        </>
      )}
    </div>
  );
}

export default EditStyleTab;
