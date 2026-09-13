import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type Dispatch,
  type DragEvent,
  type PointerEvent,
  type ReactNode,
  type SetStateAction,
  type SyntheticEvent,
} from "react";
import { createPortal } from "react-dom";
import DivBox from "./DivBox";
import {
  isLayoutContainer,
  type CanvasComponent,
  type ComponentLayout,
  type ContainerDirection,
  type LayoutComponent,
} from "../../types/types";
import CanvasComponentContent from "./CanvasComponentContent";
import CanvasDropZone, { type CanvasDropTarget } from "./CanvasDropZone";
import ComponentDragHandle from "./ComponentDragHandle";
import { builderState } from "../editor/utils/builderState";
import {
  runtimeUnits,
  type RuntimeStatusType,
  type RuntimeUnitSpawnOptions,
} from "../editor/utils/RuntimeUnitManager";

type Props = {
  previewMode: boolean;
  canvasWidth: number;
  isMobile: boolean;
  component: LayoutComponent;
  selectedComponentIds: string[];
  draggingIds: string[];
  droppedIds: string[];
  layerSearch: string;
  activeDropTarget: CanvasDropTarget | null;
  runtimeCommandMode: string | null;
  setRuntimeCommandMode: Dispatch<SetStateAction<string | null>>;
  setActiveDropTarget: (target: CanvasDropTarget | null) => void;
  onLayoutChange: (
    id: string,
    layout: Partial<ComponentLayout>,
    recordHistory?: boolean,
  ) => void;
  onSelect: (
    id: string,
    openEditPanel?: boolean,
    multiSelect?: boolean,
  ) => void;
  onEdit: (id: string) => void;
  onCopy: (id: string) => void;
  onDelete: (id: string) => void;
  onCreate: (parentId: string | null, index: number) => void;
  onDrop: (
    event: DragEvent<HTMLElement>,
    parentId: string | null,
    index: number,
  ) => void;
  onDragStart: (event: DragEvent<HTMLElement>, componentId: string) => void;
  onDragEnd: () => void;
  onPointerDragStart: (
    event: PointerEvent<HTMLElement>,
    componentId: string,
  ) => void;
  onPointerDragMove: (event: PointerEvent<HTMLElement>) => void;
  onPointerDragEnd: (event: PointerEvent<HTMLElement>) => void;
  onPointerDragCancel: () => void;
  snapLayout: (layout: Partial<ComponentLayout>) => Partial<ComponentLayout>;
};

