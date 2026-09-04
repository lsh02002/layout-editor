import { useCallback, useState, type CSSProperties } from "react";

import type {
  ComponentLayout,
  ComponentType,
  LayoutComponent,
} from "../../../types/types";
import { updateComponentRecursive } from "../utils/componentTree";

export type EditTab = "basic" | "style" | "css";

export const useEditComponentForm = ({
  setComponents,
}: {
  setComponents: (
    updater: (components: LayoutComponent[]) => LayoutComponent[],
    recordHistory?: boolean,
  ) => void;
}) => {
  const [draftComponent, setDraftComponent] = useState<LayoutComponent | null>(
    null,
  );
  const [editType, setEditType] = useState<ComponentType>("textarea");
  const [editStyle, setEditStyle] = useState<CSSProperties>({});
  const [editContentStyle, setEditContentStyle] = useState<CSSProperties>({});
  const [editCustomCss, setEditCustomCss] = useState("");
  const [editLayout, setEditLayout] = useState<ComponentLayout>({
    position: "relative",
  });

  const loadComponentToEdit = useCallback((component: LayoutComponent) => {
    setDraftComponent(structuredClone(component));
    setEditType(component.type);
    setEditStyle(component.style ? { ...component.style } : {});
    setEditContentStyle(
      component.contentStyle
        ? {
            ...component.contentStyle,
          }
        : {},
    );

    setEditCustomCss(component.customCss ?? "");
    setEditLayout({
      position: component.layout?.position ?? "relative",
      widthMode:
        component.layout?.widthMode ??
        (component.layout?.width != null ? "fixed" : "auto"),
      heightMode:
        component.layout?.heightMode ??
        (component.layout?.height != null ? "fixed" : "auto"),
      width: component.layout?.width,
      height: component.layout?.height,
      x: component.layout?.x,
      y: component.layout?.y,
      positionParentId: component.layout?.positionParentId ?? null,
    });
  }, []);

  const resetEditForm = useCallback(() => {
    setDraftComponent(null);
    setEditType("textarea");
    setEditStyle({});
    setEditContentStyle({});
    setEditCustomCss("");
    setEditLayout({
      position: "relative",
    });
  }, []);

  const updateDraftComponent = useCallback(
    (updater: (component: LayoutComponent) => LayoutComponent) => {
      setDraftComponent((current) => {
        if (!current) {
          return current;
        }

        const next = updater(current);

        setComponents((components) =>
          updateComponentRecursive(components, next.id, () => next),
        );

        return next;
      });
    },
    [setComponents],
  );

  const editComponentName = draftComponent?.name ?? "";

  return {
    draftComponent,
    setDraftComponent,
    updateDraftComponent,
    editType,
    setEditType,
    editComponentName,
    editStyle,
    setEditStyle,
    editContentStyle,
    setEditContentStyle,
    editCustomCss,
    setEditCustomCss,
    editLayout,
    setEditLayout,
    loadComponentToEdit,
    resetEditForm,
  };
};
