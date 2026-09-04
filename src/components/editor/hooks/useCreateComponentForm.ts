import { useCallback, useState } from "react";

import type {
  ComponentType,
  ContainerDirection,
  HeadingLevel,
  LayoutComponent,
  LinkType,
} from "../../../types/types";

import {
  createComponentFromForm,
  createDefaultComponent,
} from "../registry/componentRegistry";

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
  const [newHeadingLevel, setNewHeadingLevel] = useState<HeadingLevel>(2);

  const resetCreateForm = useCallback(() => {
    setNewType("textarea");
    setNewTitle("");
    setNewValue("");
    setNewPlaceholder("");
    setNewDirection("column");
    setNewImagePreviewUrl("");
    setNewLinkType("url");
    setNewLinkNewWindow(false);
    setNewComponentName("");
    setNewHeadingText("");
    setNewHeadingLevel(2);
  }, []);

  const makeNewComponent = useCallback((): LayoutComponent => {
    return createComponentFromForm(newType, {
      componentName: newComponentName,
      title: newTitle,
      value: newValue,
      placeholder: newPlaceholder,
      direction: newDirection,
      imagePreviewUrl: newImagePreviewUrl,
      linkType: newLinkType,
      linkNewWindow: newLinkNewWindow,
      headingText: newHeadingText,
      headingLevel: newHeadingLevel,
    });
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

  const makeComponentByType = useCallback(
    (type: ComponentType): LayoutComponent => {
      return createDefaultComponent(type);
    },
    [],
  );

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
    makeComponentByType,
  };
};
