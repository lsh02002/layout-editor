import { builderState } from "../../editor/utils/builderState";
import {
  runtimeUnits,
  type RuntimeStatusType,
  type RuntimeUnitSpawnOptions,
} from "../../editor/utils/RuntimeUnitManager";

export const createBuilderApi = () => {
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
