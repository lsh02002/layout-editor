import { useCallback, useState } from "react";

import type {
  ComponentType,
  ContainerDirection,
  LayoutComponent,
  LinkType,
} from "../../../types/types";

export const useCreateComponentForm = () => {
  const [newType, setNewType] = useState<ComponentType>("textarea");

  const [newTitle, setNewTitle] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newPlaceholder, setNewPlaceholder] = useState("");

  const [newDirection, setNewDirection] =
    useState<ContainerDirection>("column");

  const [newImagePreviewUrl, setNewImagePreviewUrl] = useState("");

  const [newLinkType, setNewLinkType] = useState<LinkType>("url");

  const [newLinkNewWindow, setNewLinkNewWindow] = useState(false);

  const [newComponentName, setNewComponentName] = useState("");

  const [newHeadingText, setNewHeadingText] = useState("");

  const [newHeadingLevel, setNewHeadingLevel] = useState<1 | 2 | 3 | 4 | 5 | 6>(
    2,
  );

  const resetCreateForm = useCallback(() => {
    setNewType("textarea");
    setNewComponentName("");
    setNewTitle("");
    setNewValue("");
    setNewPlaceholder("");
    setNewDirection("column");
    setNewImagePreviewUrl("");
    setNewLinkType("url");
    setNewLinkNewWindow(false);
    setNewHeadingText("");
    setNewHeadingLevel(2);
  }, []);

  const makeNewComponent = useCallback((): LayoutComponent => {
    const id = crypto.randomUUID();

    switch (newType) {
      case "button":
        return {
          id,
          name: newComponentName.trim() || "Button",
          type: "button",
          order: 0,
          props: {
            title: newTitle.trim() || "버튼",
            disabled: false,
            action: {
              type: "none",
              payload: null,
            },
          },
          style: {
            width: "100%",
          },
        };

      case "scrollToTopButton":
        return {
          id,
          name: newComponentName.trim() || "ScrollToTopButton",
          type: "scrollToTopButton",
          order: 0,
          props: {
            title: newTitle.trim() || "↑",
            disabled: false,
            action: {
              type: "scrollToTop",
              payload: null,
            },
          },
          style: {
            position: "fixed",
            width: "50px",
            height: "50px",
            right: "10px",
            bottom: "10px",
            zIndex: 1400,
          },
        };

      case "heading":
        return {
          id,
          name: newComponentName.trim() || "제목",
          type: "heading",
          order: 0,
          props: {
            text: newHeadingText.trim() || "제목을 입력하세요",
            level: newHeadingLevel,
          },
          style: {
            width: "100%",
          },
          contentStyle: {
            margin: 0,
          },
        };

      case "textarea":
        return {
          id,
          name: newComponentName.trim() || "Textarea",
          type: "textarea",
          order: 0,
          props: {
            value: newValue,
            rows: 3,
            placeholder: newPlaceholder.trim() || "내용을 입력하세요.",
            disabled: false,
          },
          style: {
            width: "100%",
          },
        };

      case "quill":
        return {
          id,
          name: newComponentName.trim() || "RichText",
          type: "quill",
          order: 0,
          props: {
            value: newValue,
            placeholder: newPlaceholder.trim() || "본문을 입력하세요.",
            disabled: false,
          },
          style: {
            width: "100%",
          },
        };

      case "image":
        return {
          id,
          name: newComponentName.trim() || "Image",
          type: "image",
          order: 0,
          props: {
            urls: newImagePreviewUrl ? [newImagePreviewUrl] : [],
            maxCount: 1,
            disabled: false,
          },
          style: {
            width: "100%",
          },
        };

      case "link":
        return {
          id,
          name: newComponentName.trim() || "Link",
          type: "link",
          order: 0,
          props: {
            title: newTitle.trim() || "링크",
            linkType: newLinkType,
            value: newValue.trim(),
            newWindow: newLinkType === "url" ? newLinkNewWindow : false,
            disabled: false,
          },
          style: {
            width: "100%",
          },
          contentStyle: {
            color: "#0d6efd",
            textDecoration: "underline",
            cursor: "pointer",
          },
        };

      case "container":
        return {
          id,
          name: newComponentName.trim() || "Container",
          type: "container",
          order: 0,
          props: {
            direction: newDirection,
            gap: 8,
          },
          style: {
            width: "100%",
            minHeight: 100,
            padding: 12,
            border: "1px dashed #adb5bd",
          },
          children: [],
        };
    }
  }, [
    newType,
    newComponentName,
    newTitle,
    newValue,
    newPlaceholder,
    newDirection,
    newImagePreviewUrl,
    newLinkType,
    newLinkNewWindow,
    newHeadingText,
    newHeadingLevel,
  ]);

  return {
    newType,
    setNewType,
    newTitle,
    setNewTitle,
    newValue,
    setNewValue,
    newPlaceholder,
    setNewPlaceholder,
    newDirection,
    setNewDirection,
    newImagePreviewUrl,
    setNewImagePreviewUrl,
    newLinkType,
    setNewLinkType,
    newLinkNewWindow,
    setNewLinkNewWindow,
    newComponentName,
    setNewComponentName,
    newHeadingText,
    setNewHeadingText,
    newHeadingLevel,
    setNewHeadingLevel,
    resetCreateForm,
    makeNewComponent,
  };
};
