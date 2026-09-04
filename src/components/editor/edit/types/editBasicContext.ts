import type { LayoutComponent } from "../../../../types/types";

export type GalleryObjectFit = "cover" | "contain" | "fill";

export type EditBasicContext = {
  component: LayoutComponent;

  updateComponent: (
    updater: (component: LayoutComponent) => LayoutComponent,
  ) => void;
};
