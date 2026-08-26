import TemplatePreviewCard from "../editor/card/TemplatePreviewCard";
import type { TemplateItem } from "../../types/types";
import { useEffect } from "react";

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
  
  useEffect(() => {
    const TEMPLATE_FOLDER = "/src/templates";

    const loadTemplates = async () => {
      const modules = import.meta.glob("/src/templates/**/*.pbtpl", {
        query: "?raw",
        import: "default",
      });

      const templates: {
        name: string;
        data: TemplateItem;
      }[] = [];

      for (const [filePath, loader] of Object.entries(modules)) {
        try {
          const text = (await loader()) as string;
          const parsed = JSON.parse(text) as TemplateItem;

          const relativePath = filePath.replace(`${TEMPLATE_FOLDER}/`, "");

          const data: TemplateItem = {
            ...parsed,
            id: relativePath,
            name:
              parsed.name ||
              relativePath
                .split("/")
                .pop()
                ?.replace(/\.pbtpl$/i, "") ||
              relativePath,
          };

          templates.push({
            name: relativePath,
            data,
          });
        } catch (error) {
          console.error("템플릿 읽기 실패:", filePath, error);
        }
      }

      setTemplateFiles(templates);
      setSelectedTemplateId(null);
    };

    loadTemplates();
  }, [setSelectedTemplateId, setTemplateFiles]);

  return (
    <div className="d-flex flex-column gap-3">
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
