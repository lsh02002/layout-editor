import { useEffect, useRef } from "react";

import type { LayoutComponent, CommitHistory } from "../../../types/types";

import {
  cloneComponent,
  findComponentLocation,
  findComponentRecursive,
  insertComponentRecursive,
  normalizeOrder,
  removeComponentRecursive,
} from "../utils/componentTree";

type Options = {
  components: LayoutComponent[];
  selectedComponentId: string | null;
  commitHistory: CommitHistory;
  setSelectedComponentId: (id: string | null) => void;
};

const isTextEditingTarget = (target: EventTarget | null) => {
  const element = target as HTMLElement | null;

  if (!element) {
    return false;
  }

  const tag = element.tagName.toLowerCase();

  return (
    tag === "input" ||
    tag === "textarea" ||
    tag === "select" ||
    element.isContentEditable ||
    !!element.closest(".ql-editor")
  );
};

export const useEditorShortcuts = ({
  components,
  selectedComponentId,
  commitHistory,
  setSelectedComponentId,
}: Options) => {
  const copiedComponentRef = useRef<LayoutComponent | null>(null);

  useEffect(() => {
    const handleClipboardShortcut = (event: KeyboardEvent) => {
      const ctrlOrMeta = event.ctrlKey || event.metaKey;

      if (!ctrlOrMeta) {
        return;
      }

      const key = event.key.toLowerCase();

      if (key !== "c" && key !== "v") {
        return;
      }

      if (isTextEditingTarget(event.target)) {
        return;
      }

      if (key === "c") {
        if (!selectedComponentId) {
          return;
        }

        const component = findComponentRecursive(
          components,
          selectedComponentId,
        );

        if (!component) {
          return;
        }

        event.preventDefault();

        copiedComponentRef.current = structuredClone(component);

        return;
      }

      const copied = copiedComponentRef.current;

      if (!copied) {
        return;
      }

      event.preventDefault();

      const cloned = cloneComponent(copied);

      if (!selectedComponentId) {
        commitHistory((prev) => normalizeOrder([...prev, cloned]));

        setSelectedComponentId(cloned.id);
        return;
      }

      const selected = findComponentRecursive(components, selectedComponentId);

      if (selected && selected.type === "container") {
        commitHistory((prev) =>
          insertComponentRecursive(
            prev,
            selected.id,
            selected.children.length,
            cloned,
          ),
        );

        setSelectedComponentId(cloned.id);
        return;
      }

      const location = findComponentLocation(components, selectedComponentId);

      if (!location) {
        return;
      }

      commitHistory((prev) =>
        insertComponentRecursive(
          prev,
          location.parentId,
          location.index + 1,
          cloned,
        ),
      );

      setSelectedComponentId(cloned.id);
    };

    window.addEventListener("keydown", handleClipboardShortcut);

    return () => {
      window.removeEventListener("keydown", handleClipboardShortcut);
    };
  }, [commitHistory, components, selectedComponentId, setSelectedComponentId]);

  useEffect(() => {
    const handleDeleteKey = (event: KeyboardEvent) => {
      if (event.key !== "Delete" && event.key !== "Backspace") {
        return;
      }

      if (isTextEditingTarget(event.target)) {
        return;
      }

      if (!selectedComponentId) {
        return;
      }

      event.preventDefault();

      if (event.repeat) {
        return;
      }

      const targetId = selectedComponentId;

      commitHistory((prev) => removeComponentRecursive(prev, targetId).items);

      setSelectedComponentId(null);
    };

    window.addEventListener("keydown", handleDeleteKey);

    return () => {
      window.removeEventListener("keydown", handleDeleteKey);
    };
  }, [commitHistory, selectedComponentId, setSelectedComponentId]);
};
