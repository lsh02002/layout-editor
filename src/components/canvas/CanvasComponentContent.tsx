import { memo } from "react";
import { renderComponentCanvas } from "../editor/registry/componentRegistry";
import type { LayoutComponent } from "../../types/types";

type CanvasComponent = Exclude<LayoutComponent, { type: "container" }>;

type Props = {
  component: CanvasComponent;
};

function CanvasComponentContent({ component }: Props) {
  return <>{renderComponentCanvas(component)}</>;
}

export default memo(CanvasComponentContent);
