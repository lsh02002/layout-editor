import { useCallback } from "react";

import type { LayoutComponent } from "../../../../types/types";

import type {
  EditValues,
  FavoriteSetter,
  SetComponents,
} from "../../../../types/types";

type Options = {
  editValues: EditValues;
  setComponents: SetComponents;
  setFavoriteComponents: FavoriteSetter;
};

export const useEditSaveActions = ({
  editValues,
  setComponents,
  setFavoriteComponents,
}: Options) => {
  const applyEditValuesToComponent = useCallback(
    (component: LayoutComponent): LayoutComponent => {
      const {
        editTitle,
        editValue,
        editPlaceholder,
        editDirection,
        editDisabled,
        editStyle,
        editContentStyle,
        editCustomCss,
        editImageUrl,
        editLinkType,
        editLinkNewWindow,
        editComponentName,
        editHeadingLevel,

        editDividerThickness,
        editDividerColor,
        editDividerLineStyle,
        editSpacerHeight,
        editLayout,
      } = editValues;

      const common = {
        name: editComponentName.trim() || component.name,
        layout: {
          ...component.layout,
          ...editLayout,
        },
        style: {
          ...editStyle,
        },
        contentStyle: {
          ...editContentStyle,
        },
        customCss: editCustomCss,
      };

      switch (component.type) {
        case "button":
          return {
            ...component,
            ...common,
            props: {
              ...component.props,
              title: editTitle.trim() || "버튼",
              disabled: editDisabled,
            },
          };

        case "heading":
          return {
            ...component,
            ...common,
            props: {
              ...component.props,
              text: editValue.trim() || "제목",
              level: editHeadingLevel,
            },
          };

        case "textarea":
          return {
            ...component,
            ...common,
            props: {
              ...component.props,
              value: editValue,
              placeholder: editPlaceholder,
              disabled: editDisabled,
            },
          };

        case "quill":
          return {
            ...component,
            ...common,
            props: {
              ...component.props,
              value: editValue,
              placeholder: editPlaceholder,
              disabled: editDisabled,
            },
          };

        case "divider":
          return {
            ...component,
            ...common,
            props: {
              ...component.props,
              thickness: editDividerThickness,
              color: editDividerColor,
              lineStyle: editDividerLineStyle,
            },
          };

        case "spacer":
          return {
            ...component,
            ...common,
            props: {
              ...component.props,
              height: editSpacerHeight,
            },
          };

        case "container":
          return {
            ...component,
            ...common,
            props: {
              ...component.props,
              direction: editDirection,
            },
          };

        case "image":
          return {
            ...component,
            ...common,
            props: {
              ...component.props,
              urls: editImageUrl.trim() ? [editImageUrl.trim()] : [],
              maxCount: 1,
              disabled: editDisabled,
            },
          };

        case "link":
          return {
            ...component,
            ...common,
            props: {
              ...component.props,
              title: editTitle.trim() || "링크",
              value: editValue.trim(),
              linkType: editLinkType,
              newWindow: editLinkType === "url" ? editLinkNewWindow : false,
              disabled: editDisabled,
            },
          };

        case "scrollToTopButton":
          return {
            ...component,
            ...common,
            props: {
              ...component.props,
              disabled: editDisabled,
              action: {
                type: "scrollToTop",
                payload: component.props.action.payload ?? null,
              },
            },
          };
      }
    },
    [editValues],
  );

  const saveEditedComponent = useCallback(() => {
    const { editingComponentId } = editValues;

    if (!editingComponentId) {
      return;
    }

    const updateRecursive = (items: LayoutComponent[]): LayoutComponent[] =>
      items.map((component) => {
        if (component.id === editingComponentId) {
          return applyEditValuesToComponent(component);
        }

        if (component.type === "container") {
          return {
            ...component,
            children: updateRecursive(component.children),
          };
        }

        return component;
      });

    setComponents(updateRecursive);

    setFavoriteComponents((prev) =>
      prev.map((favorite) => {
        if (favorite.sourceComponentId !== editingComponentId) {
          return favorite;
        }

        const updatedComponent = applyEditValuesToComponent(favorite.component);

        return {
          ...favorite,
          name: updatedComponent.name?.trim() || updatedComponent.type,
          component: updatedComponent,
        };
      }),
    );
  }, [
    applyEditValuesToComponent,
    editValues,
    setComponents,
    setFavoriteComponents,
  ]);

  return {
    saveEditedComponent,
  };
};
