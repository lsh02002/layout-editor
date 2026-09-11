import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type PointerEvent,
  type ReactNode,
  type SyntheticEvent,
} from "react";
import { createPortal } from "react-dom";
import DivBox from "./DivBox";
import {
  isLayoutContainer,
  type ComponentLayout,
  type ContainerDirection,
  type LayoutComponent,
} from "../../types/types";
import CanvasComponentContent from "./CanvasComponentContent";
import CanvasDropZone, { type CanvasDropTarget } from "./CanvasDropZone";
import ComponentDragHandle from "./ComponentDragHandle";

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
  const [renderedWidth, setRenderedWidth] = useState<number>(0);
  const [editToolbarVisible, setEditToolbarVisible] = useState(false);
  const [positionParentElement, setPositionParentElement] =
    useState<HTMLElement | null>(null);

  const isSelected = selectedComponentIds.includes(component.id);
  const isPrimarySelected = selectedComponentIds.at(-1) === component.id;
  const isAbsolute = component.layout?.position === "absolute";

  const createBuilderApi = () => {
    const getElement = (id: string) =>
      document.querySelector<HTMLElement>(
        `[data-component-id="${CSS.escape(id)}"]`,
      );

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
        const element = getElement(id);
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
      delay(ms: number, callback: () => void) {
        window.setTimeout(() => {
          callback();
        }, ms);
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

        try {
          const fn = new Function(
            "event",
            "element",
            "component",
            "builder",
            action.code,
          );
          fn(event, event.currentTarget, component, createBuilderApi());
        } catch (error) {
          console.error(`JS Action 실행 실패: ${eventName}`, error);
        }
      });
    },
    [component, previewMode],
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

  const containerMaxWidth =
    component.type === "container" ? component.props.maxWidth : undefined;

  const nodeStyle = {
    position: isAbsolute ? ("absolute" as const) : ("relative" as const),
    left: isAbsolute ? (component.layout?.x ?? 0) : undefined,
    top: isAbsolute ? (component.layout?.y ?? 0) : undefined,
    zIndex: isAbsolute ? 1000 : undefined,
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
      style={nodeStyle}
      {...jsEventProps}
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
        <CanvasComponentContent component={component} />
      </DivBox>
    </div>,
  );
}

export default memo(LayoutComponentNode);
