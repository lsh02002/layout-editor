import { createElement, type ReactNode } from "react";

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
  type LucideIcon,
} from "lucide-react";

import { z } from "zod";
import type { LayoutComponent } from "../../../types/types";
import { FAKE_IMAGE_SLIDER_URLS, FAKE_IMAGE_URL } from "../../../data/data";

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
} from "../edit/componentEditors";

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
} from "../../canvas/renderers";

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
} from "../utils/htmlexport/htmlExporters";

import type { EditBasicContext } from "../edit/types/editBasicContext";
import type { HtmlExporter } from "../utils/htmlexport/htmlExportTypes";

type FieldOption<T extends string | number = string | number> = {
  label: string;
  value: T;
};

export type ComponentField =
  | {
      type: "text";
      label: string;
      placeholder?: string;
      getValue?: (value: unknown) => string;
      setValue?: (value: string) => unknown;
    }
  | {
      type: "textarea";
      label: string;
      placeholder?: string;
    }
  | {
      type: "number";
      label: string;
      min?: number;
      max?: number;
    }
  | {
      type: "select";
      label: string;
      options: FieldOption[];
    }
  | {
      type: "checkbox";
      label: string;
    };

type RegistryCreatedComponent = {
  id: string;
  name: string;
  type: string;
  order: number;
  props: Record<string, unknown>;
  [key: string]: unknown;
};

type ComponentRegistryShape = {
  label: string;
  description: string;
  icon: LucideIcon;
  supportsDisabled: boolean;
  propsSchema: z.ZodTypeAny;
  maxInstances?: number;
  fields: Partial<Record<string, ComponentField>>;
  defaultProps: Record<string, unknown>;
  createComponent: (
    id: string,
    props: Record<string, unknown>,
  ) => RegistryCreatedComponent;
  editor: (
    context: EditBasicContext,
    fields: Partial<Record<string, ComponentField>>,
  ) => ReactNode;
  canvas?: (component: LayoutComponent) => ReactNode;
  getSearchText?: (component: LayoutComponent) => string;
  getDisplayName?: (component: LayoutComponent) => string;
  exportHtml: HtmlExporter;
};

export const componentRegistry = {
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
      type: "container",
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
      type: "badge",
      order: 0,
      props,
      style: {
        display: "inline-block",
        padding: "4px 8px",
        borderRadius: 4,
      },
    }),
    editor: (context, fields): ReactNode =>
      createElement(RegistryFieldsEditor, {
        ...context,
        fields,
      }),
    exportHtml: () => "",
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
      type: "heading",
      order: 0,
      props,
    }),

    editor: (context): ReactNode =>
      createElement(RegistryFieldsEditor, context),
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
      type: "textarea",
      order: 0,
      props,
      style: {
        width: "100%",
      },
    }),
    editor: (context): ReactNode =>
      createElement(RegistryFieldsEditor, context),
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
      type: "quill",
      order: 0,
      props,
      style: {
        width: "100%",
      },
    }),
    editor: (context): ReactNode => createElement(QuillEditor, context),
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
      type: "button",
      order: 0,
      props,
      style: {
        width: "100%",
      },
    }),
    editor: (context): ReactNode =>
      createElement(RegistryFieldsEditor, context),
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
      type: "scrollToTopButton",
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
    editor: (context): ReactNode =>
      createElement(ScrollToTopButtonEditor, context),
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
        component.props.title?.trim() || component.name?.trim() || "ScrollToTop"
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
          Array.isArray(value) && typeof value[0] === "string" ? value[0] : "",
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
      type: "image",
      order: 0,
      props,
      style: {
        width: "100%",
      },
    }),
    editor: (context): ReactNode => createElement(ImageEditor, context),
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
      type: "imageGallery",
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
    editor: (context): ReactNode => createElement(ImageGalleryEditor, context),
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
      return ["image gallery", "gallery", "이미지 갤러리", "갤러리"].join(" ");
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
      type: "imageSlider",
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
    editor: (context): ReactNode => createElement(ImageSliderEditor, context),
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
      type: "video",
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
    editor: (context): ReactNode => createElement(VideoEditor, context),
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
      type: "link",
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
    editor: (context): ReactNode => createElement(LinkEditor, context),
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
      type: "divider",
      order: 0,
      props,
      style: {
        width: "100%",
      },
    }),
    editor: (context): ReactNode =>
      createElement(RegistryFieldsEditor, context),
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
      type: "spacer",
      order: 0,
      props,
      style: {
        width: "100%",
      },
    }),
    editor: (context): ReactNode =>
      createElement(RegistryFieldsEditor, context),
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
      type: "codeEditor",
      order: 0,
      props,
      style: {
        width: "100%",
      },
      contentStyle: {
        width: "100%",
      },
    }),
    editor: (context): ReactNode => createElement(CodeEditorEditor, context),
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
} satisfies Record<string, ComponentRegistryShape>;

export type ComponentRegistry = typeof componentRegistry;

type ComponentRegistryEntry = {
  [T in LayoutComponent["type"]]: [T, ComponentRegistry[T]];
}[LayoutComponent["type"]];

type RegistryComponent<T extends LayoutComponent["type"]> = ReturnType<
  ComponentRegistry[T]["createComponent"]
>;

export const componentRegistryEntries = Object.entries(
  componentRegistry,
) as ComponentRegistryEntry[];

export function createDefaultComponent<T extends LayoutComponent["type"]>(
  type: T,
): RegistryComponent<T> {
  return createComponentFromProps(type, {});
}

export function createComponentFromProps<T extends LayoutComponent["type"]>(
  type: T,
  props: Record<string, unknown>,
  name?: string,
): RegistryComponent<T> {
  const definition = componentRegistry[type];
  const mergedProps = {
    ...structuredClone(definition.defaultProps),
    ...props,
  };
  const component = definition.createComponent(
    crypto.randomUUID(),
    mergedProps,
  ) as RegistryComponent<T>;
  return {
    ...component,
    name: name?.trim() || component.name,
  } as RegistryComponent<T>;
}

export function getComponentDefinition(type: LayoutComponent["type"]) {
  return componentRegistry[type];
}

export function renderComponentEditor(context: EditBasicContext): ReactNode {
  const definition = componentRegistry[
    context.component.type as LayoutComponent["type"]
  ] as ComponentRegistryShape;

  return definition.editor(context, definition.fields);
}

export function renderComponentCanvas(component: LayoutComponent): ReactNode {
  const definition = componentRegistry[
    component.type as LayoutComponent["type"]
  ] as ComponentRegistryShape;
  const renderer = definition.canvas;

  if (!renderer) {
    return null;
  }

  return renderer(component);
}

export function validateComponentProps(component: LayoutComponent) {
  return componentRegistry[component.type].propsSchema.safeParse(
    component.props,
  );
}

export function getComponentSearchText(component: LayoutComponent): string {
  const definition = componentRegistry[
    component.type as LayoutComponent["type"]
  ] as ComponentRegistryShape;
  const content = definition.getSearchText?.(component) ?? "";

  return [
    component.name ?? "",
    component.type,
    definition.label,
    definition.description,
    content,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}
