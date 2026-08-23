import { useRef, useState, type DragEvent, type PointerEvent } from "react";

import type { LayoutComponent } from "../../../types/types";

import {
  containsComponent,
  findComponentLocation,
  findComponentRecursive,
  insertComponentRecursive,
  removeComponentRecursive,
} from "../utils/componentTree";

type DropTarget = {
  parentId: string | null;
  index: number;
  area: "canvas" | "layer";
};

type CommitHistory = (
  updater: (prev: LayoutComponent[]) => LayoutComponent[],
) => void;

type Options = {
  components: LayoutComponent[];
  layerSearch: string;
  commitHistory: CommitHistory;
};

export const useComponentDragDrop = ({
  components,
  layerSearch,
  commitHistory,
}: Options) => {
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const [activeDropTarget, setActiveDropTarget] = useState<DropTarget | null>(
    null,
  );

  const draggingIdRef = useRef<string | null>(null);

  const pointerDragRef = useRef<{
    componentId: string | null;
    targetParentId: string | null;
    targetIndex: number | null;
  }>({
    componentId: null,
    targetParentId: null,
    targetIndex: null,
  });

  const moveComponent = (
    componentId: string,
    targetParentId: string | null,
    targetIndex: number,
  ) => {
    const sourceLocation = findComponentLocation(components, componentId);

    const draggedComponent = findComponentRecursive(components, componentId);

    if (!sourceLocation || !draggedComponent) {
      return;
    }

    if (
      targetParentId !== null &&
      containsComponent(draggedComponent, targetParentId)
    ) {
      return;
    }

    let adjustedTargetIndex = targetIndex;

    if (
      sourceLocation.parentId === targetParentId &&
      sourceLocation.index < targetIndex
    ) {
      adjustedTargetIndex -= 1;
    }

    if (
      sourceLocation.parentId === targetParentId &&
      sourceLocation.index === adjustedTargetIndex
    ) {
      return;
    }

    commitHistory((prev) => {
      const removedResult = removeComponentRecursive(prev, componentId);

      if (!removedResult.removed) {
        return prev;
      }

      return insertComponentRecursive(
        removedResult.items,
        targetParentId,
        adjustedTargetIndex,
        removedResult.removed,
      );
    });
  };

  const handleDragStart = (
    event: DragEvent<HTMLElement>,
    componentId: string,
  ) => {
    draggingIdRef.current = componentId;
    setDraggingId(componentId);

    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", componentId);
  };

  const handleDragEnd = () => {
    draggingIdRef.current = null;
    setDraggingId(null);
    setActiveDropTarget(null);
  };

  const handlePointerDragStart = (
    event: PointerEvent<HTMLElement>,
    componentId: string,
  ) => {
    if (layerSearch) {
      return;
    }

    if (event.pointerType === "mouse") {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    event.currentTarget.setPointerCapture(event.pointerId);

    pointerDragRef.current = {
      componentId,
      targetParentId: null,
      targetIndex: null,
    };

    setDraggingId(componentId);
  };

  const handlePointerDragMove = (event: PointerEvent<HTMLElement>) => {
    const componentId = pointerDragRef.current.componentId;

    if (!componentId) {
      return;
    }

    if (event.pointerType === "mouse") {
      return;
    }

    event.preventDefault();

    const element = document.elementFromPoint(event.clientX, event.clientY);

    const dropZone = element?.closest<HTMLElement>('[data-drop-zone="true"]');

    if (!dropZone) {
      pointerDragRef.current.targetParentId = null;
      pointerDragRef.current.targetIndex = null;

      setActiveDropTarget(null);
      return;
    }

    const parentValue = dropZone.dataset.dropParent;

    const indexValue = dropZone.dataset.dropIndex;

    const area = dropZone.dataset.dropArea === "layer" ? "layer" : "canvas";

    if (indexValue === undefined) {
      return;
    }

    const parentId = parentValue === "root" ? null : (parentValue ?? null);

    const index = Number(indexValue);

    if (!Number.isFinite(index)) {
      return;
    }

    pointerDragRef.current.targetParentId = parentId;

    pointerDragRef.current.targetIndex = index;

    setActiveDropTarget({
      parentId,
      index,
      area,
    });
  };

  const handlePointerDragEnd = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType === "mouse") {
      return;
    }

    const { componentId, targetParentId, targetIndex } = pointerDragRef.current;

    if (componentId && targetIndex !== null) {
      moveComponent(componentId, targetParentId, targetIndex);
    }

    pointerDragRef.current = {
      componentId: null,
      targetParentId: null,
      targetIndex: null,
    };

    draggingIdRef.current = null;
    setDraggingId(null);
    setActiveDropTarget(null);
  };

  const handlePointerDragCancel = () => {
    pointerDragRef.current = {
      componentId: null,
      targetParentId: null,
      targetIndex: null,
    };

    draggingIdRef.current = null;
    setDraggingId(null);
    setActiveDropTarget(null);
  };

  const handleDrop = (
    event: DragEvent<HTMLElement>,
    parentId: string | null,
    index: number,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    const draggedId =
      event.dataTransfer.getData("text/plain") || draggingIdRef.current;

    if (!draggedId) {
      return;
    }

    moveComponent(draggedId, parentId, index);

    draggingIdRef.current = null;
    setDraggingId(null);
    setActiveDropTarget(null);
  };

  return {
    draggingId,
    activeDropTarget,
    setActiveDropTarget,
    moveComponent,
    handleDragStart,
    handleDragEnd,
    handlePointerDragStart,
    handlePointerDragMove,
    handlePointerDragEnd,
    handlePointerDragCancel,
    handleDrop,
  };
};
