import { memo } from "react";
import { renderComponentCanvas } from "../editor/registry/componentRegistry";
import type { LayoutComponent } from "../../types/types";
import { useEditorConfig } from "../../context/usehooks";

type CanvasComponent = Exclude<LayoutComponent, { type: "container" }>;

type Props = {
  component: CanvasComponent;
};

function CanvasComponentContent({ component }: Props) {
  const { components: componentRegistry } = useEditorConfig();
  return <>{renderComponentCanvas(componentRegistry, component)}</>;
}

export default memo(CanvasComponentContent);
