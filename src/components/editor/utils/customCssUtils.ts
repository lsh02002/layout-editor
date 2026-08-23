import type { LayoutComponent } from "../../../types/types";

export const buildComponentCustomCss = (component: LayoutComponent): string => {
  const css = component.customCss?.trim();

  if (!css) {
    return "";
  }

  const selector = `[data-component-id="${component.id}"]`;

  return css.replaceAll("&", selector);
};

export const collectComponentCustomCss = (items: LayoutComponent[]): string =>
  items
    .flatMap((component) => {
      const own = buildComponentCustomCss(component);

      if (component.type === "container") {
        return [own, collectComponentCustomCss(component.children)];
      }

      return [own];
    })
    .filter(Boolean)
    .join("\n\n");
