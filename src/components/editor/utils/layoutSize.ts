import type { ComponentLayout, SizeMode } from "../../../types/types";

export function resolveSize(
  mode: SizeMode | undefined,
  value: number | string | undefined,
): number | string | undefined {
  switch (mode) {
    case "fill":
      return "100%";

    case "fixed":
      return value;

    case "auto":
      return "auto";

    default:
      // 기존 데이터 호환
      return "100%";
  }
}

export function resolveWidth(layout?: ComponentLayout) {
  return resolveSize(layout?.widthMode, layout?.width);
}

export function resolveHeight(layout?: ComponentLayout) {
  return resolveSize(layout?.heightMode, layout?.height);
}
