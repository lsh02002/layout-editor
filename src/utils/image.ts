import type { LayoutComponent } from "../types/types";

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
      if (!ctx)
        return reject(new Error("Canvas context를 생성할 수 없습니다."));
      ctx.drawImage(img, 0, 0, width, height);
      try {
        resolve(canvas.toDataURL("image/webp", quality));
      } catch (error) {
        reject(error);
      }
    };
    img.onerror = () => reject(new Error("이미지를 불러올 수 없습니다."));
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
            exportImageUrl = await compressImageUrl(exportImageUrl);
          } catch (error) {
            console.error("이미지 압축 실패:", error);
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
