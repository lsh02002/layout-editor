import type { AutoSaveData, LayoutComponent } from "../types/types";
import { AUTOSAVE_KEY } from "../types/types";

export const getAutoSaveSnapshot = (
  components: LayoutComponent[],
  css: string,
) => JSON.stringify({ components, projectCustomCss: css });

export const readAutoSaveData = (): AutoSaveData | null => {
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const value = parsed as Partial<AutoSaveData>;
    if (value.version !== 1 || !Array.isArray(value.components)) return null;
    return {
      version: 1,
      savedAt:
        typeof value.savedAt === "string"
          ? value.savedAt
          : new Date().toISOString(),
      components: value.components,
      projectCustomCss:
        typeof value.projectCustomCss === "string"
          ? value.projectCustomCss
          : "",
    };
  } catch (error) {
    console.error("자동 저장본 읽기 실패:", error);
    return null;
  }
};
