import { useCallback, type DragEvent } from "react";

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
  const handleNativeDragStart = useCallback(
    (event: DragEvent<HTMLElement>, componentId: string) => {
      const nextDraggingIds = selectedComponentIds.includes(componentId)
        ? selectedComponentIds
        : [componentId];

      onDragStart(event, componentId);

      requestAnimationFrame(() => {
        nextDraggingIds.forEach((id) => {
          document
            .querySelectorAll<HTMLElement>(`[data-component-id="${id}"]`)
            .forEach((element) => {
              element.style.opacity = "0.4";
            });
        });
      });
    },
    [onDragStart, selectedComponentIds],
  );

  const handleNativeDragEnd = useCallback(() => {
    document
      .querySelectorAll<HTMLElement>("[data-component-id]")
      .forEach((element) => {
        element.style.opacity = "";
      });

    onDragEnd();
  }, [onDragEnd]);

  return {
    handleNativeDragStart,
    handleNativeDragEnd,
  };
};
