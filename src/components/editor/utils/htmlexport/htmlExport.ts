import type { LayoutComponent } from "../../../../types/types";
import type {
  ComponentRegistry,
  ComponentRegistryShape,
  RegistryComponentType,
} from "../../registry/componentRegistry";
import { codeHighlight } from "../codeHighlight";
import { collectComponentCustomCss } from "../customCssUtils";

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

export const buildHtmlDocument = async (
  componentRegistry: ComponentRegistry,
  components: LayoutComponent[],
  projectCustomCss: string,
) => {
  const body = (
    await Promise.all(
      [...components]
        .sort((a, b) => a.order - b.order)
        .map((component) =>
          renderComponentToHtml(componentRegistry, component),
        ),
    )
  ).join("");

  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
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
  document.querySelectorAll(".builder-textarea").forEach(function (element) {
    element.style.height = "auto";
    element.style.height = element.scrollHeight + "px";
  });
</script>
</body>
</html>`;
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
