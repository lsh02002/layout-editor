import { useRef, useState, type MouseEvent, type PointerEvent } from "react";
import { runtimeUnits } from "../../editor/utils/RuntimeUnitManager";


type Point = {
  x: number;
  y: number;
};

type Args = {
  previewMode: boolean;
  runtimeCommandMode: string | null;
  setRuntimeCommandMode: (value: string | null) => void;
};

export function useRuntimeSelection({
  previewMode,
  runtimeCommandMode,
  setRuntimeCommandMode,
}: Args) {
  const [runtimeSelectionStart, setRuntimeSelectionStart] = useState<Point | null>(
    null,
  );
  const [runtimeSelectionCurrent, setRuntimeSelectionCurrent] =
    useState<Point | null>(null);
  const [runtimeSelectionVisible, setRuntimeSelectionVisible] = useState(false);
  const runtimeSelectionMoved = useRef(false);
  const runtimeSelectionAppended = useRef(false);

  const runtimeSelectionRect =
    runtimeSelectionStart && runtimeSelectionCurrent
      ? {
          left: Math.min(runtimeSelectionStart.x, runtimeSelectionCurrent.x),
          top: Math.min(runtimeSelectionStart.y, runtimeSelectionCurrent.y),
          width: Math.abs(runtimeSelectionCurrent.x - runtimeSelectionStart.x),
          height: Math.abs(runtimeSelectionCurrent.y - runtimeSelectionStart.y),
        }
      : null;

  const clearRuntimeSelectionPreview = () => {
    document
      .querySelectorAll<HTMLElement>('[data-runtime-preview-selected="true"]')
      .forEach((element) => {
        element.removeAttribute("data-runtime-preview-selected");
      });
  };

  const onContextMenu = (event: MouseEvent<HTMLDivElement>) => {
    if (!previewMode) {
      return;
    }

    if (runtimeUnits.getSelected().length === 0) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    runtimeUnits.showCommandMarker(
      event.currentTarget as HTMLElement,
      x,
      y,
      "move",
    );

    runtimeUnits.moveSelectedTo(x, y);
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!previewMode) {
      return;
    }

    if (event.button !== 0) {
      return;
    }

    if (runtimeCommandMode === "attackMove" && event.button === 0) {
      const rect = event.currentTarget.getBoundingClientRect();

      const x = event.clientX - rect.left;

      const y = event.clientY - rect.top;

      runtimeUnits.attackMoveSelectedTo(x, y);

      runtimeUnits.showCommandMarker(
        event.currentTarget,
        x,
        y,
        "attackMove",
      );

      setRuntimeCommandMode(null);

      event.preventDefault();
      event.stopPropagation();

      return;
    }

    if ((event.target as HTMLElement).closest("[data-runtime-unit-id]")) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    setRuntimeSelectionStart({
      x,
      y,
    });

    setRuntimeSelectionCurrent({
      x,
      y,
    });

    runtimeSelectionMoved.current = false;
    runtimeSelectionAppended.current = event.shiftKey;
    setRuntimeSelectionVisible(false);
    clearRuntimeSelectionPreview();

    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!previewMode) {
      return;
    }

    const selectionStart = runtimeSelectionStart;
    if (!selectionStart) {
      return;
    }

    const mapRect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - mapRect.left;
    const y = event.clientY - mapRect.top;
    const distance = Math.hypot(
      x - selectionStart.x,
      y - selectionStart.y,
    );

    if (!runtimeSelectionMoved.current && distance < 5) {
      return;
    }

    runtimeSelectionMoved.current = true;
    setRuntimeSelectionVisible(true);
    setRuntimeSelectionCurrent({
      x,
      y,
    });

    clearRuntimeSelectionPreview();

    const left = Math.min(selectionStart.x, x);
    const top = Math.min(selectionStart.y, y);
    const right = Math.max(selectionStart.x, x);
    const bottom = Math.max(selectionStart.y, y);

    event.currentTarget
      .querySelectorAll<HTMLElement>("[data-runtime-unit-id]")
      .forEach((element) => {
        const id = element.dataset.runtimeUnitId;

        if (!id || !runtimeUnits.get(id)) {
          return;
        }

        const rect = element.getBoundingClientRect();
        const elementLeft = rect.left - mapRect.left;
        const elementTop = rect.top - mapRect.top;
        const elementRight = elementLeft + rect.width;
        const elementBottom = elementTop + rect.height;
        const inside =
          elementRight >= left &&
          elementLeft <= right &&
          elementBottom >= top &&
          elementTop <= bottom;

        if (inside) {
          element.setAttribute("data-runtime-preview-selected", "true");
        }
      });
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (!previewMode || !runtimeSelectionStart) {
      return;
    }

    const currentTarget = event.currentTarget;

    if (!runtimeSelectionMoved.current) {
      if (!runtimeSelectionAppended.current) {
        runtimeUnits.clearSelected();
      }

      runtimeSelectionMoved.current = false;

      setRuntimeSelectionStart(null);
      setRuntimeSelectionCurrent(null);
      setRuntimeSelectionVisible(false);

      if (currentTarget.hasPointerCapture(event.pointerId)) {
        currentTarget.releasePointerCapture(event.pointerId);
      }

      event.stopPropagation();

      return;
    }

    const mapRect = currentTarget.getBoundingClientRect();
    const endX = event.clientX - mapRect.left;
    const endY = event.clientY - mapRect.top;
    const left = Math.min(runtimeSelectionStart.x, endX);
    const top = Math.min(runtimeSelectionStart.y, endY);
    const right = Math.max(runtimeSelectionStart.x, endX);
    const bottom = Math.max(runtimeSelectionStart.y, endY);

    const selectedIds = Array.from(
      currentTarget.querySelectorAll<HTMLElement>(
        "[data-runtime-unit-id]",
      ),
    )
      .filter((element) => {
        const id = element.dataset.runtimeUnitId;
        if (!id || !runtimeUnits.get(id)) {
          return false;
        }

        const rect = element.getBoundingClientRect();
        const elementLeft = rect.left - mapRect.left;
        const elementTop = rect.top - mapRect.top;
        const elementRight = elementLeft + rect.width;
        const elementBottom = elementTop + rect.height;

        return (
          elementRight >= left &&
          elementLeft <= right &&
          elementBottom >= top &&
          elementTop <= bottom
        );
      })
      .map((element) => element.dataset.runtimeUnitId!);

    runtimeUnits.selectMany(
      selectedIds,
      runtimeSelectionAppended.current,
    );

    clearRuntimeSelectionPreview();

    runtimeSelectionMoved.current = false;
    runtimeSelectionAppended.current = false;

    setRuntimeSelectionStart(null);
    setRuntimeSelectionCurrent(null);
    setRuntimeSelectionVisible(false);

    if (currentTarget.hasPointerCapture(event.pointerId)) {
      currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const onPointerCancel = (event: PointerEvent<HTMLDivElement>) => {
    clearRuntimeSelectionPreview();

    runtimeSelectionMoved.current = false;
    runtimeSelectionAppended.current = false;
    setRuntimeSelectionVisible(false);

    setRuntimeSelectionStart(null);
    setRuntimeSelectionCurrent(null);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return {
    runtimeSelectionVisible,
    runtimeSelectionRect,
    onContextMenu,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
  };
}
