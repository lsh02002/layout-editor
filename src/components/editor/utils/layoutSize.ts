import type {
  ComponentLayout,
  SizeMode,
  CSSLengthUnit,
} from "../../../types/types";

export function resolveSize(
  mode: SizeMode | undefined,
  value: number | string | undefined,
  unit: CSSLengthUnit = "px",
): number | string | undefined {
  switch (mode) {
    case "fill":
      return "100%";

    case "fixed":
      if (typeof value === "number") {
        return `${value}${unit}`;
      }

      return value;

    case "auto":
      return "auto";

    case "min-content":
      return "min-content";

    case "max-content":
      return "max-content";

    case "fit-content":
      return "fit-content";

    default:
      return "100%";
  }
}

export function resolveWidth(layout?: ComponentLayout) {
  return resolveSize(
    layout?.widthMode,
    layout?.width,
    layout?.widthUnit ?? "px",
  );
}

export function resolveHeight(layout?: ComponentLayout) {
  return resolveSize(
    layout?.heightMode,
    layout?.height,
    layout?.heightUnit ?? "px",
  );
}
