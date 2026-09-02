import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type PointerEvent,
} from "react";

import type { ComponentType, LayoutComponent } from "../../../types/types";
import type { CommitHistory } from "../../../types/types";

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

type Options = {
  components: LayoutComponent[];
  layerSearch: string;
  selectedComponentIds: string[];
  dropTemplate: (
    event: DragEvent<HTMLElement>,
    parentId: string | null,
    index: number,
  ) => boolean;
  commitHistory: CommitHistory;
  makeComponentByType: (type: ComponentType) => LayoutComponent;
  setSelectedComponentIds: React.Dispatch<React.SetStateAction<string[]>>;
};

export const useComponentDragDrop = ({
  components,
  layerSearch,
  selectedComponentIds,
  dropTemplate,
  commitHistory,
  makeComponentByType,
  setSelectedComponentIds,
}: Options) => {
  const [draggingIds, setDraggingIds] = useState<string[]>([]);

  const [droppedIds, setDroppedIds] = useState<string[]>([]);
  const dropAnimationTimerRef = useRef<number | null>(null);

  const [activeDropTarget, setActiveDropTarget] = useState<DropTarget | null>(
    null,
  );

  const pointerDragRef = useRef<{
    componentId: string | null;
    targetParentId: string | null;
    targetIndex: number | null;
  }>({
    componentId: null,
    targetParentId: null,
    targetIndex: null,
  });

  const clearDraggingState = useCallback(() => {
    setDraggingIds([]);
    setActiveDropTarget(null);
  }, []);

  const triggerDropAnimation = useCallback((componentIds: string[]) => {
    setDroppedIds(componentIds);

    if (dropAnimationTimerRef.current !== null) {
      window.clearTimeout(dropAnimationTimerRef.current);
    }

    dropAnimationTimerRef.current = window.setTimeout(() => {
      setDroppedIds([]);
      dropAnimationTimerRef.current = null;
    }, 250);
  }, []);

  useEffect(() => {
    return () => {
      if (dropAnimationTimerRef.current !== null) {
        window.clearTimeout(dropAnimationTimerRef.current);
      }
    };
  }, []);

  const moveComponent = useCallback(
    (
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
    },
    [components, commitHistory],
  );

  const moveComponents = useCallback(
    (
      componentIds: string[],
      targetParentId: string | null,
      targetIndex: number,
    ) => {
      if (componentIds.length === 0) {
        return;
      }

      const selectedSet = new Set(componentIds);

      // 선택된 부모 안에 들어있는 선택 자식은 제외
      // 부모가 이동하면 자식도 같이 이동되므로 중복 방지
      const topLevelIds = componentIds.filter((id) => {
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

      if (topLevelIds.length === 0) {
        return;
      }

      // 현재 화면/tree 순서대로 정렬
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

      // 자기 자신 / 자기 자식으로 이동 방지
      if (targetParentId) {
        for (const id of topLevelIds) {
          const component = findComponentRecursive(components, id);

          if (!component) {
            continue;
          }

          if (
            component.id === targetParentId ||
            containsComponent(component, targetParentId)
          ) {
            return;
          }
        }
      }

      commitHistory((prev) => {
        let next = prev;

        const movingComponents: LayoutComponent[] = [];

        // 원래 위치 정보
        const sourceLocations = topLevelIds
          .map((id) => ({
            id,
            location: findComponentLocation(prev, id),
          }))
          .filter(
            (
              item,
            ): item is {
              id: string;
              location: NonNullable<ReturnType<typeof findComponentLocation>>;
            } => item.location != null,
          );

        // 같은 부모에서 앞쪽 아이템들이 빠지면
        // targetIndex를 그만큼 보정해야 함
        const removedBeforeTarget = sourceLocations.filter(
          ({ location }) =>
            location.parentId === targetParentId &&
            location.index < targetIndex,
        ).length;

        const adjustedTargetIndex = Math.max(
          0,
          targetIndex - removedBeforeTarget,
        );

        // 선택 컴포넌트 제거
        for (const id of topLevelIds) {
          const removed = removeComponentRecursive(next, id);

          if (removed.removed) {
            movingComponents.push(removed.removed);

            next = removed.items;
          }
        }

        // 같은 순서를 유지하면서 삽입
        movingComponents.forEach((component, offset) => {
          next = insertComponentRecursive(
            next,
            targetParentId,
            adjustedTargetIndex + offset,
            component,
          );
        });

        return next;
      });
    },
    [components, commitHistory],
  );

  const handleDragStart = useCallback(
    (event: DragEvent<HTMLElement>, componentId: string) => {
      const nextDraggingIds = selectedComponentIds.includes(componentId)
        ? [...selectedComponentIds]
        : [componentId];

      setDraggingIds(nextDraggingIds);

      event.dataTransfer.effectAllowed = "move";

      event.dataTransfer.setData(
        "application/x-layout-component-ids",
        JSON.stringify(nextDraggingIds),
      );

      event.dataTransfer.setData(
        "application/x-layout-component-id",
        componentId,
      );

      event.dataTransfer.setData("text/plain", componentId);
    },
    [selectedComponentIds],
  );

  const handleDragEnd = useCallback(() => {
    clearDraggingState();
  }, [clearDraggingState]);

  const handlePointerDragStart = useCallback(
    (event: PointerEvent<HTMLElement>, componentId: string) => {
      if (layerSearch) {
        return;
      }

      if (event.pointerType === "mouse") {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      event.currentTarget.setPointerCapture(event.pointerId);

      const isMultiDragging =
        selectedComponentIds.length > 1 &&
        selectedComponentIds.includes(componentId);

      const nextDraggingIds = isMultiDragging
        ? [...selectedComponentIds]
        : [componentId];

      pointerDragRef.current = {
        componentId,
        targetParentId: null,
        targetIndex: null,
      };

      setDraggingIds(nextDraggingIds);
    },
    [layerSearch, selectedComponentIds],
  );

  const handlePointerDragMove = useCallback(
    (event: PointerEvent<HTMLElement>) => {
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
    },
    [],
  );

  const handlePointerDragEnd = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (event.pointerType === "mouse") {
        return;
      }

      const { componentId, targetParentId, targetIndex } =
        pointerDragRef.current;

      if (componentId && targetIndex !== null) {
        moveComponent(componentId, targetParentId, targetIndex);
      }

      pointerDragRef.current = {
        componentId: null,
        targetParentId: null,
        targetIndex: null,
      };

      clearDraggingState();
    },
    [clearDraggingState, moveComponent],
  );

  const handlePointerDragCancel = useCallback(() => {
    pointerDragRef.current = {
      componentId: null,
      targetParentId: null,
      targetIndex: null,
    };

    clearDraggingState();
  }, [clearDraggingState]);

  const handleDrop = useCallback(
    (event: DragEvent<HTMLElement>, parentId: string | null, index: number) => {
      event.preventDefault();
      event.stopPropagation();

      // 1. ComponentPanel에서 새 컴포넌트 드롭
      const componentType = event.dataTransfer.getData(
        "application/x-component-type",
      ) as ComponentType;
      if (componentType) {
        const newComponent = makeComponentByType(componentType);
        commitHistory((prev) =>
          insertComponentRecursive(prev, parentId, index, newComponent),
        );
        setSelectedComponentIds([newComponent.id]);
        triggerDropAnimation([newComponent.id]);
        setActiveDropTarget(null);
        return;
      }

      // 2. 템플릿 드롭
      const templateDropped = dropTemplate(event, parentId, index);
      if (templateDropped) {
        setActiveDropTarget(null);
        return;
      }

      const multiRaw = event.dataTransfer.getData(
        "application/x-layout-component-ids",
      );
      let draggedIds: string[] = [];
      if (multiRaw) {
        try {
          const parsed = JSON.parse(multiRaw);
          if (Array.isArray(parsed)) {
            draggedIds = parsed.filter(
              (id): id is string => typeof id === "string",
            );
          }
        } catch {
          draggedIds = [];
        }
      }

      // 멀티 드래그
      if (draggedIds.length > 1) {
        moveComponents(draggedIds, parentId, index);
        triggerDropAnimation(draggedIds);
        clearDraggingState();
        return;
      }

      // 기존 단일 드래그
      const draggedId =
        draggedIds[0] ||
        event.dataTransfer.getData("application/x-layout-component-id") ||
        event.dataTransfer.getData("text/plain") ||
        draggingIds[0];

      if (!draggedId) {
        setActiveDropTarget(null);
        return;
      }

      moveComponent(draggedId, parentId, index);

      triggerDropAnimation([draggedId]);

      clearDraggingState();
    },
    [
      clearDraggingState,
      commitHistory,
      draggingIds,
      dropTemplate,
      makeComponentByType,
      moveComponent,
      moveComponents,
      setSelectedComponentIds,
      triggerDropAnimation,
    ],
  );

  return {
    draggingIds,
    droppedIds,
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
