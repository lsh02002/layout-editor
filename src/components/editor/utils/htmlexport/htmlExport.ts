import type { LayoutComponent } from "../../../../types/types";
import { codeHighlight } from "../codeHighlight";
import { componentRegistry } from "../../registry/componentRegistry";
import { collectComponentCustomCss } from "../customCssUtils";

const componentToHtml = async (component: LayoutComponent): Promise<string> => {
  const definition = componentRegistry[component.type];

  return definition.exportHtml(component, {
    renderComponent: componentToHtml,
  });
};

export const buildHtmlDocument = async (
  components: LayoutComponent[],
  projectCustomCss: string,
) => {
  const body = (
    await Promise.all(
      [...components].sort((a, b) => a.order - b.order).map(componentToHtml),
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

    body {
      margin: 0;
      padding: 16px;
      font-family: Arial, Helvetica, sans-serif;
    }

    img {
      max-width: 100%;
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
</body>
</html>`;
};

export const downloadHtmlFile = async (
  components: LayoutComponent[],
  projectCustomCss: string,
) => {
  try {
    const html = await buildHtmlDocument(components, projectCustomCss);

    const blob = new Blob([html], {
      type: "text/html;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);

    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = "page.html";

    document.body.appendChild(anchor);

    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("HTML 저장 실패:", error);

    alert("HTML 저장 중 오류가 발생했습니다.");
  }
};
