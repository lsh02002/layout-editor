import { useCallback, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

type Options = {
  isAbsolute: boolean;
  positionParentId: string | null;
};

export const usePositionParent = ({
  isAbsolute,
  positionParentId,
}: Options) => {
  const [positionParentElement, setPositionParentElement] =
    useState<HTMLElement | null>(null);

  const componentRef = useRef<HTMLDivElement>(null);

  const handleComponentRef = useCallback(
    (element: HTMLDivElement | null) => {
      componentRef.current = element;

      if (!element) {
        return;
      }

      if (!isAbsolute || !positionParentId) {
        setPositionParentElement(null);
        return;
      }

      const canvasElement = element.closest<HTMLElement>(".builder-preview");

      if (!canvasElement) {
        setPositionParentElement(null);
        return;
      }

      const parentElement =
        Array.from(
          canvasElement.querySelectorAll<HTMLElement>(
            "[data-position-context-id]",
          ),
        ).find((item) => item.dataset.positionContextId === positionParentId) ??
        null;

      setPositionParentElement((current) =>
        current === parentElement ? current : parentElement,
      );
    },
    [isAbsolute, positionParentId],
  );

  const renderWithPositionParent = (node: ReactNode) => {
    if (isAbsolute && positionParentId && positionParentElement) {
      return createPortal(node, positionParentElement);
    }

    return node;
  };

  return {
    componentRef,
    handleComponentRef,
    renderWithPositionParent,
  };
};
