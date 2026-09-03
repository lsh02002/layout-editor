import {
  AlignLeft,
  ArrowUpToLine,
  Box,
  Code2,
  Heading1,
  ImageIcon,
  Images,
  Link2,
  Minus,
  MousePointerClick,
  MoveVertical,
  PlaySquare,
  TextQuote,
  type LucideIcon,
} from "lucide-react";

import type { ComponentType } from "../../../types/types";

const COMPONENTS: {
  type: ComponentType;
  label: string;
  description: string;
  icon: LucideIcon;
}[] = [
  {
    type: "container",
    label: "Container",
    description: "컴포넌트를 묶는 영역",
    icon: Box,
  },
  {
    type: "heading",
    label: "Heading",
    description: "제목 텍스트",
    icon: Heading1,
  },
  {
    type: "textarea",
    label: "TextArea",
    description: "일반 텍스트",
    icon: AlignLeft,
  },
  {
    type: "quill",
    label: "Quill",
    description: "리치 텍스트",
    icon: TextQuote,
  },
  {
    type: "button",
    label: "Button",
    description: "버튼",
    icon: MousePointerClick,
  },
  {
    type: "scrollToTopButton",
    label: "ScrollToTop",
    description: "페이지 상단 이동 버튼",
    icon: ArrowUpToLine,
  },
  {
    type: "image",
    label: "Image",
    description: "이미지",
    icon: ImageIcon,
  },
  {
    type: "imageGallery",
    label: "Image Gallery",
    description: "여러 이미지를 갤러리로 표시",
    icon: Images,
  },
  {
    type: "imageSlider",
    label: "Image Slider",
    description: "여러 이미지를 슬라이드",
    icon: Images,
  },
  {
    type: "video",
    label: "Video",
    description: "동영상",
    icon: PlaySquare,
  },
  {
    type: "link",
    label: "Link",
    description: "링크",
    icon: Link2,
  },
  {
    type: "divider",
    label: "Divider",
    description: "구분선",
    icon: Minus,
  },
  {
    type: "spacer",
    label: "Spacer",
    description: "여백",
    icon: MoveVertical,
  },
  {
    type: "codeEditor",
    label: "Highlighter",
    description: "코드 편집기",
    icon: Code2,
  },
];

function ComponentPanel() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
      }}
    >
      <div
        style={{
          padding: 12,
          borderBottom: "1px solid #dee2e6",
        }}
      >
        <strong>컴포넌트</strong>

        <div
          className="text-secondary"
          style={{
            marginTop: 4,
            fontSize: 12,
          }}
        >
          추가할 컴포넌트를 드래그해서 캔버스 드랍존(+)에 놓으세요.
        </div>
      </div>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          padding: 8,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 8,
          }}
        >
          {COMPONENTS.map((component) => {
            const Icon = component.icon;

            return (
              <button
                key={component.type}
                type="button"
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.effectAllowed = "copy";

                  event.dataTransfer.setData(
                    "application/x-component-type",
                    component.type,
                  );
                }}
                className="btn btn-light border text-start"
                style={{
                  minHeight: 92,
                  padding: 10,
                  cursor: "grab",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: 28,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    marginBottom: 8,
                    borderRadius: 6,
                    color: "#495057",
                  }}
                >
                  <Icon size={17} strokeWidth={1.8} />
                  &nbsp;
                  {component.label}
                </div>

                <div
                  className="text-secondary"
                  style={{
                    marginTop: 4,
                    fontSize: 11,
                    lineHeight: 1.35,
                  }}
                >
                  {component.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ComponentPanel;
