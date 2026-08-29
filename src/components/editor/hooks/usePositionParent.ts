import { useCallback, useMemo } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { ComponentLayout, LayoutComponent } from "../../../types/types";
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
  selectedComponentId: string | null;
  setEditLayout: Dispatch<SetStateAction<ComponentLayout>>;
  updateLayout: (id: string, layout: Partial<ComponentLayout>) => void;
};

export function usePositionParent({
  components,
  selectedComponentId,
  setEditLayout,
  updateLayout,
}: Props) {
  const positionParentOptions = useMemo<PositionParentOption[]>(() => {
    if (!selectedComponentId) {
      return [];
    }

    const selected = findComponentRecursive(components, selectedComponentId);

    if (!selected) {
      return [];
    }

    const result: PositionParentOption[] = [];

    const walk = (items: LayoutComponent[], depth = 0) => {
      items.forEach((component) => {
        if (!containsComponent(selected, component.id)) {
          result.push({
            id: component.id,
            label: `${"　".repeat(depth)}${getComponentDisplayName(component)}`,
            disabled: component.type === "container",
          });
        }

        if (component.type === "container") {
          walk(component.children, depth + 1);
        }
      });
    };

    walk(components);

    return result;
  }, [components, selectedComponentId]);

  const handlePositionParentChange = useCallback(
    (positionParentId: string | null) => {
      if (!selectedComponentId) {
        return;
      }

      const nextLayout: Partial<ComponentLayout> = {
        positionParentId,
      };

      setEditLayout((prev) => ({
        ...prev,
        ...nextLayout,
      }));

      updateLayout(selectedComponentId, nextLayout);
    },
    [selectedComponentId, setEditLayout, updateLayout],
  );

  return {
    positionParentOptions,
    handlePositionParentChange,
  };
}
