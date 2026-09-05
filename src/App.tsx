import { createElement } from "react";
import {
  AlignLeft,
  ArrowUpToLine,
  Box,
  Code2,
  Heading1,
  ImageIcon,
  Images,
  Link2,
  Minus,
  MousePointerClick,
  MoveVertical,
  PlaySquare,
  TextQuote,
} from "lucide-react";
import { z } from "zod";
import LayoutEditor from "./components/editor/LayoutEditor";
import { FAKE_IMAGE_SLIDER_URLS, FAKE_IMAGE_URL } from "./data/data";
import RegistryFieldsEditor, {
  CodeEditorEditor,
  ContainerEditor,
  ImageEditor,
  ImageGalleryEditor,
  ImageSliderEditor,
  LinkEditor,
  QuillEditor,
  ScrollToTopButtonEditor,
  VideoEditor,
} from "./components/editor/edit/componentEditors";
import {
  ButtonRenderer,
  CodeEditorRenderer,
  DividerRenderer,
  HeadingRenderer,
  ImageGalleryRenderer,
  ImageRenderer,
  ImageSliderRenderer,
  LinkRenderer,
  QuillRenderer,
  ScrollToTopRenderer,
  SpacerRenderer,
  TextareaRenderer,
  VideoRenderer,
} from "./components/canvas/renderers";
import {
  exportButtonHtml,
  exportCodeEditorHtml,
  exportContainerHtml,
  exportDividerHtml,
  exportHeadingHtml,
  exportImageGalleryHtml,
  exportImageHtml,
  exportImageSliderHtml,
  exportLinkHtml,
  exportQuillHtml,
  exportScrollToTopHtml,
  exportSpacerHtml,
  exportTextareaHtml,
  exportVideoHtml,
} from "./components/editor/utils/htmlexport/htmlExporters";
import type { EditorConfig } from "./components/editor/registry/componentRegistry";

