import { useCallback, useRef, type DragEvent } from "react";

type Options = {
  selectedComponentIds: string[];
  onDragStart: (event: DragEvent<HTMLElement>, componentId: string) => void;
  onDragEnd: () => void;
};

export const useComponentDrag = ({
  selectedComponentIds,
  onDragStart,
  onDragEnd,
}: Options) => {
  const draggingIdsRef = useRef<string[]>([]);

  const handleNativeDragStart = useCallback(
    (event: DragEvent<HTMLElement>, componentId: string) => {
      const nextDraggingIds = selectedComponentIds.includes(componentId)
        ? selectedComponentIds
        : [componentId];

      onDragStart(event, componentId);

      draggingIdsRef.current = nextDraggingIds;

      const draggingIdSet = new Set(nextDraggingIds);
      requestAnimationFrame(() => {
        nextDraggingIds.forEach((id) => {
          document
            .querySelectorAll<HTMLElement>(`[data-component-id="${id}"]`)
            .forEach((element) => {
              let parent = element.parentElement?.closest<HTMLElement>(
                "[data-component-id]",
              );

              while (parent) {
                if (draggingIdSet.has(parent.dataset.componentId ?? "")) {
                  return;
                }

                parent = parent.parentElement?.closest<HTMLElement>(
                  "[data-component-id]",
                );
              }

              element.style.opacity = "0.4";
            });
        });
      });
    },
    [onDragStart, selectedComponentIds],
  );

  const handleNativeDragEnd = useCallback(() => {
    draggingIdsRef.current.forEach((id) => {
      document
        .querySelectorAll<HTMLElement>(`[data-component-id="${id}"]`)
        .forEach((element) => {
          element.style.opacity = "";
        });
    });

    draggingIdsRef.current = [];

    onDragEnd();
  }, [onDragEnd]);

  return {
    handleNativeDragStart,
    handleNativeDragEnd,
  };
};
