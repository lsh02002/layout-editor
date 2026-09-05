import { useCallback, useMemo } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { ComponentLayout, LayoutComponent } from "../../../types/types";
import { useEditorConfig } from "../../../context/usehooks";
import {
  containsComponent,
  findComponentRecursive,
} from "../utils/componentTree";
import { getComponentDisplayName } from "../utils/componentDisplayName";

type PositionParentOption = {
  id: string;
  label: string;
  disabled?: boolean;
};

type Props = {
  components: LayoutComponent[];
  selectedComponentIds: string[];
  setEditLayout: Dispatch<SetStateAction<ComponentLayout>>;
  updateLayout: (id: string, layout: Partial<ComponentLayout>) => void;
};

export function usePositionParent({
  components,
  selectedComponentIds,
  setEditLayout,
  updateLayout,
}: Props) {
  const { components: componentRegistry } = useEditorConfig();
  const primarySelectedId = selectedComponentIds.at(-1) ?? null;

  const positionParentOptions = useMemo<PositionParentOption[]>(() => {
    if (!primarySelectedId) {
      return [];
    }

    const selected = findComponentRecursive(components, primarySelectedId);

    if (!selected) {
      return [];
    }

    const result: PositionParentOption[] = [];

    const walk = (items: LayoutComponent[], depth = 0) => {
      items.forEach((component) => {
        if (
          component.id !== selected.id &&
          !containsComponent(selected, component.id)
        ) {
          result.push({
            id: component.id,
            label: `${"　".repeat(depth)}${getComponentDisplayName(
              componentRegistry,
              component,
            )}`,
          });
        }

        if (component.type === "container") {
          walk(component.children, depth + 1);
        }
      });
    };

    walk(components);

    return result;
  }, [componentRegistry, components, primarySelectedId]);

  const handlePositionParentChange = useCallback(
    (positionParentId: string | null) => {
      if (!primarySelectedId) {
        return;
      }

      const nextLayout: Partial<ComponentLayout> = {
        positionParentId,
      };

      setEditLayout((prev) => ({
        ...prev,
        ...nextLayout,
      }));

      updateLayout(primarySelectedId, nextLayout);
    },
    [primarySelectedId, setEditLayout, updateLayout],
  );

  return {
    positionParentOptions,
    handlePositionParentChange,
  };
}
