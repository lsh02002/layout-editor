import { useEffect, useRef } from "react";

import type { LayoutComponent, CommitHistory } from "../../../types/types";

import {
  cloneComponent,
  findComponentLocation,
  findComponentRecursive,
  insertComponentRecursive,
  normalizeOrder,
} from "../utils/componentTree";

type Options = {
  components: LayoutComponent[];
  selectedComponentIds: string[];
  commitHistory: CommitHistory;
  setSelectedComponentIds: React.Dispatch<React.SetStateAction<string[]>>;
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

const removeSelectedComponents = (
  items: LayoutComponent[],
  selectedIds: Set<string>,
): LayoutComponent[] => {
  return items
    .filter((component) => !selectedIds.has(component.id))
    .map((component) => {
      if (component.type !== "container") {
        return component;
      }

      return {
        ...component,
        children: removeSelectedComponents(component.children, selectedIds),
      };
    })
    .map((component, index) => ({
      ...component,
      order: index,
    }));
};

export const useEditorShortcuts = ({
  components,
  selectedComponentIds,
  commitHistory,
  setSelectedComponentIds,
}: Options) => {
  const primarySelectedId = selectedComponentIds.at(-1) ?? null;

  const copiedComponentsRef = useRef<LayoutComponent[]>([]);

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
        const ids = selectedComponentIds;

        if (ids.length === 0) {
          return;
        }

        const selectedSet = new Set(ids);

        const topLevelIds = ids.filter((id) => {
          const location = findComponentLocation(components, id);
          let parentId = location?.parentId ?? null;
          while (parentId) {
            if (selectedSet.has(parentId)) {
              return false;
            }
            const parentLocation = findComponentLocation(components, parentId);
            parentId = parentLocation?.parentId ?? null;
          }
          return true;
        });

        const orderMap = new Map<string, number>();
        let order = 0;
        const walk = (items: LayoutComponent[]) => {
          const sorted = [...items].sort((a, b) => a.order - b.order);

          for (const component of sorted) {
            orderMap.set(component.id, order++);

            if (component.type === "container") {
              walk(component.children);
            }
          }
        };

        walk(components);

        topLevelIds.sort(
          (a, b) => (orderMap.get(a) ?? 0) - (orderMap.get(b) ?? 0),
        );

        const copied = topLevelIds
          .map((id) => findComponentRecursive(components, id))
          .filter((component): component is LayoutComponent =>
            Boolean(component),
          )
          .map((component) => structuredClone(component));
        if (copied.length === 0) {
          return;
        }
        event.preventDefault();
        copiedComponentsRef.current = copied;
        return;
      }

      const copied = copiedComponentsRef.current;

      if (copied.length === 0) {
        return;
      }

      event.preventDefault();

      const clones = copied.map((component) => cloneComponent(component));
      const newIds = clones.map((component) => component.id);

      if (!primarySelectedId) {
        commitHistory((prev) => normalizeOrder([...prev, ...clones]));
        setSelectedComponentIds(newIds);
        return;
      }

      const selected = findComponentRecursive(components, primarySelectedId);

      if (selected && selected.type === "container") {
        commitHistory((prev) => {
          let next = prev;

          clones.forEach((clone, offset) => {
            next = insertComponentRecursive(
              next,
              selected.id,
              selected.children.length + offset,
              clone,
            );
          });
          return next;
        });
        setSelectedComponentIds(newIds);
        return;
      }

      const location = findComponentLocation(components, primarySelectedId);

      if (!location) {
        return;
      }

      commitHistory((prev) => {
        let next = prev;
        clones.forEach((clone, offset) => {
          next = insertComponentRecursive(
            next,
            location.parentId,
            location.index + 1 + offset,
            clone,
          );
        });

        return next;
      });

      setSelectedComponentIds(newIds);
    };

    window.addEventListener("keydown", handleClipboardShortcut);

    return () => {
      window.removeEventListener("keydown", handleClipboardShortcut);
    };
  }, [
    commitHistory,
    components,
    primarySelectedId,
    selectedComponentIds,
    setSelectedComponentIds,
  ]);

  useEffect(() => {
    const handleDeleteKey = (event: KeyboardEvent) => {
      if (event.key !== "Delete" && event.key !== "Backspace") {
        return;
      }

      if (isTextEditingTarget(event.target)) {
        return;
      }

      event.preventDefault();

      if (event.repeat) {
        return;
      }

      const ids = selectedComponentIds;

      if (ids.length === 0) {
        return;
      }

      const selectedSet = new Set(ids);
      commitHistory((prev) => removeSelectedComponents(prev, selectedSet));
      setSelectedComponentIds([]);
    };

    window.addEventListener("keydown", handleDeleteKey);

    return () => {
      window.removeEventListener("keydown", handleDeleteKey);
    };
  }, [commitHistory, selectedComponentIds, setSelectedComponentIds]);
};
