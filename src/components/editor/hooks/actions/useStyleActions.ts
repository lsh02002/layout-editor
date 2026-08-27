import { useCallback } from "react";
import type { CSSProperties } from "react";

import type { LayoutComponent, SetComponents } from "../../../../types/types";

type Options = {
  selectedComponentId: string | null;
  setComponents: SetComponents;
};

export const useStyleActions = ({
  selectedComponentId,
  setComponents,
}: Options) => {
  const handleStyleApply = useCallback(
    (
      target: "style" | "contentStyle",
      key: keyof CSSProperties,
      value: CSSProperties[keyof CSSProperties],
    ) => {
      if (!selectedComponentId) {
        return;
      }

      const updateRecursive = (
        components: LayoutComponent[],
      ): LayoutComponent[] =>
        components.map((component) => {
          if (component.id === selectedComponentId) {
            return {
              ...component,
              [target]: {
                ...component[target],
                [key]: value,
              },
            };
          }

          if (component.type === "container") {
            return {
              ...component,
              children: updateRecursive(component.children),
            };
          }

          return component;
        });

      setComponents((items) => updateRecursive(items));
    },
    [selectedComponentId, setComponents],
  );

  return {
    handleStyleApply,
  };
};
