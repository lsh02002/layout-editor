import { useCallback } from "react";
import type { DragEvent } from "react";
import type { LayoutComponent } from "../../../../types/types";
import { insertComponentRecursive } from "../../utils/componentTree";

type TemplateItem = {
  id: string;
  name: string;
  components: LayoutComponent[];
  projectCustomCss?: string;
};

type Options = {
  templates: TemplateItem[];
  selectedTemplateId: string | null;
  setSelectedTemplateId: (id: string | null) => void;
  commitHistory: (
    updater: (prev: LayoutComponent[]) => LayoutComponent[],
  ) => void;
};

const cloneTemplateComponent = (
  component: LayoutComponent,
): LayoutComponent => {
  const clone = (item: LayoutComponent): LayoutComponent => {
    const id = crypto.randomUUID();
    if ("children" in item && Array.isArray(item.children)) {
      return {
        ...item,
        id,
        children: item.children.map(clone),
      };
    }
    return {
      ...item,
      id,
    };
  };

  return clone(component);
};

export const useTemplateActions = ({
  templates,
  setSelectedTemplateId,
  commitHistory,
}: Options) => {
  const insertTemplate = useCallback(
    (templateId: string, parentId: string | null, index: number) => {
      const template = templates.find((item) => item.id === templateId);

      if (!template) {
        return;
      }
      const newComponents = template.components.map(cloneTemplateComponent);

      commitHistory((prev) => {
        let next = prev;

        newComponents.forEach((component, offset) => {
          next = insertComponentRecursive(
            next,
            parentId,
            index + offset,
            component,
          );
        });

        return next;
      });

      setSelectedTemplateId(null);
    },
    [commitHistory, setSelectedTemplateId, templates],
  );

  const selectTemplate = useCallback(
    (templateId: string) => {
      setSelectedTemplateId(templateId);
    },
    [setSelectedTemplateId],
  );

  const handleTemplateDragStart = useCallback(
    (event: DragEvent<HTMLElement>, templateId: string) => {
      setSelectedTemplateId(templateId);

      event.dataTransfer.effectAllowed = "copy";

      event.dataTransfer.setData(
        "application/x-pagebuilder-template",
        JSON.stringify({
          type: "template",
          templateId,
        }),
      );
    },
    [setSelectedTemplateId],
  );

  const getTemplateDropData = useCallback((event: DragEvent<HTMLElement>) => {
    const raw = event.dataTransfer.getData(
      "application/x-pagebuilder-template",
    );

    if (!raw) {
      return null;
    }

    try {
      const data = JSON.parse(raw) as {
        type?: string;
        templateId?: string;
      };

      if (data.type !== "template" || !data.templateId) {
        return null;
      }

      return {
        templateId: data.templateId,
      };
    } catch {
      return null;
    }
  }, []);

  const dropTemplate = useCallback(
    (event: DragEvent<HTMLElement>, parentId: string | null, index: number) => {
      const data = getTemplateDropData(event);

      if (!data) {
        return false;
      }

      event.preventDefault();
      event.stopPropagation();

      insertTemplate(data.templateId, parentId, index);

      return true;
    },
    [getTemplateDropData, insertTemplate],
  );

  return {
    selectTemplate,
    insertTemplate,
    handleTemplateDragStart,
    dropTemplate,
  };
};
