import { useCallback } from "react";
import type { ComponentLayout } from "../../../types/types";

type Options = {
  snapEnabled: boolean;
  gridSize: number;
};

export const useSnapLayout = ({ snapEnabled, gridSize }: Options) => {
  const snapNumber = (value: number, size: number) => {
    return Math.round(value / size) * size;
  };

  const snapLayout = useCallback(
    (layout: Partial<ComponentLayout>): Partial<ComponentLayout> => {
      if (!snapEnabled) {
        return layout;
      }

      const next = { ...layout };

      Object.entries(next).forEach(([key, value]) => {
        if (typeof value !== "number") {
          return;
        }

        (next as Record<string, unknown>)[key] = snapNumber(value, gridSize);
      });

      return next;
    },
    [snapEnabled, gridSize],
  );

  return {
    snapLayout,
  };
};