const config = {
  components: {
    container: {
      label: "Container",
      description: "컴포넌트를 묶는 영역",
      icon: Box,
      supportsDisabled: false,
      propsSchema: z.object({
        direction: z.enum(["row", "column"]).optional(),
        gap: z.number().finite().optional(),
        justifyContent: z
          .enum(["flex-start", "center", "flex-end", "space-between"])
          .optional(),
        alignItems: z
          .enum(["stretch", "flex-start", "center", "flex-end"])
          .optional(),
        maxWidth: z.number().finite().positive().optional(),
      }),
      fields: {
        direction: {
          type: "select",
          label: "방향",
          options: [
            { label: "가로", value: "row" },
            { label: "세로", value: "column" },
          ],
        },
        gap: {
          type: "number",
          label: "간격",
          min: 0,
        },
        justifyContent: {
          type: "select",
          label: "가로 정렬",
          options: [
            { label: "Start", value: "flex-start" },
            { label: "Center", value: "center" },
            { label: "End", value: "flex-end" },
            { label: "Space Between", value: "space-between" },
          ],
        },
        alignItems: {
          type: "select",
          label: "세로 정렬",
          options: [
            { label: "Stretch", value: "stretch" },
            { label: "Start", value: "flex-start" },
            { label: "Center", value: "center" },
            { label: "End", value: "flex-end" },
          ],
        },
        maxWidth: {
          type: "number",
          label: "최대 너비",
          min: 1,
        },
      },
      defaultProps: {
        direction: "column",
        gap: 8,
        justifyContent: "space-between",
        alignItems: "stretch",
        maxWidth: undefined,
      },
      createComponent: (id, props) => ({
        id,
        name: "Container",
        type: "container" as const,
        order: 0,
        props,
        style: {
          width: "100%",
          minHeight: 100,
          padding: 12,
        },
        children: [],
      }),
      editor: (context) => createElement(ContainerEditor, context),
      getSearchText: (component) => {
        if (component.type !== "container") {
          return "";
        }
        return "container 컨테이너";
      },
      exportHtml: exportContainerHtml,
    },

    heading: {
      label: "Heading",
      description: "제목 텍스트",
      icon: Heading1,
      supportsDisabled: false,
      propsSchema: z.object({
        text: z.string(),
        level: z.union([
          z.literal(1),
          z.literal(2),
          z.literal(3),
          z.literal(4),
          z.literal(5),
          z.literal(6),
        ]),
      }),

      fields: {
        text: {
          type: "text",
          label: "제목",
          placeholder: "제목을 입력하세요",
        },
        level: {
          type: "select",
          label: "Heading Level",
          options: [
            { label: "H1", value: 1 },
            { label: "H2", value: 2 },
            { label: "H3", value: 3 },
            { label: "H4", value: 4 },
            { label: "H5", value: 5 },
            { label: "H6", value: 6 },
          ],
        },
      },

      defaultProps: {
        text: "Heading",
        level: 2,
      },

      createComponent: (id, props) => ({
        id,
        name: "Heading",
        type: "heading" as const,
        order: 0,
        props,
      }),

      editor: (context) => createElement(RegistryFieldsEditor, context),
      canvas: (component) => {
        if (component.type !== "heading") {
          return null;
        }

        return createElement(HeadingRenderer, {
          component,
        });
      },

      getSearchText: (component) => {
        if (component.type !== "heading") {
          return "";
        }

        return [
          component.props.text,
          `h${component.props.level}`,
          "heading",
          "제목",
        ]
          .filter(Boolean)
          .join(" ");
      },

      getDisplayName: (component) => {
        if (component.type !== "heading") {
          return "";
        }

        return (
          component.props.text?.trim() || component.name?.trim() || "Heading"
        );
      },

      exportHtml: exportHeadingHtml,
    },

    textarea: {
      label: "TextArea",
      description: "일반 텍스트",
      icon: AlignLeft,
      supportsDisabled: true,
      propsSchema: z.object({
        value: z.string(),
        rows: z.number().int().positive().optional(),
        placeholder: z.string().optional(),
        disabled: z.boolean().optional(),
      }),

      fields: {
        value: {
          type: "textarea",
          label: "내용",
          placeholder: "내용을 입력하세요.",
        },
        rows: {
          type: "number",
          label: "행 수",
          min: 1,
        },
        placeholder: {
          type: "text",
          label: "Placeholder",
          placeholder: "내용을 입력하세요.",
        },
        disabled: {
          type: "checkbox",
          label: "비활성화",
        },
      },
      defaultProps: {
        value: "",
        rows: 3,
        placeholder: "내용을 입력하세요.",
        disabled: false,
      },
      createComponent: (id, props) => ({
        id,
        name: "Textarea",
        type: "textarea" as const,
        order: 0,
        props,
        style: {
          width: "100%",
        },
      }),
      editor: (context) => createElement(RegistryFieldsEditor, context),
      canvas: (component) => {
        if (component.type !== "textarea") {
          return null;
        }

        return createElement(TextareaRenderer, {
          component,
        });
      },

      getSearchText: (component) => {
        if (component.type !== "textarea") {
          return "";
        }

        return [component.props.value, component.props.placeholder]
          .filter(Boolean)
          .join(" ");
      },

      getDisplayName: (component) => {
        if (component.type !== "textarea") {
          return "";
        }

        return (
          component.props.value?.trim() ||
          component.name?.trim() ||
          component.props.placeholder?.trim() ||
          "TextArea"
        );
      },

      exportHtml: exportTextareaHtml,
    },

    quill: {
      label: "Quill",
      description: "리치 텍스트",
      icon: TextQuote,
      supportsDisabled: true,
      propsSchema: z.object({
        value: z.string(),
        placeholder: z.string().optional(),
        disabled: z.boolean().optional(),
      }),

      fields: {
        value: {
          type: "textarea",
          label: "초기 내용",
          placeholder: "본문을 입력하세요.",
        },
        placeholder: {
          type: "text",
          label: "Placeholder",
          placeholder: "본문을 입력하세요.",
        },
        disabled: {
          type: "checkbox",
          label: "비활성화",
        },
      },
      defaultProps: {
        value: "",
        placeholder: "본문을 입력하세요.",
        disabled: false,
      },
      createComponent: (id, props) => ({
        id,
        name: "RichText",
        type: "quill" as const,
        order: 0,
        props,
        style: {
          width: "100%",
        },
      }),
      editor: (context) => createElement(QuillEditor, context),
      canvas: (component) => {
        if (component.type !== "quill") {
          return null;
        }

        return createElement(QuillRenderer, {
          component,
        });
      },

      getSearchText: (component) => {
        if (component.type !== "quill") {
          return "";
        }

        return [
          component.props.value
            ?.replace(/<[^>]*>/g, " ")
            .replace(/\s+/g, " ")
            .trim(),
          component.props.placeholder,
        ]
          .filter(Boolean)
          .join(" ");
      },

      getDisplayName: (component) => {
        if (component.type !== "quill") {
          return "";
        }

        const text = component.props.value
          ?.replace(/<[^>]*>/g, " ")
          .replace(/\s+/g, " ")
          .trim();

        return (
          text ||
          component.name?.trim() ||
          component.props.placeholder?.trim() ||
          "Quill"
        );
      },

      exportHtml: exportQuillHtml,
    },

    button: {
      label: "Button",
      description: "버튼",
      icon: MousePointerClick,
      supportsDisabled: true,
      propsSchema: z.object({
        title: z.string(),
        disabled: z.boolean().optional(),
        action: z.object({
          type: z.enum(["none", "submit", "reset", "navigate", "scrollToTop"]),
          payload: z.string().nullable().optional(),
        }),
      }),
      fields: {
        title: {
          type: "text",
          label: "버튼명",
          placeholder: "버튼",
        },
        disabled: {
          type: "checkbox",
          label: "비활성화",
        },
      },
      defaultProps: {
        title: "버튼",
        disabled: false,
        action: {
          type: "none",
          payload: null,
        },
      },
      createComponent: (id, props) => ({
        id,
        name: "Button",
        type: "button" as const,
        order: 0,
        props,
        style: {
          width: "100%",
        },
      }),
      editor: (context) => createElement(RegistryFieldsEditor, context),
      canvas: (component) => {
        if (component.type !== "button") {
          return null;
        }

        return createElement(ButtonRenderer, {
          component,
        });
      },

      getSearchText: (component) => {
        if (component.type !== "button") {
          return "";
        }

        return component.props.title ?? "";
      },

      getDisplayName: (component) => {
        if (component.type !== "button") {
          return "";
        }

        return (
          component.props.title?.trim() || component.name?.trim() || "Button"
        );
      },

      exportHtml: exportButtonHtml,
    },

    scrollToTopButton: {
      label: "ScrollToTop",
      description: "페이지 상단 이동 버튼",
      icon: ArrowUpToLine,
      supportsDisabled: true,
      maxInstances: 1,
      propsSchema: z.object({
        title: z.string(),
        disabled: z.boolean().optional(),
        action: z.object({
          type: z.enum(["scrollToTop"]),
          payload: z.string().nullable().optional(),
        }),
      }),

      fields: {
        title: {
          type: "text",
          label: "버튼명",
          placeholder: "↑",
        },
        disabled: {
          type: "checkbox",
          label: "비활성화",
        },
      },
      defaultProps: {
        title: "↑",
        disabled: false,
        action: {
          type: "scrollToTop",
          payload: null,
        },
      },
      createComponent: (id, props) => ({
        id,
        name: "ScrollToTopButton",
        type: "scrollToTopButton" as const,
        order: 0,
        props,
        style: {
          position: "fixed",
          width: "50px",
          height: "50px",
          right: "10px",
          bottom: "10px",
          zIndex: 1400,
        },
      }),
      editor: (context) => createElement(ScrollToTopButtonEditor, context),
      canvas: (component) => {
        if (component.type !== "scrollToTopButton") {
          return null;
        }

        return createElement(ScrollToTopRenderer, {
          component,
        });
      },

      getSearchText: (component) => {
        if (component.type !== "scrollToTopButton") {
          return "";
        }

        return [component.props.title, "scrollToTop", "scroll top", "맨위로"]
          .filter(Boolean)
          .join(" ");
      },

      getDisplayName: (component) => {
        if (component.type !== "scrollToTopButton") {
          return "";
        }

        return (
          component.props.title?.trim() ||
          component.name?.trim() ||
          "ScrollToTop"
        );
      },

      exportHtml: exportScrollToTopHtml,
    },

    image: {
      label: "Image",
      description: "이미지",
      icon: ImageIcon,
      supportsDisabled: true,
      propsSchema: z.object({
        urls: z
          .array(z.string())
          .max(1, "Image 컴포넌트는 이미지 1개만 허용됩니다."),
        maxCount: z.number().int().positive().optional(),
        disabled: z.boolean().optional(),
      }),
      fields: {
        urls: {
          type: "text",
          label: "이미지 URL",
          placeholder: "https://example.com/image.jpg",
          getValue: (value) =>
            Array.isArray(value) && typeof value[0] === "string"
              ? value[0]
              : "",
          setValue: (value) => (value.trim() ? [value] : []),
        },
        disabled: {
          type: "checkbox",
          label: "비활성화",
        },
      },
      defaultProps: {
        urls: [FAKE_IMAGE_URL],
        maxCount: 1,
        disabled: false,
      },
      createComponent: (id, props) => ({
        id,
        name: "Image",
        type: "image" as const,
        order: 0,
        props,
        style: {
          width: "100%",
        },
      }),
      editor: (context) => createElement(ImageEditor, context),
      canvas: (component) => {
        if (component.type !== "image") {
          return null;
        }
        return createElement(ImageRenderer, {
          component,
        });
      },
      getSearchText: (component) => {
        if (component.type !== "image") {
          return "";
        }
        return "image 이미지";
      },
      exportHtml: exportImageHtml,
    },

    imageGallery: {
      label: "Image Gallery",
      description: "여러 이미지를 갤러리로 표시",
      icon: Images,
      supportsDisabled: true,
      propsSchema: z.object({
        urls: z.array(z.string()),
        columns: z.number().int().positive().optional(),
        gap: z.number().finite().nonnegative().optional(),
        objectFit: z.enum(["cover", "contain", "fill"]).optional(),
        borderRadius: z.number().finite().nonnegative().optional(),
      }),
      fields: {
        columns: {
          type: "number",
          label: "열 개수",
          min: 1,
        },
        gap: {
          type: "number",
          label: "간격",
          min: 0,
        },
        objectFit: {
          type: "select",
          label: "이미지 맞춤",
          options: [
            { label: "Cover", value: "cover" },
            { label: "Contain", value: "contain" },
            { label: "Fill", value: "fill" },
          ],
        },
        borderRadius: {
          type: "number",
          label: "둥근 모서리",
          min: 0,
        },
      },
      defaultProps: {
        urls: FAKE_IMAGE_SLIDER_URLS,
        columns: 3,
        gap: 8,
        objectFit: "cover",
        borderRadius: 8,
      },
      createComponent: (id, props) => ({
        id,
        name: "ImageGallery",
        type: "imageGallery" as const,
        order: 0,
        props,
        layout: {
          widthMode: "fill",
          heightMode: "auto",
        },
        style: {
          width: "100%",
        },
      }),
      editor: (context) => createElement(ImageGalleryEditor, context),
      canvas: (component) => {
        if (component.type !== "imageGallery") {
          return null;
        }
        return createElement(ImageGalleryRenderer, {
          component,
        });
      },
      getSearchText: (component) => {
        if (component.type !== "imageGallery") {
          return "";
        }
        return ["image gallery", "gallery", "이미지 갤러리", "갤러리"].join(
          " ",
        );
      },
      exportHtml: exportImageGalleryHtml,
    },

    imageSlider: {
      label: "Image Slider",
      description: "여러 이미지를 슬라이드",
      icon: Images,
      supportsDisabled: true,
      propsSchema: z.object({
        urls: z.array(z.string()),
        autoplay: z.boolean().optional(),
        interval: z.number().finite().positive().optional(),
        showArrows: z.boolean().optional(),
        showDots: z.boolean().optional(),
        loop: z.boolean().optional(),
      }),
      fields: {
        autoplay: {
          type: "checkbox",
          label: "자동 재생",
        },
        interval: {
          type: "number",
          label: "재생 간격",
          min: 100,
        },
        showArrows: {
          type: "checkbox",
          label: "화살표 표시",
        },
        showDots: {
          type: "checkbox",
          label: "인디케이터 표시",
        },
        loop: {
          type: "checkbox",
          label: "반복 재생",
        },
      },
      defaultProps: {
        urls: FAKE_IMAGE_SLIDER_URLS,
        autoplay: true,
        interval: 3000,
        showArrows: true,
        showDots: true,
        loop: true,
      },
      createComponent: (id, props) => ({
        id,
        name: "ImageSlider",
        type: "imageSlider" as const,
        order: 0,
        props,
        layout: {
          widthMode: "fill",
          heightMode: "fixed",
          height: 320,
        },
        style: {
          width: "100%",
        },
      }),
      editor: (context) => createElement(ImageSliderEditor, context),
      canvas: (component) => {
        if (component.type !== "imageSlider") {
          return null;
        }
        return createElement(ImageSliderRenderer, {
          component,
        });
      },
      getSearchText: (component) => {
        if (component.type !== "imageSlider") {
          return "";
        }
        return [
          "image slider",
          "slider",
          "carousel",
          "이미지 슬라이더",
          "슬라이더",
        ].join(" ");
      },
      exportHtml: exportImageSliderHtml,
    },

    video: {
      label: "Video",
      description: "동영상",
      icon: PlaySquare,
      supportsDisabled: true,
      propsSchema: z.object({
        src: z.string(),
        controls: z.boolean().optional(),
        autoplay: z.boolean().optional(),
        muted: z.boolean().optional(),
        loop: z.boolean().optional(),
      }),
      fields: {
        src: {
          type: "text",
          label: "동영상 URL",
          placeholder: "https://example.com/video.mp4",
        },
        controls: {
          type: "checkbox",
          label: "컨트롤 표시",
        },
        autoplay: {
          type: "checkbox",
          label: "자동 재생",
        },
        muted: {
          type: "checkbox",
          label: "음소거",
        },
        loop: {
          type: "checkbox",
          label: "반복 재생",
        },
      },
      defaultProps: {
        src: "",
        controls: true,
        autoplay: false,
        muted: false,
        loop: false,
      },
      createComponent: (id, props) => ({
        id,
        name: "Video",
        type: "video" as const,
        order: 0,
        props,
        style: {
          width: "100%",
        },
        contentStyle: {
          width: "100%",
          borderRadius: 8,
        },
      }),
      editor: (context) => createElement(VideoEditor, context),
      canvas: (component) => {
        if (component.type !== "video") {
          return null;
        }
        return createElement(VideoRenderer, {
          component,
        });
      },
      getSearchText: (component) => {
        if (component.type !== "video") {
          return "";
        }
        return [component.props.src, "video", "동영상", "영상"]
          .filter(Boolean)
          .join(" ");
      },
      exportHtml: exportVideoHtml,
    },

    link: {
      label: "Link",
      description: "링크",
      icon: Link2,
      supportsDisabled: true,
      propsSchema: z.object({
        title: z.string(),
        linkType: z.enum(["url", "email", "tel"]),
        value: z.string(),
        newWindow: z.boolean().optional(),
        disabled: z.boolean().optional(),
      }),

      fields: {
        title: {
          type: "text",
          label: "링크명",
          placeholder: "링크",
        },
        linkType: {
          type: "select",
          label: "링크 타입",
          options: [
            { label: "URL", value: "url" },
            { label: "Email", value: "email" },
            { label: "Tel", value: "tel" },
          ],
        },
        value: {
          type: "text",
          label: "링크 값",
          placeholder: "https://example.com",
        },
        newWindow: {
          type: "checkbox",
          label: "새 창에서 열기",
        },
        disabled: {
          type: "checkbox",
          label: "비활성화",
        },
      },
      defaultProps: {
        title: "링크",
        linkType: "url",
        value: "",
        newWindow: false,
        disabled: false,
      },
      createComponent: (id, props) => ({
        id,
        name: "Link",
        type: "link" as const,
        order: 0,
        props,
        style: {
          width: "100%",
        },
        contentStyle: {
          color: "#0d6efd",
          textDecoration: "underline",
          cursor: "pointer",
        },
      }),
      editor: (context) => createElement(LinkEditor, context),
      canvas: (component) => {
        if (component.type !== "link") {
          return null;
        }

        return createElement(LinkRenderer, {
          component,
        });
      },

      getSearchText: (component) => {
        if (component.type !== "link") {
          return "";
        }

        return [
          component.props.title,
          component.props.value,
          component.props.linkType,
          "link",
          "링크",
        ]
          .filter(Boolean)
          .join(" ");
      },

      getDisplayName: (component) => {
        if (component.type !== "link") {
          return "";
        }

        return (
          component.props.value?.trim() ||
          component.props.title?.trim() ||
          component.name?.trim() ||
          "Link"
        );
      },

      exportHtml: exportLinkHtml,
    },

    divider: {
      label: "Divider",
      description: "구분선",
      icon: Minus,
      supportsDisabled: false,
      propsSchema: z.object({
        thickness: z.number().finite().positive().optional(),
        color: z.string().optional(),
        lineStyle: z.enum(["solid", "dashed", "dotted"]).optional(),
      }),
      fields: {
        thickness: {
          type: "number",
          label: "두께",
          min: 1,
        },
        color: {
          type: "text",
          label: "색상",
          placeholder: "#dee2e6",
        },
        lineStyle: {
          type: "select",
          label: "선 스타일",
          options: [
            { label: "Solid", value: "solid" },
            { label: "Dashed", value: "dashed" },
            { label: "Dotted", value: "dotted" },
          ],
        },
      },
      defaultProps: {
        thickness: 3,
        color: "#dee2e6",
        lineStyle: "solid",
      },
      createComponent: (id, props) => ({
        id,
        name: "Divider",
        type: "divider" as const,
        order: 0,
        props,
        style: {
          width: "100%",
        },
      }),
      editor: (context) => createElement(RegistryFieldsEditor, context),
      canvas: (component) => {
        if (component.type !== "divider") {
          return null;
        }
        return createElement(DividerRenderer, {
          component,
        });
      },
      getSearchText: (component) => {
        if (component.type !== "divider") {
          return "";
        }
        return "divider 구분선 선";
      },
      exportHtml: exportDividerHtml,
    },

    spacer: {
      label: "Spacer",
      description: "여백",
      icon: MoveVertical,
      supportsDisabled: false,
      propsSchema: z.object({
        height: z.number().finite().nonnegative(),
      }),
      fields: {
        height: {
          type: "number",
          label: "높이",
          min: 0,
        },
      },
      defaultProps: {
        height: 32,
      },
      createComponent: (id, props) => ({
        id,
        name: "Spacer",
        type: "spacer" as const,
        order: 0,
        props,
        style: {
          width: "100%",
        },
      }),
      editor: (context) => createElement(RegistryFieldsEditor, context),
      canvas: (component) => {
        if (component.type !== "spacer") {
          return null;
        }
        return createElement(SpacerRenderer, {
          component,
        });
      },
      getSearchText: (component) => {
        if (component.type !== "spacer") {
          return "";
        }
        return "spacer 여백 공백";
      },
      exportHtml: exportSpacerHtml,
    },

    codeEditor: {
      label: "Highlighter",
      description: "코드 편집기",
      icon: Code2,
      supportsDisabled: true,
      propsSchema: z.object({
        value: z.string(),
        language: z.enum(["css", "html", "javascript", "typescript", "json"]),
        readOnly: z.boolean().optional(),
      }),
      fields: {
        value: {
          type: "textarea",
          label: "초기 코드",
          placeholder: "코드를 입력하세요",
        },
        language: {
          type: "select",
          label: "언어",
          options: [
            { label: "JavaScript", value: "javascript" },
            { label: "TypeScript", value: "typescript" },
            { label: "HTML", value: "html" },
            { label: "CSS", value: "css" },
            { label: "JSON", value: "json" },
          ],
        },
        readOnly: {
          type: "checkbox",
          label: "읽기 전용",
        },
      },
      defaultProps: {
        value: `const hello = "Hello World";\n\nconsole.log(hello);`,
        language: "javascript",
        readOnly: false,
      },
      createComponent: (id, props) => ({
        id,
        name: "CodeEditor",
        type: "codeEditor" as const,
        order: 0,
        props,
        style: {
          width: "100%",
        },
        contentStyle: {
          width: "100%",
        },
      }),
      editor: (context) => createElement(CodeEditorEditor, context),
      canvas: (component) => {
        if (component.type !== "codeEditor") {
          return null;
        }
        return createElement(CodeEditorRenderer, {
          component,
        });
      },
      getSearchText: (component) => {
        if (component.type !== "codeEditor") {
          return "";
        }
        return [
          component.props.value,
          component.props.language,
          "code editor",
          "code",
          "코드",
          "하이라이터",
        ]
          .filter(Boolean)
          .join(" ");
      },
      exportHtml: exportCodeEditorHtml,
    },

    card: {
      label: "Card",
      description: "카드",
      icon: Box,
      supportsDisabled: false,
      propsSchema: z.object({
        title: z.string(),
        content: z.string(),
      }),
      fields: {
        title: {
          type: "text",
          label: "제목",
          placeholder: "카드 제목",
        },
        content: {
          type: "textarea",
          label: "내용",
          placeholder: "카드 내용을 입력하세요.",
        },
      },
      defaultProps: {
        title: "Card Title",
        content: "Card Content",
      },
      createComponent: (id, props) => ({
        id,
        name: "Card",
        type: "card" as const,
        order: 0,
        props,
        style: {
          width: "100%",
          padding: 16,
          border: "1px solid #dee2e6",
          borderRadius: 8,
        },
      }),
      editor: (context, fields) =>
        createElement(RegistryFieldsEditor, {
          ...context,
          fields,
        }),
      canvas: (component) => {
        const props = component.props as {
          title: string;
          content: string;
        };
        return createElement(
          "div",
          null,
          createElement(
            "h3",
            {
              style: {
                margin: "0 0 8px",
              },
            },
            props.title,
          ),
          createElement("div", null, props.content),
        );
      },
      getSearchText: (component) => {
        const props = component.props as {
          title: string;
          content: string;
        };
        return [props.title, props.content, "card", "카드"]
          .filter(Boolean)
          .join(" ");
      },
      getDisplayName: (component) => {
        const props = component.props as {
          title: string;
        };
        return props.title?.trim() || component.name?.trim() || "Card";
      },
      exportHtml: () => "",
    },

    badge: {
      label: "Badge",
      description: "배지",
      icon: Box,
      supportsDisabled: false,
      propsSchema: z.object({
        text: z.string(),
        variant: z.enum(["default", "success", "warning"]),
      }),
      fields: {
        text: {
          type: "text",
          label: "텍스트",
          placeholder: "Badge",
        },
        variant: {
          type: "select",
          label: "스타일",
          options: [
            { label: "Default", value: "default" },
            { label: "Success", value: "success" },
            { label: "Warning", value: "warning" },
          ],
        },
      },
      defaultProps: {
        text: "Badge",
        variant: "default",
      },
      createComponent: (id, props) => ({
        id,
        name: "Badge",
        type: "badge" as const,
        order: 0,
        props,
        style: {
          display: "inline-block",
        },
      }),
      editor: (context, fields) =>
        createElement(RegistryFieldsEditor, {
          ...context,
          fields,
        }),
      canvas: (component) => {
        const props = component.props as {
          text: string;
          variant: "default" | "success" | "warning";
        };
        return createElement(
          "span",
          {
            style: {
              display: "inline-block",
              padding: "4px 8px",
              borderRadius: 4,
              background:
                props.variant === "success"
                  ? "#198754"
                  : props.variant === "warning"
                    ? "#ffc107"
                    : "#6c757d",
              color: props.variant === "warning" ? "#000" : "#fff",
            },
          },
          props.text,
        );
      },
      getSearchText: (component) => {
        const props = component.props as {
          text: string;
          variant: string;
        };
        return [props.text, props.variant, "badge", "배지"]
          .filter(Boolean)
          .join(" ");
      },
      getDisplayName: (component) => {
        const props = component.props as {
          text: string;
        };
        return props.text?.trim() || component.name?.trim() || "Badge";
      },
      exportHtml: () => "",
    },

    alert: {
      label: "Alert",
      description: "알림 메시지",
      icon: Box,
      supportsDisabled: false,
      propsSchema: z.object({
        message: z.string(),
        variant: z.enum(["info", "success", "warning", "error"]),
        dismissible: z.boolean(),
      }),
      fields: {
        message: {
          type: "textarea",
          label: "메시지",
          placeholder: "알림 메시지를 입력하세요.",
        },
        variant: {
          type: "select",
          label: "타입",
          options: [
            { label: "Info", value: "info" },
            { label: "Success", value: "success" },
            { label: "Warning", value: "warning" },
            { label: "Error", value: "error" },
          ],
        },
        dismissible: {
          type: "checkbox",
          label: "닫기 버튼 표시",
        },
      },
      defaultProps: {
        message: "알림 메시지입니다.",
        variant: "info",
        dismissible: true,
      },
      createComponent: (id, props) => ({
        id,
        name: "Alert",
        type: "alert" as const,
        order: 0,
        props,
        style: {
          width: "100%",
        },
      }),
      editor: (context, fields) =>
        createElement(RegistryFieldsEditor, {
          ...context,
          fields,
        }),
      canvas: (component) => {
        const props = component.props as {
          message: string;
          variant: "info" | "success" | "warning" | "error";
          dismissible: boolean;
        };
        const background =
          props.variant === "success"
            ? "#d1e7dd"
            : props.variant === "warning"
              ? "#fff3cd"
              : props.variant === "error"
                ? "#f8d7da"
                : "#cff4fc";
        const color =
          props.variant === "success"
            ? "#0f5132"
            : props.variant === "warning"
              ? "#664d03"
              : props.variant === "error"
                ? "#842029"
                : "#055160";
        return createElement(
          "div",
          {
            style: {
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              padding: "12px 16px",
              borderRadius: 6,
              background,
              color,
            },
          },
          createElement("span", null, props.message),
          props.dismissible
            ? createElement(
                "span",
                {
                  style: {
                    fontSize: 18,
                    fontWeight: 700,
                    cursor: "pointer",
                  },
                },
                "×",
              )
            : null,
        );
      },
      getSearchText: (component) => {
        const props = component.props as {
          message: string;
          variant: string;
        };
        return [props.message, props.variant, "alert", "알림"]
          .filter(Boolean)
          .join(" ");
      },
      getDisplayName: (component) => {
        const props = component.props as {
          message: string;
        };
        return props.message?.trim() || component.name?.trim() || "Alert";
      },
      exportHtml: () => "",
    },
  } satisfies EditorConfig["components"],
} satisfies EditorConfig;

function App() {
  return <LayoutEditor config={config} />;
}

export default App;
