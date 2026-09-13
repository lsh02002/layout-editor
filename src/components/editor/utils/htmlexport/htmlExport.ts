import {
  isLayoutContainer,
  type LayoutComponent,
} from "../../../../types/types";
import type {
  ComponentRegistry,
  ComponentRegistryShape,
  RegistryComponentType,
} from "../../registry/componentRegistry";
import { codeHighlight } from "../codeHighlight";
import { collectComponentCustomCss } from "../customCssUtils";

const collectComponentJsActions = (components: LayoutComponent[]) => {
  const result: Record<
    string,
    {
      event: string;
      code: string;
      stopPropagation: boolean;
      preventDefault: boolean;
    }[]
  > = {};

  const visit = (component: LayoutComponent) => {
    const actions = (component.jsActions ?? [])
      .filter((action) => action.enabled !== false && action.code.trim())
      .map((action) => ({
        event: action.event,
        code: action.code,
        stopPropagation: action.stopPropagation === true,
        preventDefault: action.preventDefault === true,
      }));

    if (actions.length > 0) {
      result[component.id] = actions;
    }

    if (isLayoutContainer(component)) {
      component.children.forEach(visit);
    }
  };

  components.forEach(visit);

  return result;
};

export async function renderComponentToHtml(
  componentRegistry: ComponentRegistry,
  component: LayoutComponent,
): Promise<string> {
  const definition = componentRegistry[
    component.type as RegistryComponentType
  ] as ComponentRegistryShape;

  return definition.exportHtml(component, {
    renderComponent: (child) => renderComponentToHtml(componentRegistry, child),
  });
}

const obfuscateExportScripts = (html: string) => {
  return html.replace(/<script>([\s\S]*?)<\/script>/gi, (_, scriptContent) => {
    const bytes = new TextEncoder().encode(scriptContent);

    let binary = "";

    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });

    const encoded = btoa(binary);

    return `<script>(()=>{const b=atob("${encoded}"),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);Function(new TextDecoder().decode(u))();})();</script>`;
  });
};

const minifyExportHtml = (html: string) => {
  const protectedBlocks: string[] = [];

  const protectedHtml = html.replace(
    /<(script|style|pre|textarea)\b[\s\S]*?<\/\1>/gi,
    (block) => {
      const index = protectedBlocks.push(block) - 1;

      return `__BUILDER_PROTECTED_BLOCK_${index}__`;
    },
  );

  const minifiedHtml = protectedHtml
    .replace(/\r?\n/g, " ")
    .replace(/>\s+</g, "><")
    .trim();

  return minifiedHtml.replace(
    /__BUILDER_PROTECTED_BLOCK_(\d+)__/g,
    (_, index) => protectedBlocks[Number(index)] ?? "",
  );
};

