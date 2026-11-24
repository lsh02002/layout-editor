import { useCallback } from "react";
import type { ComponentLayout } from "../../../types/types";

type Options = {
  snapEnabled: boolean;
  gridSize: number;
};

const snapNumber = (value: number, size: number): number => {
  return Math.round(value / size) * size;
};

export const useSnapLayout = ({ snapEnabled, gridSize }: Options) => {
  const snapLayout = useCallback(
    (layout: Partial<ComponentLayout>): Partial<ComponentLayout> => {
      if (!snapEnabled || !Number.isFinite(gridSize) || gridSize <= 0) {
        return layout;
      }

      const next = { ...layout };

      // X 좌표
      if (typeof next.x === "number" && Number.isFinite(next.x)) {
        next.x = snapNumber(next.x, gridSize);
      }

      // Y 좌표
      if (typeof next.y === "number" && Number.isFinite(next.y)) {
        next.y = snapNumber(next.y, gridSize);
      }

      // Width: Fixed + px
      if (
        next.widthMode === "fixed" &&
        (next.widthUnit ?? "px") === "px" &&
        typeof next.width === "number" &&
        Number.isFinite(next.width)
      ) {
        next.width = snapNumber(next.width, gridSize);
      }

      // Height: Fixed + px
      if (
        next.heightMode === "fixed" &&
        (next.heightUnit ?? "px") === "px" &&
        typeof next.height === "number" &&
        Number.isFinite(next.height)
      ) {
        next.height = snapNumber(next.height, gridSize);
      }

      return next;
    },
    [snapEnabled, gridSize],
  );

  return {
    snapLayout,
  };
};
