import { useCallback } from "react";
import type { CSSProperties } from "react";

import type { SetComponents } from "../../../../types/types";
import { updateComponentRecursive } from "../../utils/componentTree";

type Options = {
  selectedComponentIds: string[];
  setComponents: SetComponents;
};

export const useStyleActions = ({
  selectedComponentIds,
  setComponents,
}: Options) => {
  const primarySelectedId = selectedComponentIds.at(-1) ?? null;

  const handleStyleApply = useCallback(
    (
      target: "style" | "contentStyle",
      key: keyof CSSProperties,
      value: CSSProperties[keyof CSSProperties],
    ) => {
      if (!primarySelectedId) {
        return;
      }

      setComponents((items) =>
        updateComponentRecursive(items, primarySelectedId, (component) => ({
          ...component,
          [target]: {
            ...component[target],
            [key]: value,
          },
        })),
      );
    },
    [primarySelectedId, setComponents],
  );

  return {
    handleStyleApply,
  };
};
