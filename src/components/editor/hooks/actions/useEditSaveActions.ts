import { useCallback } from "react";

import type { LayoutComponent } from "../../../../types/types";

import type {
  EditValues,
  FavoriteSetter,
  SetComponents,
} from "../../../../types/types";
import { updateComponentRecursive } from "../../utils/componentTree";

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

        editGalleryUrls,
        editGalleryColumns,
        editGalleryGap,
        editGalleryObjectFit,
        editGalleryBorderRadius,

        editSliderUrls,
        editSliderAutoplay,
        editSliderInterval,
        editSliderShowArrows,
        editSliderShowDots,
        editSliderLoop,

        editLinkType,
        editLinkNewWindow,
        editComponentName,
        editHeadingLevel,

        editDividerThickness,
        editDividerColor,
        editDividerLineStyle,
        editSpacerHeight,

        editContainerGap,
        editContainerJustifyContent,
        editContainerAlignItems,
        editContainerMaxWidth,

        editVideoControls,
        editVideoAutoplay,
        editVideoMuted,
        editVideoLoop,

        editCodeLanguage,

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
              gap: editContainerGap,
              justifyContent: editContainerJustifyContent,
              alignItems: editContainerAlignItems,
              maxWidth: editContainerMaxWidth,
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

        case "imageGallery":
          return {
            ...component,
            ...common,
            props: {
              ...component.props,
              urls: editGalleryUrls.map((url) => url.trim()).filter(Boolean),
              columns: Math.min(12, Math.max(editGalleryColumns, 1)),
              gap: Math.max(editGalleryGap, 0),
              objectFit: editGalleryObjectFit,
              borderRadius: Math.max(editGalleryBorderRadius, 0),
            },
          };

        case "imageSlider":
          return {
            ...component,
            ...common,
            props: {
              ...component.props,
              urls: editSliderUrls.map((url) => url.trim()).filter(Boolean),
              autoplay: editSliderAutoplay,
              interval: Math.max(editSliderInterval, 500),
              showArrows: editSliderShowArrows,
              showDots: editSliderShowDots,
              loop: editSliderLoop,
            },
          };

        case "video":
          return {
            ...component,
            ...common,
            props: {
              ...component.props,
              src: editValue.trim(),
              controls: editVideoControls,
              autoplay: editVideoAutoplay,
              muted: editVideoMuted,
              loop: editVideoLoop,
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

        case "codeEditor":
          return {
            ...component,
            ...common,

            props: {
              ...component.props,
              value: editValue,
              language: editCodeLanguage,
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

    setComponents((items) =>
      updateComponentRecursive(
        items,
        editingComponentId,
        applyEditValuesToComponent,
      ),
    );

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
