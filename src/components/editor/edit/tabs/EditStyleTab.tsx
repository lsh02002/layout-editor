import {
  useState,
  type CSSProperties,
  type Dispatch,
  type SetStateAction,
} from "react";

import EditColorStyleFields from "../fields/EditColorStyleFields";
import EditSelectStyleFields from "../fields/EditSelectStyleFields";
import EditTextStyleFields from "../fields/EditTextStyleFields";
import EditWidthFields from "../fields/EditWidthFields";
import EditHeightFields from "../fields/EditHeightFields";
import EditPositionFields from "../fields/EditPositionFields";

import type { ComponentLayout } from "../../../../types/types";

type StyleTarget = "style" | "contentStyle";

type Props = {
  editStyle: CSSProperties;
  setEditStyle: Dispatch<SetStateAction<CSSProperties>>;

  editContentStyle: CSSProperties;
  setEditContentStyle: Dispatch<SetStateAction<CSSProperties>>;

  savedStyle: CSSProperties;
  savedContentStyle: CSSProperties;

  editLayout: ComponentLayout;
  setEditLayout: Dispatch<SetStateAction<ComponentLayout>>;

  onLayoutChange: (layout: Partial<ComponentLayout>) => void;

  // 컨테이너면 배경 관련 스타일은 style에,
  // 일반 컴포넌트면 contentStyle에 적용합니다.
  isParentComponent: boolean;

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
  savedStyle,
  savedContentStyle,
  editLayout,
  setEditLayout,
  onLayoutChange,
  isParentComponent = false,
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

  const backgroundStyle = isParentComponent ? editStyle : editContentStyle;

  const savedBackgroundStyle = isParentComponent
    ? savedStyle
    : savedContentStyle;

  const backgroundTarget: StyleTarget = isParentComponent
    ? "style"
    : "contentStyle";

  const updateBackgroundStyle = (
    key: keyof CSSProperties,
    value: CSSProperties[keyof CSSProperties],
  ) => {
    if (isParentComponent) {
      updateStyle(key, value);
      return;
    }

    updateContentStyle(key, value);
  };

  const applyBackgroundStyle = (key: keyof CSSProperties) => {
    onApply(backgroundTarget, key, backgroundStyle[key]);
  };

  const getBackgroundImageUrl = (value: CSSProperties["backgroundImage"]) => {
    if (typeof value !== "string") {
      return "";
    }
    return value.replace(/^url\(["']?/, "").replace(/["']?\)$/, "");
  };

  return (
    <div className="row g-3">
      <EditWidthFields
        editLayout={editLayout}
        setEditLayout={setEditLayout}
        onLayoutChange={onLayoutChange}
        hideResizeMessage={hideResizeMessage}
        widthApplied={widthApplied}
        setWidthApplied={setWidthApplied}
      />

      <EditHeightFields
        editLayout={editLayout}
        setEditLayout={setEditLayout}
        onLayoutChange={onLayoutChange}
        hideResizeMessage={hideResizeMessage}
        heightApplied={heightApplied}
        setHeightApplied={setHeightApplied}
      />

      <EditTextStyleFields
        label="Margin"
        placeholder="16px"
        value={String(editStyle.margin ?? "")}
        savedValue={String(savedContentStyle.margin ?? "")}
        onChange={(value) => {
          hideResizeMessage();
          updateStyle("margin", value || undefined);
        }}
        onApply={() => onApply("style", "margin", editStyle.margin)}
      />

      <EditTextStyleFields
        label="Padding"
        placeholder="16px"
        value={String(editStyle.padding ?? "")}
        savedValue={String(savedContentStyle.padding ?? "")}
        onChange={(value) => {
          hideResizeMessage();
          updateStyle("padding", value || undefined);
        }}
        onApply={() => onApply("style", "padding", editStyle.padding)}
      />

      <EditColorStyleFields
        label="배경색"
        value={
          typeof backgroundStyle.backgroundColor === "string"
            ? backgroundStyle.backgroundColor
            : "#ffffff"
        }
        onChange={(value) => {
          hideResizeMessage();
          updateBackgroundStyle("backgroundColor", value);
        }}
        onApply={() => applyBackgroundStyle("backgroundColor")}
      />

      <EditColorStyleFields
        label="글자색"
        value={
          typeof editContentStyle.color === "string"
            ? editContentStyle.color
            : "#000000"
        }
        onChange={(value) => {
          hideResizeMessage();
          updateContentStyle("color", value);
        }}
        onApply={() => onApply("contentStyle", "color", editContentStyle.color)}
      />

      <EditTextStyleFields
        label="Border"
        placeholder="1px solid #ddd"
        value={String(editStyle.border ?? "")}
        savedValue={String(savedContentStyle.border ?? "")}
        onChange={(value) => {
          hideResizeMessage();
          updateStyle("border", value || undefined);
        }}
        onApply={() => onApply("style", "border", editStyle.border)}
      />

      <EditTextStyleFields
        label="Border Radius"
        placeholder="8px"
        value={String(editStyle.borderRadius ?? "")}
        savedValue={String(savedContentStyle.borderRadius ?? "")}
        onChange={(value) => {
          hideResizeMessage();
          updateStyle("borderRadius", value || undefined);
        }}
        onApply={() => onApply("style", "borderRadius", editStyle.borderRadius)}
      />

      <EditTextStyleFields
        label="Font Size"
        placeholder="16px"
        value={String(editContentStyle.fontSize ?? "")}
        savedValue={String(savedContentStyle.fontSize ?? "")}
        onChange={(value) => {
          hideResizeMessage();
          updateContentStyle("fontSize", value || undefined);
        }}
        onApply={() =>
          onApply("contentStyle", "fontSize", editContentStyle.fontSize)
        }
      />

      <EditSelectStyleFields
        label="Text Align"
        value={String(editContentStyle.textAlign ?? "")}
        options={[
          { value: "", label: "기본" },
          { value: "left", label: "Left" },
          { value: "center", label: "Center" },
          { value: "right", label: "Right" },
        ]}
        onApply={(value) => {
          hideResizeMessage();
          const textAlign =
            value === "" ? undefined : (value as CSSProperties["textAlign"]);
          updateContentStyle("textAlign", textAlign);
          onApply("contentStyle", "textAlign", textAlign);
        }}
      />

      <EditTextStyleFields
        label={isParentComponent ? "컨테이너 배경 이미지" : "배경 이미지"}
        colClassName="col-md-12"
        placeholder="https://example.com/image.jpg"
        value={getBackgroundImageUrl(backgroundStyle.backgroundImage ?? "")}
        savedValue={getBackgroundImageUrl(
          savedBackgroundStyle.backgroundImage ?? "",
        )}
        onChange={(value) => {
          hideResizeMessage();
          const nextValue = value.trim();
          updateBackgroundStyle(
            "backgroundImage",
            nextValue ? `url("${nextValue}")` : undefined,
          );
        }}
        onApply={() => applyBackgroundStyle("backgroundImage")}
      />

      <EditSelectStyleFields
        label="배경 크기"
        value={String(backgroundStyle.backgroundSize ?? "cover")}
        options={[
          { value: "cover", label: "Cover" },
          { value: "contain", label: "Contain" },
          { value: "auto", label: "Auto" },
          { value: "100% 100%", label: "Stretch" },
        ]}
        onApply={(value) => {
          hideResizeMessage();
          const backgroundSize =
            value === ""
              ? undefined
              : (value as CSSProperties["backgroundSize"]);
          updateBackgroundStyle("backgroundSize", backgroundSize);
          onApply(backgroundTarget, "backgroundSize", backgroundSize);
        }}
      />

      <EditSelectStyleFields
        label="배경 위치"
        value={String(backgroundStyle.backgroundPosition ?? "center")}
        options={[
          { value: "center", label: "Center" },
          { value: "top", label: "Top" },
          { value: "bottom", label: "Bottom" },
          { value: "left", label: "Left" },
          { value: "right", label: "Right" },
          { value: "top left", label: "Top Left" },
          { value: "top right", label: "Top Right" },
          { value: "bottom left", label: "Bottom Left" },
          { value: "bottom right", label: "Bottom Right" },
        ]}
        onApply={(value) => {
          hideResizeMessage();
          const backgroundPosition =
            value === ""
              ? undefined
              : (value as CSSProperties["backgroundPosition"]);
          updateBackgroundStyle("backgroundPosition", backgroundPosition);
          onApply(backgroundTarget, "backgroundPosition", backgroundPosition);
        }}
      />

      <EditSelectStyleFields
        label="배경 반복"
        colClassName="col-md-12"
        value={String(backgroundStyle.backgroundRepeat ?? "no-repeat")}
        options={[
          { value: "no-repeat", label: "반복 안함" },
          { value: "repeat", label: "반복" },
          { value: "repeat-x", label: "가로 반복" },
          { value: "repeat-y", label: "세로 반복" },
        ]}
        onApply={(value) => {
          hideResizeMessage();
          const backgroundRepeat =
            value === ""
              ? undefined
              : (value as CSSProperties["backgroundRepeat"]);
          updateBackgroundStyle("backgroundRepeat", backgroundRepeat);
          onApply(backgroundTarget, "backgroundRepeat", backgroundRepeat);
        }}
      />

      <EditPositionFields
        editLayout={editLayout}
        setEditLayout={setEditLayout}
        onLayoutChange={onLayoutChange}
        hideResizeMessage={hideResizeMessage}
        positionParentOptions={positionParentOptions}
        onPositionParentChange={onPositionParentChange}
      />
    </div>
  );
}

export default EditStyleTab;
