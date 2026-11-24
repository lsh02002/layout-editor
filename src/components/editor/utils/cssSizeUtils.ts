import {
  CSS_LENGTH_UNITS,
  type CSSLengthUnit,
  type CSSSizeMode,
} from "../../../types/types";

export const CSS_SIZE_MODES: CSSSizeMode[] = [
  "auto",
  "fill",
  "fixed",
  "min-content",
  "max-content",
  "fit-content",
];

export function isCSSLengthUnit(value: string): value is CSSLengthUnit {
  return CSS_LENGTH_UNITS.some((unit) => unit === value);
}

export function isCSSSizeMode(value: string): value is CSSSizeMode {
  return CSS_SIZE_MODES.some((mode) => mode === value);
}

export function resolveCSSSize(
  mode: CSSSizeMode = "auto",
  value?: number,
  unit: CSSLengthUnit = "px",
): string {
  switch (mode) {
    case "auto":
      return "auto";

    case "fill":
      return "100%";

    case "fixed":
      return `${value ?? 300}${unit}`;

    case "min-content":
      return "min-content";

    case "max-content":
      return "max-content";

    case "fit-content":
      return "fit-content";
  }
}