export const buildHtmlDocument = async (
  componentRegistry: ComponentRegistry,
  components: LayoutComponent[],
  projectCustomCss: string,
) => {
  const componentJsActions = collectComponentJsActions(components);
  const componentStateBindings: Record<
    string,
    {
      target: string;
      stateKey: string;
    }[]
  > = {};

  const collectStateBindings = (component: LayoutComponent) => {
    if ((component.stateBindings ?? []).length > 0) {
      componentStateBindings[component.id] = component.stateBindings ?? [];
    }

    if (isLayoutContainer(component)) {
      component.children.forEach(collectStateBindings);
    }
  };

  components.forEach(collectStateBindings);

  const componentStateBindingsJson = JSON.stringify(componentStateBindings)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");

  const componentJsActionsJson = JSON.stringify(componentJsActions)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");

  const body = (
    await Promise.all(
      [...components]
        .sort((a, b) => a.order - b.order)
        .map((component) =>
          renderComponentToHtml(componentRegistry, component),
        ),
    )
  ).join("");

  const html = `<!doctype html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />
  <link
    href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css"
    rel="stylesheet"
  />
  <title>Exported Page</title>

  <style>
    * {
      box-sizing: border-box;
    }

    html,
    body {
      margin: 0;
      padding: 0;
    }

    body {
      font-family: Arial, Helvetica, sans-serif;
    }

    img {
      max-width: 100%;
    }

    #page-root {
      position: relative;
      width: 100%;
      min-width: 0;
      padding: 24px;
      overflow-x: clip;
    }

    .builder-component img,
    .builder-component video,
    .builder-component iframe {
      max-width: 100%;
    }

    .builder-rich-text p,
    .builder-rich-text blockquote,
    .builder-rich-text ul,
    .builder-rich-text ol {
      margin: 0;
      padding: 0;
    }

    .builder-drop-zone-spacer {
      visibility: hidden;
    }

    /* 모바일 */
    @media (max-width: 767.98px) {
      #page-root {
        padding: 12px;
      }

      .builder-component {
        max-width: 100% !important;
      }

      .builder-component-container,
      .builder-component-flex {
        min-width: 0;
      }

      .builder-container-child {
        min-width: 0 !important;
        max-width: 100% !important;
      }

      .builder-image,
      .builder-video {
        width: 100% !important;
        max-width: 100% !important;
        height: auto;
      }

      .builder-component-container.builder-direction-row,
      .builder-component-flex.builder-direction-row {
        flex-direction: column !important;
      }

      .builder-component-container.builder-direction-row > .builder-container-child,
      .builder-component-flex.builder-direction-row > .builder-container-child {
        width: 100% !important;
        max-width: 100% !important;
        flex: 0 0 auto !important;
      }

      .builder-drop-zone-spacer {
        visibility: hidden !important;
      }

      .builder-drop-zone-spacer.is-row {
        min-width: 24px !important;
        width: 24px;
        min-height: 100%;
      }

      .builder-drop-zone-spacer.is-column {
        min-height: 24px !important;
        height: 24px;
        width: 100%;
      }
    }

    ${codeHighlight}

    ${projectCustomCss}

    ${collectComponentCustomCss(components)}
  </style>
</head>

<body>
  <main
    id="page-root"
    class="builder-preview"
  >
    ${body}
  </main>

  <script>
    (() => {
      document
        .querySelectorAll(".builder-textarea")
        .forEach((element) => {
          element.style.height = "auto";
          element.style.height =
            element.scrollHeight + "px";
        });

      const attachAbsoluteComponents = () => {
        const absoluteComponents =
          document.querySelectorAll(
            ".builder-position-absolute[data-position-parent-id]"
          );

        absoluteComponents.forEach((element) => {
          const parentId =
            element.getAttribute(
              "data-position-parent-id"
            );

          if (!parentId) {
            return;
          }

          const parent =
            document.querySelector(
              '[data-component-id="' +
                CSS.escape(parentId) +
                '"]'
            );

          if (!parent || parent === element) {
            return;
          }

          /*
           * absolute 기준 부모 보장
           */
          const parentPosition =
            window
              .getComputedStyle(parent)
              .position;

          if (parentPosition === "static") {
            parent.style.position = "relative";
          }

          /*
           * 실제 부모가 다르면 이동
           */
          if (element.parentElement !== parent) {
            parent.appendChild(element);
          }
        });
      };

      attachAbsoluteComponents();

      const builderStateStore = new Map();

      const componentStateBindings =
        ${componentStateBindingsJson};

      const applyStateBindings = () => {
        Object.entries(
          componentStateBindings
        ).forEach(
          ([componentId, bindings]) => {
            const root =
              document.querySelector(
                '[data-component-id="' +
                  CSS.escape(componentId) +
                  '"]'
              );

            if (!root) {
              return;
            }

            bindings.forEach((binding) => {
              const hasValue =
                builderStateStore.has(
                  binding.stateKey
                );

              if (
                binding.target === "visible"
              ) {
                const visible =
                  hasValue
                    ? Boolean(
                        builderStateStore.get(
                          binding.stateKey
                        )
                      )
                    : true;

                root.style.display =
                  visible ? "" : "none";

                return;
              }

              if (!hasValue) {
                return;
              }

              const value =
                builderStateStore.get(
                  binding.stateKey
                );

              if (
                binding.target === "text"
              ) {
                const target =
                  root.matches?.(
                    "h1, h2, h3, h4, h5, h6"
                  )
                    ? root
                    : root.querySelector(
                        "h1, h2, h3, h4, h5, h6"
                      ) || root;

                target.textContent =
                  value == null
                    ? ""
                    : String(value);

                return;
              }

              if (
                binding.target === "value"
              ) {
                const target =
                  root.matches?.(
                    "input, textarea, select"
                  )
                    ? root
                    : root.querySelector(
                        "input, textarea, select"
                      );

                if (
                  target &&
                  "value" in target
                ) {
                  target.value =
                    value == null
                      ? ""
                      : String(value);
                }
              }
            });
          }
        );
      };

      const builderState = {
        get(key, fallback) {
          if (!builderStateStore.has(key)) {
            return fallback;
          }

          return builderStateStore.get(key);
        },

        set(key, value) {
          builderStateStore.set(key, value);
          applyStateBindings();
          return value;
        },

        has(key) {
          return builderStateStore.has(key);
        },

        add(key, amount = 1) {
          const current = Number(
            builderStateStore.get(key) ?? 0
          );

          const next =
            (
              Number.isFinite(current)
                ? current
                : 0
            ) + amount;

          builderStateStore.set(
            key,
            next
          );

          applyStateBindings();

          return next;
        },

        toggle(key) {
          const next =
            !Boolean(
              builderStateStore.get(key)
            );

          builderStateStore.set(
            key,
            next
          );

          applyStateBindings();

          return next;
        },

        remove(key) {
          const result =
            builderStateStore.delete(
              key
            );

          applyStateBindings();

          return result;
        },

        reset() {
          builderStateStore.clear();
          applyStateBindings();
        },

        all() {
          return Object.fromEntries(
            builderStateStore.entries()
          );
        },
      };

      const createBuilderApi = () => {
        const getElement = (id) =>
          document.querySelector(
            '[data-component-id="' +
              CSS.escape(id) +
              '"]'
          );

        const getFormElement = (id) => {
          const root = getElement(id);

          if (!root) {
            return null;
          }

          if (
            root.matches?.(
              "input, textarea, select, button"
            )
          ) {
            return root;
          }

          return root.querySelector(
            "input, textarea, select, button"
          );
        };

        const getCheckableElement = (id) => {
          const root = getElement(id);

          if (!root) {
            return null;
          }

          if (
            root.matches?.(
              'input[type="checkbox"], input[type="radio"]'
            )
          ) {
            return root;
          }

          return root.querySelector(
            'input[type="checkbox"], input[type="radio"]'
          );
        };

        return {
          state: builderState,

          getElement,

          show(id) {
            const element = getElement(id);

            if (!element) {
              return;
            }

            element.style.display = "";
          },

          hide(id) {
            const element = getElement(id);

            if (!element) {
              return;
            }

            element.style.display = "none";
          },

          toggle(id) {
            const element = getElement(id);

            if (!element) {
              return;
            }

            const isHidden =
              window
                .getComputedStyle(element)
                .display === "none";

            element.style.display =
              isHidden ? "" : "none";
          },

          setText(id, text) {
            const element = getElement(id);

            if (!element) {
              return;
            }

            element.textContent = text;
          },

          setStyle(id, property, value) {
            const element = getElement(id);

            if (!element) {
              return;
            }

            element.style.setProperty(
              property,
              value
            );
          },

          addClass(id, className) {
            const element = getElement(id);

            if (!element) {
              return;
            }

            element.classList.add(className);
          },

          removeClass(id, className) {
            const element = getElement(id);

            if (!element) {
              return;
            }

            element.classList.remove(className);
          },

          toggleClass(id, className) {
            const element = getElement(id);

            if (!element) {
              return;
            }

            element.classList.toggle(className);
          },

          setAttribute(id, name, value) {
            const element = getElement(id);

            if (!element) {
              return;
            }

            element.setAttribute(
              name,
              value
            );
          },

          removeAttribute(id, name) {
            const element = getElement(id);

            if (!element) {
              return;
            }

            element.removeAttribute(name);
          },

          scrollTo(id, behavior = "smooth") {
            const element = getElement(id);

            if (!element) {
              return;
            }

            element.scrollIntoView({
              behavior,
              block: "start"
            });
          },

          setValue(id, value) {
            const element = getFormElement(id);

            if (
              !element ||
              !("value" in element)
            ) {
              return;
            }

            element.value = value;

            element.dispatchEvent(
              new Event("input", {
                bubbles: true,
              })
            );

            element.dispatchEvent(
              new Event("change", {
                bubbles: true,
              })
            );
          },

          getValue(id) {
            const element = getFormElement(id);

            if (
              !element ||
              !("value" in element)
            ) {
              return "";
            }

            return element.value;
          },

          focus(id) {
            getFormElement(id)?.focus();
          },

          blur(id) {
            getFormElement(id)?.blur();
          },

          enable(id) {
            const element = getFormElement(id);

            if (element) {
              element.disabled = false;
            }
          },

          disable(id) {
            const element = getFormElement(id);

            if (element) {
              element.disabled = true;
            }
          },

          exists(id) {
            return getElement(id) !== null;
          },

          isVisible(id) {
            const element = getElement(id);

            if (!element) {
              return false;
            }

            const style =
              window.getComputedStyle(element);

            return (
              style.display !== "none" &&
              style.visibility !== "hidden" &&
              style.opacity !== "0" &&
              element.getClientRects().length > 0
            );
          },

          setChecked(id, checked) {
            const element =
              getCheckableElement(id);

            if (!element) {
              return;
            }

            element.checked = checked;

            element.dispatchEvent(
              new Event("change", {
                bubbles: true,
              })
            );
          },

          getChecked(id) {
            return (
              getCheckableElement(id)?.checked ??
              false
            );
          },

          trigger(id, eventName) {
            const root = getElement(id);

            if (!root) {
              return;
            }

            const target =
              root.matches?.(
                "button, input, select, textarea, a"
              )
                ? root
                : root.querySelector(
                    "button, input, select, textarea, a"
                  ) || root;

            if (
              eventName === "click" &&
              typeof target.click === "function"
            ) {
              target.click();
              return;
            }

            target.dispatchEvent(
              new Event(eventName, {
                bubbles: true,
                cancelable: true,
              })
            );
          },

          submit(id) {
            const root = getElement(id);

            const form =
              root?.matches?.("form")
                ? root
                : root?.querySelector("form");

            form?.requestSubmit();
          },

          reset(id) {
            const root = getElement(id);

            const form =
              root?.matches?.("form")
                ? root
                : root?.querySelector("form");

            form?.reset();
          },

          toggleChecked(id) {
            const element =
              getCheckableElement(id);

            if (!element) {
              return;
            }

            element.checked =
              !element.checked;

            element.dispatchEvent(
              new Event("change", {
                bubbles: true
              })
            );
          },

          // setHtml(id, html) {
          //   const element = getElement(id);

          //   if (!element) {
          //     return;
          //   }

          //   element.innerHTML = html;
          // },

          getText(id) {
            const element = getElement(id);

            return element?.textContent ?? "";
          },

          getAttribute(id, name) {
            const element = getElement(id);

            return (
              element?.getAttribute(name) ??
              null
            );
          },

          hasClass(id, className) {
            const element = getElement(id);

            return (
              element?.classList.contains(
                className
              ) ?? false
            );
          },
          delay(ms) {
            return new Promise((resolve) => {
              window.setTimeout(resolve, ms);
            });
          },

          navigate(url) {
            window.location.href = url;
          },

          open(url, target = "_blank") {
            window.open(url, target);
          },

          async copy(text) {
            try {
              await navigator.clipboard.writeText(text);
              return true;
            } catch {
              return false;
            }
          },

          toggleDisabled(id) {
            const element = getFormElement(id);

            if (!element) {
              return;
            }

            element.disabled = !element.disabled;
          },
        };
      };

      const AsyncFunction =
        Object.getPrototypeOf(
          async function () {}
        ).constructor;

      const componentJsActions =
        ${componentJsActionsJson};

      Object.entries(
        componentJsActions
      ).forEach(
        ([componentId, actions]) => {
          const element =
            document.querySelector(
              '[data-component-id="' +
                CSS.escape(componentId) +
                '"]'
            );

          if (!element) {
            return;
          }

          actions.forEach((action) => {
            /*
             * React의 onFocus/onBlur는
             * bubbling처럼 동작하므로
             * export에서도 focusin/out으로 맞춘다.
             */
            const eventName =
              action.event === "focus"
                ? "focusin"
                : action.event === "blur"
                  ? "focusout"
                  : action.event;

            element.addEventListener(
              eventName,
              (event) => {
                if (action.preventDefault) {
                  event.preventDefault();
                }
                if (action.stopPropagation) {
                  event.stopPropagation();
                }

                try {
                  const fn =
                    new AsyncFunction(
                      "event",
                      "element",
                      "component",
                      "builder",
                      action.code
                    );

                  void fn(
                    event,
                    element,
                    {
                      id: componentId,
                      element: element,
                    },
                    createBuilderApi()
                  ).catch((error) => {
                    console.error(
                      "JS Action 실행 실패:",
                      componentId,
                      action.event,
                      error
                    );
                  });
                } catch (error) {
                  console.error(
                    "JS Action 생성 실패:",
                    componentId,
                    action.event,
                    error
                  );
                }
              }
            );
          });
        }
      );
    })();
  </script>
</body>
</html>`;

  return minifyExportHtml(obfuscateExportScripts(html));
};

