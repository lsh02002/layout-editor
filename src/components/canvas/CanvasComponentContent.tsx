import { memo } from "react";
import { renderComponentCanvas } from "../editor/registry/componentRegistry";
import type { CanvasComponent } from "../../types/types";
import { useEditorConfig } from "../../context/usehooks";

type Props = {
  component: CanvasComponent;
};

function CanvasComponentContent({ component }: Props) {
  const { components: componentRegistry } = useEditorConfig();
  return <>{renderComponentCanvas(componentRegistry, component)}</>;
}

export default memo(CanvasComponentContent);
