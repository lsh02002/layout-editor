import { useCallback, useState, type CSSProperties } from "react";

import type {
  ComponentType,
  LayoutComponent,
  LinkType,
} from "../../../types/types";

export type EditTab = "basic" | "style" | "css";

export const useEditComponentForm = () => {
  const [editingComponentId, setEditingComponentId] = useState<string | null>(
    null,
  );

  const [editType, setEditType] = useState<ComponentType>("textarea");

  const [editTitle, setEditTitle] = useState("");

  const [editValue, setEditValue] = useState("");

  const [editPlaceholder, setEditPlaceholder] = useState("");

  const [editDirection, setEditDirection] = useState<"row" | "column">(
    "column",
  );

  const [editDisabled, setEditDisabled] = useState(false);

  const [editStyle, setEditStyle] = useState<CSSProperties>({});

  const [editContentStyle, setEditContentStyle] = useState<CSSProperties>({});

  const [editCustomCss, setEditCustomCss] = useState("");

  const [editTab, setEditTab] = useState<EditTab>("basic");

  const [editImageUrl, setEditImageUrl] = useState("");

  const [editImagePreviewUrl, setEditImagePreviewUrl] = useState("");

  const [editLinkType, setEditLinkType] = useState<LinkType>("url");

  const [editLinkNewWindow, setEditLinkNewWindow] = useState(false);

  const [editComponentName, setEditComponentName] = useState("");

  const [editHeadingLevel, setEditHeadingLevel] = useState<
    1 | 2 | 3 | 4 | 5 | 6
  >(2);

  const loadComponentToEdit = useCallback((component: LayoutComponent) => {
    setEditingComponentId(component.id);

    setEditComponentName(component.name ?? "");

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

    setEditTab("basic");

    setEditDisabled(
      "disabled" in component.props
        ? (component.props.disabled ?? false)
        : false,
    );

    setEditImageUrl("");
    setEditImagePreviewUrl("");

    setEditLinkType("url");
    setEditLinkNewWindow(false);
    setEditHeadingLevel(2);

    switch (component.type) {
      case "button": {
        setEditTitle(component.props.title ?? "");
        setEditValue("");
        setEditPlaceholder("");
        setEditDirection("column");
        break;
      }

      case "heading": {
        setEditTitle("");
        setEditValue(component.props.text ?? "");
        setEditPlaceholder("");
        setEditDirection("column");
        setEditHeadingLevel(component.props.level);
        break;
      }

      case "textarea": {
        setEditTitle("");
        setEditValue(component.props.value ?? "");
        setEditPlaceholder(component.props.placeholder ?? "");
        setEditDirection("column");
        break;
      }

      case "quill": {
        setEditTitle("");
        setEditValue(component.props.value ?? "");
        setEditPlaceholder(component.props.placeholder ?? "");
        setEditDirection("column");
        break;
      }

      case "container": {
        setEditTitle("");
        setEditValue("");
        setEditPlaceholder("");
        setEditDirection(component.props.direction ?? "column");
        break;
      }

      case "image": {
        setEditTitle("");
        setEditValue("");
        setEditPlaceholder("");
        setEditDirection("column");

        const existingUrl = component.props.urls?.[0] ?? "";

        setEditImageUrl(existingUrl);
        setEditImagePreviewUrl(existingUrl);
        break;
      }

      case "scrollToTopButton": {
        setEditTitle(component.props.title ?? "");
        setEditValue("");
        setEditPlaceholder("");
        setEditDirection("column");
        break;
      }

      case "link": {
        setEditTitle(component.props.title ?? "");
        setEditValue(component.props.value ?? "");
        setEditPlaceholder("");
        setEditDirection("column");

        setEditLinkType(component.props.linkType ?? "url");

        setEditLinkNewWindow(component.props.newWindow ?? false);
        break;
      }
    }
  }, []);

  return {
    editingComponentId,
    setEditingComponentId,
    editType,
    setEditType,
    editTitle,
    setEditTitle,
    editValue,
    setEditValue,
    editPlaceholder,
    setEditPlaceholder,
    editDirection,
    setEditDirection,
    editDisabled,
    setEditDisabled,
    editStyle,
    setEditStyle,
    editContentStyle,
    setEditContentStyle,
    editCustomCss,
    setEditCustomCss,
    editTab,
    setEditTab,
    editImageUrl,
    setEditImageUrl,
    editImagePreviewUrl,
    setEditImagePreviewUrl,
    editLinkType,
    setEditLinkType,
    editLinkNewWindow,
    setEditLinkNewWindow,
    editComponentName,
    setEditComponentName,
    editHeadingLevel,
    setEditHeadingLevel,
    loadComponentToEdit,
  };
};