function LayoutComponentNode({
  previewMode,
  canvasWidth,
  isMobile,
  component,
  selectedComponentIds,
  draggingIds,
  droppedIds,
  layerSearch,
  activeDropTarget,
  runtimeCommandMode,
  setRuntimeCommandMode,
  setActiveDropTarget,
  onLayoutChange,
  onSelect,
  onEdit,
  onCopy,
  onDelete,
  onCreate,
  onDrop,
  onDragStart,
  onDragEnd,
  onPointerDragStart,
  onPointerDragMove,
  onPointerDragEnd,
  onPointerDragCancel,
  snapLayout,
}: Props) {
  useSyncExternalStore(
    builderState.subscribe,
    builderState.getVersion,
    builderState.getVersion,
  );

  const [renderedWidth, setRenderedWidth] = useState<number>(0);
  const [editToolbarVisible, setEditToolbarVisible] = useState(false);
  const [positionParentElement, setPositionParentElement] =
    useState<HTMLElement | null>(null);

  const [runtimeSelectionStart, setRuntimeSelectionStart] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [runtimeSelectionCurrent, setRuntimeSelectionCurrent] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [runtimeSelectionVisible, setRuntimeSelectionVisible] = useState(false);
  const runtimeSelectionMoved = useRef(false);
  const runtimeSelectionAppended = useRef(false);

  const textBinding = component.stateBindings?.find(
    (binding) => binding.target === "text",
  );

  const valueBinding = component.stateBindings?.find(
    (binding) => binding.target === "value",
  );

  const visibleBinding = component.stateBindings?.find(
    (binding) => binding.target === "visible",
  );

  const boundText = textBinding
    ? builderState.get(textBinding.stateKey, "")
    : undefined;

  const boundValue = valueBinding
    ? builderState.get(valueBinding.stateKey, "")
    : undefined;

  const isStateVisible = visibleBinding
    ? Boolean(builderState.get(visibleBinding.stateKey, true))
    : true;

  const isSelected = selectedComponentIds.includes(component.id);
  const isPrimarySelected = selectedComponentIds.at(-1) === component.id;
  const isAbsolute = component.layout?.position === "absolute";

  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

  const createBuilderApi = () => {
    const getElement = (id: string) =>
      document.querySelector<HTMLElement>(
        `[data-component-id="${CSS.escape(id)}"]`,
      );

    const getStyleElement = (id: string) => {
      const root = getElement(id);
      if (!root) {
        return null;
      }

      return root.firstElementChild instanceof HTMLElement
        ? root.firstElementChild
        : root;
    };

    const saveOriginalClass = (element: HTMLElement) => {
      if (element.dataset.builderOriginalClass === undefined) {
        element.dataset.builderOriginalClass =
          element.getAttribute("class") ?? "";
      }
    };

    const saveOriginalStyle = (element: HTMLElement) => {
      if (element.dataset.builderOriginalStyle === undefined) {
        element.dataset.builderOriginalStyle =
          element.getAttribute("style") ?? "";
      }
    };

    const saveOriginalAttribute = (element: HTMLElement, name: string) => {
      const saved = element.dataset.builderOriginalAttributes
        ? JSON.parse(element.dataset.builderOriginalAttributes)
        : {};

      if (!(name in saved)) {
        saved[name] = element.hasAttribute(name)
          ? element.getAttribute(name)
          : null;

        element.dataset.builderOriginalAttributes = JSON.stringify(saved);
      }
    };

    const getFormElement = (id: string) => {
      const root = getElement(id);

      if (!root) {
        return null;
      }

      if (
        root instanceof HTMLInputElement ||
        root instanceof HTMLTextAreaElement ||
        root instanceof HTMLSelectElement ||
        root instanceof HTMLButtonElement
      ) {
        return root;
      }

      return root.querySelector<
        | HTMLInputElement
        | HTMLTextAreaElement
        | HTMLSelectElement
        | HTMLButtonElement
      >("input, textarea, select, button");
    };

    const getCheckableElement = (id: string) => {
      const root = getElement(id);

      if (!root) {
        return null;
      }

      if (
        root instanceof HTMLInputElement &&
        (root.type === "checkbox" || root.type === "radio")
      ) {
        return root;
      }

      return root.querySelector<HTMLInputElement>(
        'input[type="checkbox"], input[type="radio"]',
      );
    };

    const saveOriginalFormState = (
      element:
        | HTMLInputElement
        | HTMLTextAreaElement
        | HTMLSelectElement
        | HTMLButtonElement,
    ) => {
      if (element.dataset.builderOriginalDisabled === undefined) {
        element.dataset.builderOriginalDisabled = String(element.disabled);
      }

      if (
        "value" in element &&
        element.dataset.builderOriginalValue === undefined
      ) {
        element.dataset.builderOriginalValue = element.value;
      }

      if (
        element instanceof HTMLInputElement &&
        element.dataset.builderOriginalChecked === undefined
      ) {
        element.dataset.builderOriginalChecked = String(element.checked);
      }
    };

    return {
      state: builderState,
      units: {
        spawn(id: string, options?: RuntimeUnitSpawnOptions) {
          return runtimeUnits.spawn(id, options);
        },
        moveTo(id: string, x: number, y: number) {
          return runtimeUnits.moveTo(id, x, y);
        },
        moveSelectedTo(x: number, y: number) {
          return runtimeUnits.moveSelectedTo(x, y);
        },
        select(id: string, append = false) {
          return runtimeUnits.select(id, append);
        },
        selectMany(ids: string[], append = false) {
          return runtimeUnits.selectMany(ids, append);
        },
        getSelected() {
          return runtimeUnits.getSelected();
        },
        clearSelected() {
          runtimeUnits.clearSelected();
        },
        get(id: string) {
          return runtimeUnits.get(id);
        },
        getStats(id: string) {
          return runtimeUnits.getStats(id);
        },
        remove(id: string) {
          return runtimeUnits.remove(id);
        },
        attack(attackerId: string, targetId: string) {
          return runtimeUnits.attack(attackerId, targetId);
        },
        stopAttack(id: string) {
          return runtimeUnits.stopAttack(id);
        },
        damage(id: string, amount: number) {
          return runtimeUnits.damage(id, amount);
        },
        addStatus(
          id: string,
          type: RuntimeStatusType,
          duration: number,
          magnitude = 0,
          sourceId?: string,
        ) {
          return runtimeUnits.addStatus(
            id,
            type,
            duration,
            magnitude,
            sourceId,
          );
        },
        removeStatus(id: string, type: RuntimeStatusType) {
          return runtimeUnits.removeStatus(id, type);
        },
        stun(id: string, duration: number, sourceId?: string) {
          return runtimeUnits.stun(id, duration, sourceId);
        },
        slow(id: string, duration: number, amount = 0.4, sourceId?: string) {
          return runtimeUnits.slow(id, duration, amount, sourceId);
        },
        burn(
          id: string,
          duration: number,
          damagePerTick = 5,
          sourceId?: string,
        ) {
          return runtimeUnits.burn(id, duration, damagePerTick, sourceId);
        },
        poison(
          id: string,
          duration: number,
          damagePerTick = 3,
          sourceId?: string,
        ) {
          return runtimeUnits.poison(id, duration, damagePerTick, sourceId);
        },
        shield(
          id: string,
          amount: number,
          duration = Number.POSITIVE_INFINITY,
          sourceId?: string,
        ) {
          return runtimeUnits.shield(id, amount, duration, sourceId);
        },
        clearStatuses(id: string) {
          return runtimeUnits.clearStatuses(id);
        },
        knockback(
          id: string,
          directionX: number,
          directionY: number,
          strength = 600,
        ) {
          return runtimeUnits.knockback(id, directionX, directionY, strength);
        },
        attackSelected(targetId: string) {
          return runtimeUnits.attackSelected(targetId);
        },
        attackMove(id: string, x: number, y: number) {
          return runtimeUnits.attackMove(id, x, y);
        },
        attackMoveSelectedTo(x: number, y: number) {
          return runtimeUnits.attackMoveSelectedTo(x, y);
        },
        clear() {
          runtimeUnits.clear();
        },
      },
      getElement,
      hide(id: string) {
        const element = getElement(id);
        if (!element) {
          return;
        }
        saveOriginalClass(element);

        element.classList.add("builder-js-hidden");
      },
      show(id: string) {
        const element = getElement(id);
        if (!element) {
          return;
        }

        saveOriginalClass(element);

        element.classList.remove("builder-js-hidden");
      },
      toggle(id: string) {
        const element = getElement(id);
        if (!element) {
          return;
        }

        saveOriginalClass(element);

        element.classList.toggle("builder-js-hidden");
      },

      setText(id: string, text: string) {
        console.warn("Preview에서는 setText를 지원하지 않습니다.", id, text);
      },

      setStyle(id: string, property: string, value: string) {
        const element = getStyleElement(id);
        if (!element) {
          return;
        }

        saveOriginalStyle(element);
        element.style.setProperty(property, value);
      },
      addClass(id: string, className: string) {
        const element = getElement(id);
        if (!element) {
          return;
        }

        saveOriginalClass(element);

        element.classList.add(className);
      },
      removeClass(id: string, className: string) {
        const element = getElement(id);
        if (!element) {
          return;
        }

        saveOriginalClass(element);

        element.classList.remove(className);
      },
      toggleClass(id: string, className: string) {
        const element = getElement(id);
        if (!element) {
          return;
        }

        saveOriginalClass(element);

        element.classList.toggle(className);
      },
      setAttribute(id: string, name: string, value: string) {
        const element = getElement(id);
        if (!element) {
          return;
        }
        if (name === "style" || name === "class") {
          console.warn(`builder.setAttribute("${name}")는 지원하지 않습니다.`);
          return;
        }

        saveOriginalAttribute(element, name);
        element.setAttribute(name, value);
      },

      removeAttribute(id: string, name: string) {
        const element = getElement(id);
        if (!element) {
          return;
        }
        if (name === "style" || name === "class") {
          console.warn(
            `builder.removeAttribute("${name}")는 지원하지 않습니다.`,
          );
          return;
        }

        saveOriginalAttribute(element, name);
        element.removeAttribute(name);
      },
      scrollTo(id: string, behavior: ScrollBehavior = "smooth") {
        const element = getElement(id);
        if (!element) {
          return;
        }

        element.scrollIntoView({
          behavior,
          block: "start",
        });
      },
      setValue(id: string, value: string) {
        const element = getFormElement(id);

        if (
          element instanceof HTMLInputElement ||
          element instanceof HTMLTextAreaElement ||
          element instanceof HTMLSelectElement
        ) {
          saveOriginalFormState(element);

          element.value = value;

          element.dispatchEvent(
            new Event("input", {
              bubbles: true,
            }),
          );

          element.dispatchEvent(
            new Event("change", {
              bubbles: true,
            }),
          );
        }
      },
      getValue(id: string) {
        const element = getFormElement(id);

        if (
          element instanceof HTMLInputElement ||
          element instanceof HTMLTextAreaElement ||
          element instanceof HTMLSelectElement
        ) {
          return element.value;
        }

        return "";
      },
      focus(id: string) {
        getFormElement(id)?.focus();
      },

      blur(id: string) {
        getFormElement(id)?.blur();
      },
      enable(id: string) {
        const element = getFormElement(id);

        if (element) {
          saveOriginalFormState(element);
          element.disabled = false;
        }
      },

      disable(id: string) {
        const element = getFormElement(id);

        if (element) {
          saveOriginalFormState(element);
          element.disabled = true;
        }
      },
      exists(id: string) {
        return getElement(id) !== null;
      },
      isVisible(id: string) {
        const element = getElement(id);
        if (!element) {
          return false;
        }

        const style = window.getComputedStyle(element);

        return (
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          style.opacity !== "0" &&
          element.getClientRects().length > 0
        );
      },
      setChecked(id: string, checked: boolean) {
        const element = getCheckableElement(id);

        if (!element) {
          return;
        }

        saveOriginalFormState(element);

        element.checked = checked;

        element.dispatchEvent(
          new Event("change", {
            bubbles: true,
          }),
        );
      },
      getChecked(id: string) {
        return getCheckableElement(id)?.checked ?? false;
      },
      trigger(id: string, eventName: string) {
        const root = getElement(id);
        if (!root) {
          return;
        }

        const target = root.matches("button, input, select, textarea, a")
          ? root
          : (root.querySelector<HTMLElement>(
              "button, input, select, textarea, a",
            ) ?? root);

        if (eventName === "click" && typeof target.click === "function") {
          target.click();
          return;
        }

        target.dispatchEvent(
          new Event(eventName, {
            bubbles: true,
            cancelable: true,
          }),
        );
      },
      submit(id: string) {
        const root = getElement(id);
        const form =
          root instanceof HTMLFormElement
            ? root
            : root?.querySelector<HTMLFormElement>("form");

        if (!form) {
          return;
        }

        form.requestSubmit();
      },
      reset(id: string) {
        const root = getElement(id);
        const form =
          root instanceof HTMLFormElement
            ? root
            : root?.querySelector<HTMLFormElement>("form");

        if (!form) {
          return;
        }

        form.reset();
      },
      toggleChecked(id: string) {
        const element = getCheckableElement(id);

        if (!element) {
          return;
        }

        saveOriginalFormState(element);

        element.checked = !element.checked;

        element.dispatchEvent(
          new Event("change", {
            bubbles: true,
          }),
        );
      },
      // setHtml(id: string, html: string) {
      //   const element = getElement(id);
      //   if (!element) {
      //     return;
      //   }

      //   element.innerHTML = html;
      // },
      getText(id: string) {
        const element = getElement(id);
        return element?.textContent ?? "";
      },
      getAttribute(id: string, name: string) {
        const element = getElement(id);
        return element?.getAttribute(name) ?? null;
      },

      hasClass(id: string, className: string) {
        const element = getElement(id);
        return element?.classList.contains(className) ?? false;
      },
      delay(ms: number) {
        return new Promise<void>((resolve) => {
          setTimeout(resolve, ms);
        });
      },
      navigate(url: string) {
        window.location.href = url;
      },
      open(url: string, target = "_blank") {
        window.open(url, target);
      },
      async copy(text: string) {
        try {
          await navigator.clipboard.writeText(text);
          return true;
        } catch {
          return false;
        }
      },
      toggleDisabled(id: string) {
        const element = getFormElement(id);

        if (!element) {
          return;
        }

        saveOriginalFormState(element);

        element.disabled = !element.disabled;
      },
    };
  };

  const executeJsActions = useCallback(
    (eventName: string, event: SyntheticEvent<HTMLElement>) => {
      if (!previewMode) {
        return;
      }
      const actions = component.jsActions ?? [];
      const matchedActions = actions.filter(
        (action) =>
          action.enabled !== false &&
          action.event === eventName &&
          action.code.trim(),
      );
      if (matchedActions.length === 0) {
        return;
      }
      matchedActions.forEach((action) => {
        if (action.preventDefault) {
          event.preventDefault();
        }

        if (action.stopPropagation) {
          event.stopPropagation();
        }

        const fn = new AsyncFunction(
          "event",
          "element",
          "component",
          "builder",
          action.code,
        );
        void fn(
          event,
          event.currentTarget,
          component,
          createBuilderApi(),
        ).catch((error: unknown) => {
          console.error(`JS Action 실행 실패: ${action.event}`, error);
        });
      });
    },
    [AsyncFunction, component, previewMode],
  );

  const jsEventProps = previewMode
    ? {
        onClick: (event: SyntheticEvent<HTMLElement>) =>
          executeJsActions("click", event),
        onDoubleClick: (event: SyntheticEvent<HTMLElement>) =>
          executeJsActions("dblclick", event),
        onMouseEnter: (event: SyntheticEvent<HTMLElement>) =>
          executeJsActions("mouseenter", event),
        onMouseLeave: (event: SyntheticEvent<HTMLElement>) =>
          executeJsActions("mouseleave", event),
        onFocus: (event: SyntheticEvent<HTMLElement>) =>
          executeJsActions("focus", event),
        onBlur: (event: SyntheticEvent<HTMLElement>) =>
          executeJsActions("blur", event),
        onInput: (event: SyntheticEvent<HTMLElement>) =>
          executeJsActions("input", event),
        onChange: (event: SyntheticEvent<HTMLElement>) =>
          executeJsActions("change", event),
      }
    : {};

  const positionParentId = component.layout?.positionParentId ?? null;

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

  const justDropped = !isAbsolute && droppedIds.includes(component.id);

  useEffect(() => {
    if (!isSelected) {
      return;
    }

    const element = componentRef.current;

    if (!element) {
      return;
    }

    const updateWidth = () => {
      setRenderedWidth(element.getBoundingClientRect().width);
    };

    updateWidth();

    const observer = new ResizeObserver(updateWidth);

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [isSelected]);

  const dragHandleLeft =
    renderedWidth > 0 && renderedWidth < 120 && editToolbarVisible
      ? renderedWidth < 70
        ? -100
        : -40
      : -10;

  const effectiveWidthMode =
    component.layout?.widthMode ??
    (component.type === "image" ||
    component.type === "imageGallery" ||
    component.type === "imageSlider"
      ? "fill"
      : undefined);

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

  const dragHandle = (
    <ComponentDragHandle
      component={component}
      draggingIds={draggingIds}
      layerSearch={layerSearch}
      onDragStart={handleNativeDragStart}
      onDragEnd={handleNativeDragEnd}
      onPointerDragStart={onPointerDragStart}
      onPointerDragMove={onPointerDragMove}
      onPointerDragEnd={onPointerDragEnd}
      onPointerDragCancel={onPointerDragCancel}
      dragHandleLeft={dragHandleLeft}
    />
  );

  const isPresentationSlide =
    component.type === "container" &&
    component.props.presentationSlide === true;

  const presentationEditStyle =
    isPresentationSlide && !previewMode
      ? {
          position: "relative" as const,
          left: undefined,
          top: undefined,
          right: undefined,
          bottom: undefined,
          opacity: 1,
          zIndex: "auto",
          pointerEvents: "auto" as const,
          transform: undefined,
        }
      : {};

  const containerMaxWidth =
    component.type === "container" ? component.props.maxWidth : undefined;

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

  const nodeStyle = {
    display: previewMode && !isStateVisible ? "none" : undefined,

    position: isAbsolute ? ("absolute" as const) : ("relative" as const),
    left: isAbsolute ? (component.layout?.x ?? 0) : undefined,
    top: isAbsolute ? (component.layout?.y ?? 0) : undefined,
    zIndex: isAbsolute ? (component.layout?.zIndex ?? 1000) : undefined,
    width: isAbsolute ? "max-content" : "100%",
    minWidth: 0,
    maxWidth: isAbsolute
      ? "none"
      : containerMaxWidth
        ? containerMaxWidth
        : "100%",
    marginLeft: containerMaxWidth ? "auto" : undefined,
    marginRight: containerMaxWidth ? "auto" : undefined,

    ...(component.style?.border
      ? { border: component.style.border }
      : { border: "none" }),

    transform: justDropped
      ? "translateY(-6px) scale(1.015)"
      : !isAbsolute
        ? "translateY(0) scale(1)"
        : undefined,

    transition: !isAbsolute
      ? "transform 220ms cubic-bezier(0.22, 1, 0.36, 1)"
      : undefined,

    scrollMarginTop: "150px",

    pointerEvents:
      isPresentationSlide && previewMode
        ? component.style?.pointerEvents
        : undefined,

    cursor:
      previewMode && runtimeCommandMode === "attackMove"
        ? "crosshair"
        : "pointer",

    ...presentationEditStyle,
  };

  const dragHandleView =
    !previewMode && !isAbsolute && isSelected ? (
      <div
        style={{
          position: "absolute",
          left: 0,
          top: isLayoutContainer(component) ? "-14px" : 0,
          transform: "translate(-50%, -50%)",
          zIndex: 120,
        }}
      >
        {dragHandle}
      </div>
    ) : null;

  const componentChildren = isLayoutContainer(component)
    ? component.children
    : null;

  const sortedChildren = useMemo(() => {
    if (!componentChildren) {
      return [];
    }

    return [...componentChildren].sort((a, b) => a.order - b.order);
  }, [componentChildren]);

  if (!isStateVisible) {
    return null;
  }

  const renderChildNode = (child: LayoutComponent) => (
    <LayoutComponentNode
      previewMode={previewMode}
      canvasWidth={canvasWidth}
      isMobile={isMobile}
      component={child}
      selectedComponentIds={selectedComponentIds}
      draggingIds={draggingIds}
      droppedIds={droppedIds}
      layerSearch={layerSearch}
      activeDropTarget={activeDropTarget}
      runtimeCommandMode={runtimeCommandMode}
      setRuntimeCommandMode={setRuntimeCommandMode}
      setActiveDropTarget={setActiveDropTarget}
      onLayoutChange={onLayoutChange}
      onSelect={onSelect}
      onEdit={onEdit}
      onCopy={onCopy}
      onDelete={onDelete}
      onCreate={onCreate}
      onDrop={onDrop}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onPointerDragStart={onPointerDragStart}
      onPointerDragMove={onPointerDragMove}
      onPointerDragEnd={onPointerDragEnd}
      onPointerDragCancel={onPointerDragCancel}
      snapLayout={snapLayout}
    />
  );

  const canvasComponent = component as CanvasComponent;
  let boundComponent: CanvasComponent = canvasComponent;

  if (previewMode && textBinding && "text" in canvasComponent.props) {
    boundComponent = {
      ...canvasComponent,
      props: {
        ...canvasComponent.props,
        text: String(boundText ?? ""),
      },
    } as CanvasComponent;
  }

  if (previewMode && valueBinding && "value" in canvasComponent.props) {
    boundComponent = {
      ...boundComponent,
      props: {
        ...boundComponent.props,
        value: String(boundValue ?? ""),
      },
    } as CanvasComponent;
  }

  if (component.type === "grid") {
    const children = sortedChildren;
    const columns = Math.max(1, component.props.columns ?? 2);
    const gap = component.props.gap ?? 8;

    return renderWithPositionParent(
      <div
        ref={handleComponentRef}
        data-component-id={component.id}
        style={nodeStyle}
        {...jsEventProps}
      >
        <DivBox
          previewMode={previewMode}
          isSelected={isPrimarySelected}
          positionContextId={component.id}
          layout={component.layout}
          onLayoutChange={(layout, recordHistory) =>
            onLayoutChange(component.id, layout, recordHistory)
          }
          onComponentSelect={(multiSelect) =>
            onSelect(component.id, false, multiSelect)
          }
          onEdit={() => onEdit(component.id)}
          onCopy={() => onCopy(component.id)}
          onDelete={() => onDelete(component.id)}
          onToolbarVisibleChange={setEditToolbarVisible}
          snapLayout={snapLayout}
          style={{
            ...component.style,
            transition: "opacity 120ms ease",
            outline:
              !previewMode && isSelected
                ? "2px solid #0d6efd"
                : !previewMode
                  ? "1px dashed #adb5bd"
                  : component.style?.outline,
            outlineOffset: !previewMode && isSelected ? "2px" : "-1px",
          }}
        >
          <div style={{ position: "relative", width: "100%" }}>
            {dragHandleView}

            {children.length === 0 && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: component.props.gap ?? 8,
                  width: "100%",
                  minWidth: 0,
                }}
              >
                <CanvasDropZone
                  previewMode={previewMode}
                  parentId={component.id}
                  index={0}
                  direction="column"
                  draggingIds={draggingIds}
                  activeDropTarget={activeDropTarget}
                  setActiveDropTarget={setActiveDropTarget}
                  onDrop={onDrop}
                  onCreate={onCreate}
                />
              </div>
            )}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                gap,
                width: "100%",
                minWidth: 0,
                position: "relative",
              }}
            >
              {children.map((child, index) => {
                const childIsAbsolute = child.layout?.position === "absolute";

                if (childIsAbsolute) {
                  return (
                    <div key={child.id} style={{ display: "contents" }}>
                      {renderChildNode(child)}
                    </div>
                  );
                }

                return (
                  <div
                    key={child.id}
                    style={{
                      minWidth: 0,
                      maxWidth: "100%",
                      width: "100%",
                    }}
                  >
                    {renderChildNode(child)}

                    {child.type !== "scrollToTopButton" && (
                      <CanvasDropZone
                        previewMode={previewMode}
                        parentId={component.id}
                        index={index + 1}
                        direction="column"
                        draggingIds={draggingIds}
                        activeDropTarget={activeDropTarget}
                        setActiveDropTarget={setActiveDropTarget}
                        onDrop={onDrop}
                        onCreate={onCreate}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </DivBox>
      </div>,
    );
  }

  if (
    component.type === "container" ||
    component.type === "flex" ||
    component.type === "form"
  ) {
    const children = sortedChildren;
    const originalDirection: ContainerDirection =
      component.props.direction ??
      (component.type === "container" || component.type === "flex"
        ? "row"
        : "column");

    const direction: ContainerDirection =
      (isMobile || canvasWidth <= 420) && originalDirection === "row"
        ? "column"
        : originalDirection;

    const isRow = direction === "row";
    const justifyContent =
      component.props.justifyContent ??
      (component.type === "container" ? "space-between" : "flex-start");
    const alignItems = component.props.alignItems ?? "stretch";

    const containerContent = (
      <>
        <CanvasDropZone
          previewMode={previewMode}
          parentId={component.id}
          index={0}
          direction={direction}
          draggingIds={draggingIds}
          activeDropTarget={activeDropTarget}
          setActiveDropTarget={setActiveDropTarget}
          onDrop={onDrop}
          onCreate={onCreate}
        />

        {children.map((child, index) => {
          const childIsAbsolute = child.layout?.position === "absolute";
          const widthMode =
            child.layout?.widthMode ??
            (child.type === "image" || child.type === "imageSlider"
              ? "fill"
              : undefined);
          const childWidth = child.layout?.width;

          const childWrapperStyle = childIsAbsolute
            ? {
                display: "contents",
              }
            : isMobile
              ? {
                  width: "100%",
                  minWidth: 0,
                  maxWidth: "100%",
                  flex: "0 0 auto",
                }
              : isRow
                ? {
                    width:
                      widthMode === "fixed"
                        ? childWidth
                        : widthMode === "fill"
                          ? 0
                          : "auto",
                    flex:
                      widthMode === "fixed"
                        ? "0 0 auto"
                        : widthMode === "fill"
                          ? "1 1 0"
                          : "0 1 auto",

                    minWidth: 0,
                    maxWidth: "100%",
                  }
                : {
                    width:
                      widthMode === "fixed"
                        ? childWidth
                        : widthMode === "auto"
                          ? "auto"
                          : "100%",
                    minWidth: 0,
                    maxWidth: "100%",
                  };

          return (
            <div key={child.id} style={childWrapperStyle}>
              {renderChildNode(child)}

              {!childIsAbsolute &&
                child.type !== "scrollToTopButton" &&
                !isRow && (
                  <CanvasDropZone
                    previewMode={previewMode}
                    parentId={component.id}
                    index={index + 1}
                    direction={direction}
                    draggingIds={draggingIds}
                    activeDropTarget={activeDropTarget}
                    setActiveDropTarget={setActiveDropTarget}
                    onDrop={onDrop}
                    onCreate={onCreate}
                  />
                )}
            </div>
          );
        })}

        {isRow && (
          <CanvasDropZone
            previewMode={previewMode}
            parentId={component.id}
            index={children.length}
            direction={direction}
            draggingIds={draggingIds}
            activeDropTarget={activeDropTarget}
            setActiveDropTarget={setActiveDropTarget}
            onDrop={onDrop}
            onCreate={onCreate}
          />
        )}
      </>
    );

    return renderWithPositionParent(
      <div
        ref={handleComponentRef}
        data-component-id={component.id}
        style={nodeStyle}
        {...jsEventProps}
        onClick={(event) => executeJsActions("click", event)}
        onContextMenu={(event) => {
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
        }}
        onPointerDown={(event) => {
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
        }}
        onPointerMove={(event) => {
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
        }}
        onPointerUp={(event) => {
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
        }}
        onPointerCancel={(event) => {
          clearRuntimeSelectionPreview();

          runtimeSelectionMoved.current = false;
          runtimeSelectionAppended.current = false;
          setRuntimeSelectionVisible(false);

          setRuntimeSelectionStart(null);
          setRuntimeSelectionCurrent(null);

          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
        }}
      >
        <DivBox
          previewMode={previewMode}
          isSelected={isPrimarySelected}
          positionContextId={component.id}
          layout={component.layout}
          onLayoutChange={(layout, recordHistory) =>
            onLayoutChange(component.id, layout, recordHistory)
          }
          onComponentSelect={(multiSelect) =>
            onSelect(component.id, false, multiSelect)
          }
          onEdit={() => onEdit(component.id)}
          onCopy={() => onCopy(component.id)}
          onDelete={() => onDelete(component.id)}
          onToolbarVisibleChange={setEditToolbarVisible}
          snapLayout={snapLayout}
          style={{
            ...component.style,
            transition: "opacity 120ms ease",
            outline:
              !previewMode && isSelected
                ? "2px solid #0d6efd"
                : !previewMode
                  ? "1px dashed #adb5bd"
                  : component.style?.outline,
            outlineOffset: !previewMode && isSelected ? "2px" : "-1px",

            ...presentationEditStyle,
          }}
        >
          <div style={{ position: "relative", width: "100%" }}>
            {dragHandleView}

            {previewMode && runtimeSelectionVisible && runtimeSelectionRect && (
              <div
                style={{
                  position: "absolute",
                  left: runtimeSelectionRect.left,
                  top: runtimeSelectionRect.top,
                  width: runtimeSelectionRect.width,
                  height: runtimeSelectionRect.height,
                  border: "1px solid #38bdf8",
                  background: "rgba(56, 189, 248, 0.15)",
                  pointerEvents: "none",
                  zIndex: 9999,
                }}
              />
            )}

            {component.type === "form" ? (
              <form
                action={component.props.action || undefined}
                method={component.props.method ?? "post"}
                onSubmit={(event) => {
                  event.preventDefault();
                }}
                style={{
                  display: "flex",
                  flexDirection: direction,
                  gap: component.props.gap ?? 8,
                  width: "100%",
                  minWidth: 0,
                  justifyContent,
                  alignItems,
                }}
              >
                {containerContent}
              </form>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: direction,
                  gap: component.props.gap ?? 8,
                  width: "100%",
                  minWidth: 0,
                  justifyContent,
                  alignItems,
                }}
              >
                {containerContent}
              </div>
            )}
          </div>
        </DivBox>
      </div>,
    );
  }

  return renderWithPositionParent(
    <div
      ref={handleComponentRef}
      data-component-id={component.id}
      data-runtime-unit-id={component.id}
      style={nodeStyle}
      {...jsEventProps}
      onClick={(event) => {
        executeJsActions("click", event);

        if (!previewMode) {
          return;
        }

        const clickedUnit = runtimeUnits.get(component.id);

        if (clickedUnit) {
          const selectedIds = runtimeUnits.getSelected();

          const selectedUnits = selectedIds
            .map((id) => runtimeUnits.get(id))
            .filter(
              (
                unit,
              ): unit is NonNullable<ReturnType<typeof runtimeUnits.get>> =>
                Boolean(unit),
            );

          const canAttack = selectedUnits.some(
            (unit) => unit.team !== clickedUnit.team,
          );

          if (canAttack) {
            runtimeUnits.attackSelected(clickedUnit.id);
          } else {
            runtimeUnits.select(clickedUnit.id, event.shiftKey);
          }

          event.preventDefault();
          event.stopPropagation();

          return;
        }
      }}
    >
      <DivBox
        previewMode={previewMode}
        isSelected={isPrimarySelected}
        positionContextId={component.id}
        layout={{
          ...component.layout,
          widthMode: effectiveWidthMode,
        }}
        onLayoutChange={(layout, recordHistory) =>
          onLayoutChange(component.id, layout, recordHistory)
        }
        onComponentSelect={(multiSelect) =>
          onSelect(component.id, false, multiSelect)
        }
        onEdit={() => onEdit(component.id)}
        onCopy={() => onCopy(component.id)}
        onDelete={() => onDelete(component.id)}
        onToolbarVisibleChange={setEditToolbarVisible}
        snapLayout={snapLayout}
        style={{
          ...component.style,
          position: "relative",
          zIndex: isAbsolute ? (component.layout?.zIndex ?? 100) : 0,
          transition: "opacity 120ms ease",
          outline:
            !previewMode && isSelected
              ? "2px solid #0d6efd"
              : component.style?.outline,
          outlineOffset:
            !previewMode && isSelected ? "2px" : component.style?.outlineOffset,
        }}
      >
        {dragHandleView}
        <CanvasComponentContent component={boundComponent} />
      </DivBox>
    </div>,
  );
}

export default memo(LayoutComponentNode);