const fallbackDownloadHtml = (html: string, fileName: string) => {
  const blob = new Blob([html], {
    type: "text/html;charset=utf-8",
  });

  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = fileName;

  document.body.appendChild(anchor);

  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(url);
};

interface FilePickerAcceptType {
  description?: string;

  accept: Record<string, string[]>;
}

interface SaveFilePickerOptions {
  suggestedName?: string;

  types?: FilePickerAcceptType[];

  excludeAcceptAllOption?: boolean;
}

interface Window {
  showSaveFilePicker(
    options?: SaveFilePickerOptions,
  ): Promise<FileSystemFileHandle>;
}

type SaveFilePickerWindow = Window & {
  showSaveFilePicker: (
    options?: SaveFilePickerOptions,
  ) => Promise<FileSystemFileHandle>;
};

export const downloadHtmlFile = async (
  componentRegistry: ComponentRegistry,
  components: LayoutComponent[],
  projectCustomCss: string,
) => {
  try {
    const html = await buildHtmlDocument(
      componentRegistry,
      components,
      projectCustomCss,
    );

    const fileName = "page.html";

    if ("showSaveFilePicker" in window) {
      const pickerWindow = window as SaveFilePickerWindow;
      const handle = await pickerWindow.showSaveFilePicker({
        suggestedName: fileName,

        types: [
          {
            description: "HTML File",
            accept: {
              "text/html": [".html"],
            },
          },
        ],

        excludeAcceptAllOption: false,
      });

      const writable = await handle.createWritable();

      await writable.write(html);
      await writable.close();

      return;
    }

    fallbackDownloadHtml(html, fileName);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return;
    }

    console.error("HTML 저장 실패:", error);

    alert("HTML 저장 중 오류가 발생했습니다.");
  }
};
