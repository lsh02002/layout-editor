import type { TemplateItem } from "../../../types/types";
import TemplateCanvasPreviewCard from "./TemplateCanvasPreviewCard";
type Props = {
  template: TemplateItem;
  selected?: boolean;
  onSelect?: () => void;
};

export default function TemplatePreviewCard({
  template,
  selected,
  onSelect,
}: Props) {
  return (
    <div
      draggable
      onClick={onSelect}
      onDragStart={(event) => {
        event.stopPropagation();

        event.dataTransfer.effectAllowed = "copy";

        event.dataTransfer.setData(
          "application/x-pagebuilder-template",
          JSON.stringify({
            type: "template",
            templateId: template.id,
          }),
        );
      }}
      style={{
        border: selected ? "2px solid #0d6efd" : "1px solid #dee2e6",
        borderRadius: 8,
        cursor: "grab",
        overflow: "hidden",
        background: "#fff",
      }}
    >
      <div
        style={{
          height: 160,
          overflow: "hidden",
          background: "#f8f9fa",
          position: "relative",
        }}
      >
        <div
          style={{
            width: "100%",
            transform: "scale(0.5)",
            transformOrigin: "top left",
            pointerEvents: "none",
          }}
        >
          <TemplateCanvasPreviewCard components={template.components} />
        </div>
      </div>

      <div className="p-2">
        <div
          className="
            fw-semibold
            text-truncate
          "
        >
          <small>파일이름: {template.name}</small>
        </div>
        <small className="text-secondary">
          클릭하여 선택 · 드래그하여 추가
        </small>
        {template.description && (
          <div
            className="
              small
              text-secondary
              text-truncate
              mt-1
            "
          >
            {template.description}
          </div>
        )}
      </div>
    </div>
  );
}
