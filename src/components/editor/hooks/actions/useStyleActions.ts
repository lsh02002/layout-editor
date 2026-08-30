import { useCallback } from "react";
import type { CSSProperties } from "react";

import type { SetComponents } from "../../../../types/types";
import { updateComponentRecursive } from "../../utils/componentTree";

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

      setComponents((items) =>
        updateComponentRecursive(items, selectedComponentId, (component) => ({
          ...component,
          [target]: {
            ...component[target],
            [key]: value,
          },
        })),
      );
    },
    [selectedComponentId, setComponents],
  );

  return {
    handleStyleApply,
  };
};
