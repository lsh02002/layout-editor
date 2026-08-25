import TemplatePreviewCard from "../editor/card/TemplatePreviewCard";
import type { TemplateItem } from "../../types/types";

export default function TemplatePreviewListPanel({
  templateFiles,
  setTemplateFiles,
  selectedTemplateId,
  setSelectedTemplateId,
}: {
  templateFiles: {
    name: string;
    data: TemplateItem;
  }[];
  setTemplateFiles: (
    files: {
      name: string;
      data: TemplateItem;
    }[],
  ) => void;
  selectedTemplateId: string | null;
  setSelectedTemplateId: (id: string | null) => void;
}) {
  return (
    <div className="d-flex flex-column gap-3">
      <input
        type="file"
        multiple
        // @ts-expect-error webkitdirectory
        webkitdirectory=""
        accept=".pbtpl"
        onChange={async (event) => {
          const files = Array.from(event.target.files ?? []).filter((file) =>
            file.name.toLowerCase().endsWith(".pbtpl"),
          );

          const templates: {
            name: string;
            data: TemplateItem;
          }[] = [];

          for (const file of files) {
            try {
              const text = await file.text();

              const parsed = JSON.parse(text) as TemplateItem;

              const filePath = file.webkitRelativePath || file.name;

              const data: TemplateItem = {
                ...parsed,

                id: filePath,

                name: parsed.name || file.name.replace(/\.pbtpl$/i, ""),
              };

              templates.push({
                name: filePath,
                data,
              });
            } catch (error) {
              console.error("템플릿 읽기 실패:", file.name, error);
            }
          }

          setTemplateFiles(templates);

          setSelectedTemplateId(null);

          event.target.value = "";
        }}
      />

      <div className="d-flex flex-wrap gap-2">
        {templateFiles.map(({ name, data }) => (
          <div
            key={name}
            style={{
              width: 180,
              flex: "0 0 180px",
            }}
          >
            <TemplatePreviewCard
              template={data}
              selected={selectedTemplateId === data.id}
              onSelect={() =>
                setSelectedTemplateId(
                  selectedTemplateId === data.id ? null : data.id,
                )
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}
