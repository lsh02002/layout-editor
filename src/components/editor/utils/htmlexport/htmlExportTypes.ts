import type {
  LayoutComponent,
} from "../../../../types/types";

export type HtmlExportContext = {
  renderComponent: (
    component: LayoutComponent,
  ) => Promise<string>;
};

export type HtmlExporter = (
  component: LayoutComponent,
  context: HtmlExportContext,
) => string | Promise<string>;