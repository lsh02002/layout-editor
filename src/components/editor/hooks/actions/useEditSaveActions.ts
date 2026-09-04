import { useCallback } from "react";

import type { LayoutComponent, SetComponents } from "../../../../types/types";
import { updateComponentRecursive } from "../../utils/componentTree";

type Options = {
  draftComponent: LayoutComponent | null;
  setComponents: SetComponents;
};

export const useEditSaveActions = ({
  draftComponent,
  setComponents,
}: Options) => {
  const saveEditedComponent = useCallback(() => {
    if (!draftComponent) {
      return;
    }

    setComponents((prev) =>
      updateComponentRecursive(prev, draftComponent.id, () => draftComponent),
    );
  }, [draftComponent, setComponents]);

  return {
    saveEditedComponent,
  };
};
