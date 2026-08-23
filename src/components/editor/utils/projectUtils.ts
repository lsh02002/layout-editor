import {
  AUTOSAVE_KEY,
  type AutoSaveData,
  type LayoutComponent,
} from "../../../types/types";

export const compressImageUrl = async (
  src: string,
  maxWidth = 1600,
  maxHeight = 1600,
  quality = 0.8,
): Promise<string> =>
  new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      let width = img.naturalWidth;
      let height = img.naturalHeight;

      const ratio = Math.min(maxWidth / width, maxHeight / height, 1);

      width = Math.round(width * ratio);
      height = Math.round(height * ratio);

      const canvas = document.createElement("canvas");

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Canvas context를 생성할 수 없습니다."));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      try {
        resolve(canvas.toDataURL("image/webp", quality));
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error("이미지를 불러올 수 없습니다."));
    };

    img.src = src;
  });

export const convertComponentsForSave = async (
  items: LayoutComponent[],
): Promise<LayoutComponent[]> =>
  Promise.all(
    items.map(async (component) => {
      if (component.type === "image") {
        let exportImageUrl = component.props.urls?.[0] ?? "";

        if (exportImageUrl) {
          try {
            exportImageUrl = await compressImageUrl(
              exportImageUrl,
              1600,
              1600,
              0.8,
            );
          } catch (error) {
            console.error("이미지 압축 실패:", error);
            exportImageUrl = component.props.urls?.[0] ?? "";
          }
        }

        return {
          ...component,
          props: {
            ...component.props,
            urls: exportImageUrl ? [exportImageUrl] : [],
            maxCount: 1,
          },
        };
      }

      if (component.type === "container") {
        return {
          ...component,
          children: await convertComponentsForSave(component.children),
        };
      }

      return component;
    }),
  );

export const getAutoSaveSnapshot = (
  components: LayoutComponent[],
  css: string,
): string =>
  JSON.stringify({
    components,
    projectCustomCss: css,
  });

export const readAutoSaveData = (): AutoSaveData | null => {
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY);

    if (!raw) {
      return null;
    }

    const parsed: unknown = JSON.parse(raw);

    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    const value = parsed as Partial<AutoSaveData>;

    if (value.version !== 1 || !Array.isArray(value.components)) {
      return null;
    }

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

export const downloadProjectFile = async (
  components: LayoutComponent[],
  projectCustomCss: string,
  setAutoSaveBaseline: (value: string) => void,
): Promise<void> => {
  try {
    const savedComponents = await convertComponentsForSave(components);

    const projectData = {
      version: 1,
      components: savedComponents,
      projectCustomCss,
      savedAt: new Date().toISOString(),
    };

    const json = JSON.stringify(projectData, null, 2);

    const blob = new Blob([json], {
      type: "application/json;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = "page-builder-project.json";

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(url);
    localStorage.removeItem(AUTOSAVE_KEY);

    setAutoSaveBaseline(getAutoSaveSnapshot(components, projectCustomCss));
  } catch (error) {
    console.error("프로젝트 저장 실패:", error);
    alert("프로젝트 저장 중 오류가 발생했습니다.");
    throw error;
  }
};
