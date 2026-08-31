import type { ComponentType } from "../../../types/types";

const COMPONENTS: {
  type: ComponentType;
  label: string;
  description: string;
}[] = [
  {
    type: "container",
    label: "Container",
    description: "컴포넌트를 묶는 영역",
  },
  {
    type: "heading",
    label: "Heading",
    description: "제목 텍스트",
  },
  {
    type: "textarea",
    label: "TextArea",
    description: "일반 텍스트",
  },
  {
    type: "quill",
    label: "Quill Editor",
    description: "리치 텍스트",
  },
  {
    type: "button",
    label: "Button",
    description: "버튼",
  },
  {
    type: "scrollToTopButton",
    label: "Scroll To Top",
    description: "페이지 상단 이동 버튼",
  },
  {
    type: "image",
    label: "Image",
    description: "이미지",
  },
  {
    type: "video",
    label: "Video",
    description: "동영상",
  },
  {
    type: "link",
    label: "Link",
    description: "링크",
  },
  {
    type: "divider",
    label: "Divider",
    description: "구분선",
  },
  {
    type: "spacer",
    label: "Spacer",
    description: "여백",
  },
  {
    type: "codeEditor",
    label: "Code Editor",
    description: "코드 편집기",
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
          {COMPONENTS.map((component) => (
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
                minHeight: 82,
                padding: 10,
                cursor: "grab",
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                {component.label}
              </div>

              <div
                className="text-secondary"
                style={{
                  marginTop: 4,
                  fontSize: 11,
                }}
              >
                {component.description}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ComponentPanel;
