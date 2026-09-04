import {
  createElement,
  type ChangeEvent,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

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

import type {
  ComponentType,
  ContainerDirection,
  HeadingLevel,
  LayoutComponent,
  LinkType,
} from "../../../types/types";

import { FAKE_IMAGE_SLIDER_URLS, FAKE_IMAGE_URL } from "../../../data/data";

import type { EditBasicContext } from "../edit/types/editBasicContext";

import {
  ButtonEditor,
  CodeEditorEditor,
  ContainerEditor,
  DividerEditor,
  HeadingEditor,
  ImageEditor,
  ImageGalleryEditor,
  ImageSliderEditor,
  LinkEditor,
  QuillEditor,
  ScrollToTopButtonEditor,
  SpacerEditor,
  TextareaEditor,
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

import type { HtmlExporter } from "../utils/htmlexport/htmlExport";
import ContainerFields from "../create/fields/ContainerFields";
import HeadingFields from "../create/fields/HeadingFields";
import TextareaFields from "../create/fields/TextareaFields";
import QuillFields from "../create/fields/QuillFields";
import ButtonFields from "../create/fields/ButtonFields";
import ImageFields from "../create/fields/ImageFields";
import ComponentNameField from "../create/fields/ComponentNameField";
import LinkFields from "../create/fields/LinkFields";

export type CreateComponentFormValues = {
  componentName: string;
  title: string;
  value: string;
  placeholder: string;
  direction: ContainerDirection;
  imagePreviewUrl: string;
  linkType: LinkType;
  linkNewWindow: boolean;
  headingText: string;
  headingLevel: HeadingLevel;
};

type StateSetter<T> = Dispatch<SetStateAction<T>>;

export type CreateComponentFormContext = {
  values: CreateComponentFormValues;
  setComponentName: StateSetter<string>;
  setTitle: StateSetter<string>;
  setValue: StateSetter<string>;
  setPlaceholder: StateSetter<string>;
  setDirection: StateSetter<ContainerDirection>;
  setImagePreviewUrl: StateSetter<string>;
  setLinkType: StateSetter<LinkType>;
  setLinkNewWindow: StateSetter<boolean>;
  setHeadingText: StateSetter<string>;
  setHeadingLevel: StateSetter<HeadingLevel>;
};

type ComponentRegistryItem = {
  label: string;
  description: string;
  icon: LucideIcon;
  supportsDisabled: boolean;
  propsSchema: z.ZodType;
  maxInstances?: number;
  createDefault: (id: string) => LayoutComponent;
  applyCreateForm?: (
    component: LayoutComponent,
    form: CreateComponentFormValues,
  ) => LayoutComponent;
  createForm: (context: CreateComponentFormContext) => ReactNode;
  editor: (context: EditBasicContext) => ReactNode;
  canvas?: (component: LayoutComponent) => ReactNode;
  getSearchText?: (component: LayoutComponent) => string;
  getDisplayName?: (component: LayoutComponent) => string;
  exportHtml: HtmlExporter;
};

export const componentRegistry: Record<ComponentType, ComponentRegistryItem> = {
  container: {
    label: "Container",
    description: "컴포넌트를 묶는 영역",
    icon: Box,
    supportsDisabled: false,
    propsSchema: z.object({
      direction: z.enum(["row", "column"]).optional(),
      gap: z.number().finite().optional(),
      justifyContent: z.string().optional(),
      alignItems: z.string().optional(),
      maxWidth: z.number().finite().positive().optional(),
    }),

    createDefault: (id) => ({
      id,
      name: "Container",
      type: "container",
      order: 0,
      props: {
        direction: "column",
        gap: 8,
        justifyContent: "space-between",
        alignItems: "stretch",
        maxWidth: undefined,
      },

      style: {
        width: "100%",
        minHeight: 100,
        padding: 12,
      },

      children: [],
    }),

    applyCreateForm: (component, form) => {
      if (component.type !== "container") {
        return component;
      }

      return {
        ...component,
        props: {
          ...component.props,
          direction: form.direction,
        },
      };
    },

    createForm: ({ values, setComponentName, setDirection }) =>
      createElement(ContainerFields, {
        componentName: values.componentName,
        direction: values.direction,
        onComponentNameChange: setComponentName,
        onDirectionChange: setDirection,
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

    createDefault: (id) => ({
      id,
      name: "제목",
      type: "heading",
      order: 0,
      props: {
        text: "제목을 입력하세요",
        level: 2,
      },

      style: {
        width: "100%",
      },

      contentStyle: {
        margin: 0,
      },
    }),

    applyCreateForm: (component, form) => {
      if (component.type !== "heading") {
        return component;
      }

      return {
        ...component,
        props: {
          ...component.props,
          text: form.headingText.trim() || "제목을 입력하세요",
          level: form.headingLevel,
        },
      };
    },

    createForm: ({ values, setHeadingText, setHeadingLevel }) =>
      createElement(HeadingFields, {
        text: values.headingText,
        level: values.headingLevel,
        onTextChange: setHeadingText,
        onLevelChange: setHeadingLevel,
      }),

    editor: (context) => createElement(HeadingEditor, context),
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
        component.name?.trim() || component.props.text?.trim() || "Heading"
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

    createDefault: (id) => ({
      id,
      name: "Textarea",
      type: "textarea",
      order: 0,
      props: {
        value: "",
        rows: 3,
        placeholder: "내용을 입력하세요.",
        disabled: false,
      },

      style: {
        width: "100%",
      },
    }),

    applyCreateForm: (component, form) => {
      if (component.type !== "textarea") {
        return component;
      }

      return {
        ...component,
        props: {
          ...component.props,
          value: form.value,
          placeholder: form.placeholder.trim() || "내용을 입력하세요.",
        },
      };
    },

    createForm: ({ values, setComponentName, setValue, setPlaceholder }) =>
      createElement(TextareaFields, {
        componentName: values.componentName,
        value: values.value,
        placeholder: values.placeholder,
        onComponentNameChange: setComponentName,
        onValueChange: setValue,
        onPlaceholderChange: setPlaceholder,
      }),

    editor: (context) => createElement(TextareaEditor, context),
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
        component.name?.trim() ||
        component.props.value?.trim() ||
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

    createDefault: (id) => ({
      id,
      name: "RichText",
      type: "quill",
      order: 0,
      props: {
        value: "",
        placeholder: "본문을 입력하세요.",
        disabled: false,
      },

      style: {
        width: "100%",
      },
    }),

    applyCreateForm: (component, form) => {
      if (component.type !== "quill") {
        return component;
      }

      return {
        ...component,
        props: {
          ...component.props,
          value: form.value,
          placeholder: form.placeholder.trim() || "본문을 입력하세요.",
        },
      };
    },

    createForm: ({ values, setComponentName, setValue, setPlaceholder }) =>
      createElement(QuillFields, {
        componentName: values.componentName,
        value: values.value,
        placeholder: values.placeholder,
        onComponentNameChange: setComponentName,
        onValueChange: setValue,
        onPlaceholderChange: setPlaceholder,
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
        component.name?.trim() ||
        text ||
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
      action: z
        .object({
          type: z.string(),
          payload: z.unknown().nullable(),
        })
        .optional(),
    }),

    createDefault: (id) => ({
      id,
      name: "Button",
      type: "button",
      order: 0,
      props: {
        title: "버튼",
        disabled: false,
        action: {
          type: "none",
          payload: null,
        },
      },

      style: {
        width: "100%",
      },
    }),

    applyCreateForm: (component, form) => {
      if (component.type !== "button") {
        return component;
      }

      return {
        ...component,
        props: {
          ...component.props,
          title: form.title.trim() || "버튼",
        },
      };
    },

    createForm: ({ values, setComponentName, setTitle }) =>
      createElement(ButtonFields, {
        componentName: values.componentName,
        title: values.title,
        onComponentNameChange: setComponentName,
        onTitleChange: setTitle,
      }),

    editor: (context) => createElement(ButtonEditor, context),
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
        component.name?.trim() || component.props.title?.trim() || "Button"
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
      action: z
        .object({
          type: z.string(),
          payload: z.unknown().nullable(),
        })
        .optional(),
    }),

    createDefault: (id) => ({
      id,
      name: "ScrollToTopButton",
      type: "scrollToTopButton",
      order: 0,
      props: {
        title: "↑",
        disabled: false,
        action: {
          type: "scrollToTop",
          payload: null,
        },
      },

      style: {
        position: "fixed",
        width: "50px",
        height: "50px",
        right: "10px",
        bottom: "10px",
        zIndex: 1400,
      },
    }),

    applyCreateForm: (component, form) => {
      if (component.type !== "scrollToTopButton") {
        return component;
      }

      return {
        ...component,
        props: {
          ...component.props,
          title: form.title.trim() || "↑",
        },
      };
    },

    createForm: ({ values, setComponentName, setTitle }) =>
      createElement(ButtonFields, {
        componentName: values.componentName,
        title: values.title,
        onComponentNameChange: setComponentName,
        onTitleChange: setTitle,
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
        component.name?.trim() || component.props.title?.trim() || "ScrollToTop"
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

    createDefault: (id) => ({
      id,
      name: "Image",
      type: "image",
      order: 0,
      props: {
        urls: [FAKE_IMAGE_URL],
        maxCount: 1,
        disabled: false,
      },

      style: {
        width: "100%",
      },
    }),

    applyCreateForm: (component, form) => {
      if (component.type !== "image") {
        return component;
      }

      const url = form.imagePreviewUrl.trim();

      if (!url) {
        return component;
      }

      return {
        ...component,
        props: {
          ...component.props,
          urls: [url],
        },
      };
    },

    createForm: ({ values, setComponentName, setImagePreviewUrl }) =>
      createElement(ImageFields, {
        componentName: values.componentName,
        previewUrl: values.imagePreviewUrl,
        onComponentNameChange: setComponentName,
        onPreviewUrlChange: setImagePreviewUrl,
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

    createDefault: (id) => ({
      id,
      name: "ImageGallery",
      type: "imageGallery",
      order: 0,
      props: {
        urls: FAKE_IMAGE_SLIDER_URLS,
        columns: 3,
        gap: 8,
        objectFit: "cover",
        borderRadius: 8,
      },

      layout: {
        widthMode: "fill",
        heightMode: "auto",
      },

      style: {
        width: "100%",
      },
    }),

    createForm: ({ values, setComponentName }) =>
      createElement(ComponentNameField, {
        value: values.componentName,
        onChange: setComponentName,
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

    createDefault: (id) => ({
      id,
      name: "ImageSlider",
      type: "imageSlider",
      order: 0,
      props: {
        urls: FAKE_IMAGE_SLIDER_URLS,
        autoplay: true,
        interval: 3000,
        showArrows: true,
        showDots: true,
        loop: true,
      },

      layout: {
        widthMode: "fill",
        heightMode: "fixed",
        height: 320,
      },

      style: {
        width: "100%",
      },
    }),

    createForm: ({ values, setComponentName }) =>
      createElement(ComponentNameField, {
        value: values.componentName,
        onChange: setComponentName,
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

    createDefault: (id) => ({
      id,
      name: "Video",
      type: "video",
      order: 0,
      props: {
        src: "",
        controls: true,
        autoplay: false,
        muted: false,
        loop: false,
      },

      style: {
        width: "100%",
      },

      contentStyle: {
        width: "100%",
        borderRadius: 8,
      },
    }),

    applyCreateForm: (component, form) => {
      if (component.type !== "video") {
        return component;
      }

      return {
        ...component,
        props: {
          ...component.props,
          src: form.value.trim(),
        },
      };
    },

    createForm: ({ values, setComponentName, setValue }) =>
      createElement(
        "div",
        null,
        createElement(ComponentNameField, {
          value: values.componentName,
          onChange: setComponentName,
        }),

        createElement(
          "div",
          {
            className: "mb-3",
          },

          createElement(
            "label",
            {
              className: "form-label",
            },
            "동영상 URL",
          ),

          createElement("input", {
            type: "url",
            className: "form-control",
            value: values.value,
            placeholder: "https://example.com/video.mp4",
            onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
              setValue(event.target.value);
            },
          }),
        ),
      ),

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
      linkType: z.string(),
      value: z.string(),
      newWindow: z.boolean().optional(),
      disabled: z.boolean().optional(),
    }),

    createDefault: (id) => ({
      id,
      name: "Link",
      type: "link",
      order: 0,
      props: {
        title: "링크",
        linkType: "url",
        value: "",
        newWindow: false,
        disabled: false,
      },

      style: {
        width: "100%",
      },

      contentStyle: {
        color: "#0d6efd",
        textDecoration: "underline",
        cursor: "pointer",
      },
    }),

    applyCreateForm: (component, form) => {
      if (component.type !== "link") {
        return component;
      }

      return {
        ...component,
        props: {
          ...component.props,
          title: form.title.trim() || "링크",
          linkType: form.linkType,
          value: form.value.trim(),
          newWindow: form.linkType === "url" ? form.linkNewWindow : false,
        },
      };
    },

    createForm: ({
      values,
      setComponentName,
      setTitle,
      setLinkType,
      setValue,
      setLinkNewWindow,
    }) =>
      createElement(LinkFields, {
        componentName: values.componentName,
        title: values.title,
        linkType: values.linkType,
        value: values.value,
        newWindow: values.linkNewWindow,
        onComponentNameChange: setComponentName,
        onTitleChange: setTitle,
        onLinkTypeChange: setLinkType,
        onValueChange: setValue,
        onNewWindowChange: setLinkNewWindow,
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
        component.name?.trim() ||
        component.props.title?.trim() ||
        component.props.value?.trim() ||
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

    createDefault: (id) => ({
      id,
      name: "Divider",
      type: "divider",
      order: 0,
      props: {
        thickness: 3,
        color: "#dee2e6",
        lineStyle: "solid",
      },

      style: {
        width: "100%",
      },
    }),

    createForm: ({
      values,
      setComponentName,
      setTitle,
      setLinkType,
      setValue,
      setLinkNewWindow,
    }) =>
      createElement(LinkFields, {
        componentName: values.componentName,
        title: values.title,
        linkType: values.linkType,
        value: values.value,
        newWindow: values.linkNewWindow,
        onComponentNameChange: setComponentName,
        onTitleChange: setTitle,
        onLinkTypeChange: setLinkType,
        onValueChange: setValue,
        onNewWindowChange: setLinkNewWindow,
      }),

    editor: (context) => createElement(DividerEditor, context),
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

    createDefault: (id) => ({
      id,
      name: "Spacer",
      type: "spacer",
      order: 0,
      props: {
        height: 32,
      },

      style: {
        width: "100%",
      },
    }),

    createForm: ({ values, setComponentName }) =>
      createElement(ComponentNameField, {
        value: values.componentName,
        onChange: setComponentName,
      }),

    editor: (context) => createElement(SpacerEditor, context),
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
      language: z.string(),
      readOnly: z.boolean().optional(),
    }),

    createDefault: (id) => ({
      id,
      name: "CodeEditor",
      type: "codeEditor",
      order: 0,
      props: {
        value: `const hello = "Hello World";\n\nconsole.log(hello);`,
        language: "javascript",
        readOnly: false,
      },

      style: {
        width: "100%",
      },

      contentStyle: {
        width: "100%",
      },
    }),

    applyCreateForm: (component, form) => {
      if (component.type !== "codeEditor") {
        return component;
      }

      return {
        ...component,
        props: {
          ...component.props,
          value: form.value || component.props.value,
        },
      };
    },

    createForm: ({ values, setComponentName, setValue }) =>
      createElement(
        "div",
        null,

        createElement(ComponentNameField, {
          value: values.componentName,

          onChange: setComponentName,
        }),

        createElement(
          "div",
          {
            className: "mb-3",
          },

          createElement(
            "label",
            {
              className: "form-label",
            },
            "초기 코드",
          ),

          createElement("textarea", {
            className: "form-control font-monospace",

            rows: 8,

            value: values.value,

            onChange: (event: ChangeEvent<HTMLTextAreaElement>) => {
              setValue(event.target.value);
            },
          }),
        ),
      ),

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
};

export const componentRegistryEntries = Object.entries(componentRegistry) as [
  ComponentType,
  ComponentRegistryItem,
][];

export function createDefaultComponent(type: ComponentType): LayoutComponent {
  const id = crypto.randomUUID();

  return componentRegistry[type].createDefault(id);
}

export function createComponentFromForm(
  type: ComponentType,
  form: CreateComponentFormValues,
): LayoutComponent {
  const id = crypto.randomUUID();
  const definition = componentRegistry[type];
  let component = definition.createDefault(id);
  const componentName = form.componentName.trim();

  if (componentName) {
    component = {
      ...component,

      name: componentName,
    };
  }

  if (definition.applyCreateForm) {
    component = definition.applyCreateForm(component, form);
  }

  return component;
}

export function getComponentDefinition(type: ComponentType) {
  return componentRegistry[type];
}

export function renderComponentEditor(context: EditBasicContext): ReactNode {
  return componentRegistry[context.component.type].editor(context);
}

export function renderComponentCanvas(component: LayoutComponent): ReactNode {
  const renderer = componentRegistry[component.type].canvas;

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
  const definition = componentRegistry[component.type];
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

export function renderComponentCreateForm(
  type: ComponentType,
  context: CreateComponentFormContext,
): ReactNode {
  return componentRegistry[type].createForm(context);
}
