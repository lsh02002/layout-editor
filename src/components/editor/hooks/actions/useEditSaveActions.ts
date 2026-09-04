import { useCallback } from "react";

import type { LayoutComponent, SetComponents } from "../../../../types/types";

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
      prev.map((component) =>
        component.id === draftComponent.id ? draftComponent : component,
      ),
    );
  }, [draftComponent, setComponents]);

  return {
    saveEditedComponent,
  };
};
