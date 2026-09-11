import type { CSSProperties, Dispatch, SetStateAction } from "react";

export const CONTAINER_TYPES = ["container", "grid", "flex"] as const;
export type ContainerType = (typeof CONTAINER_TYPES)[number];
export type CanvasComponent = Exclude<LayoutComponent, { type: ContainerType }>;

export type CanvasViewport = "desktop" | "tablet" | "mobile";
export type LeftPanelTab = "components" | "layers";

export type ComponentType = LayoutComponent["type"];
export type ContainerDirection = "row" | "column";
export type LinkType = "url" | "tel" | "email";

export type SizeMode = "auto" | "fill" | "fixed";

export interface ComponentLayout {
  position?: "relative" | "absolute";
  widthMode?: SizeMode;
  heightMode?: SizeMode;
  width?: number | string;
  height?: number | string;
  x?: number;
  y?: number;
  positionParentId?: string | null;
  zIndex?: number;
}

export type ContainerJustifyContent =
  | "flex-start"
  | "center"
  | "flex-end"
  | "space-between"
  | "space-around"
  | "space-evenly";

export type ContainerAlignItems =
  | "stretch"
  | "flex-start"
  | "center"
  | "flex-end";

export type CodeLanguage =
  | "css"
  | "html"
  | "javascript"
  | "typescript"
  | "json";

export type BaseComponent<
  TType extends string = string,
  TProps = Record<string, unknown>,
> = {
  id: string;
  name: string;
  type: TType;
  order: number;
  props: TProps;
  layout?: ComponentLayout;
  style?: CSSProperties;
  contentStyle?: CSSProperties;
  customCss?: string;
};
export interface ButtonComponent extends BaseComponent {
  type: "button";

  props: {
    title: string;
    disabled?: boolean;

    action: {
      type: "submit" | "reset" | "navigate" | "none" | "scrollToTop";
      payload?: string | null;
    };
  };
}

export interface HeadingComponent extends BaseComponent {
  type: "heading";

  props: {
    text: string;
    level: 1 | 2 | 3 | 4 | 5 | 6;
  };
}

export interface TextAreaComponent extends BaseComponent {
  type: "textarea";

  props: {
    value: string;
    rows?: number;
    placeholder?: string;
    disabled?: boolean;
  };
}

export interface ScrollToTopButtonComponent extends BaseComponent {
  type: "scrollToTopButton";

  props: {
    title: string;
    disabled?: boolean;
    zIndex?: number;
    action: {
      type: "scrollToTop";
      payload?: string | null;
    };
  };
}

export interface QuillComponent extends BaseComponent {
  type: "quill";

  props: {
    value: string;
    placeholder?: string;
    disabled?: boolean;
  };
}

export interface ImageComponent extends BaseComponent {
  type: "image";

  props: {
    urls: string[];
    maxCount?: number;
    disabled?: boolean;
  };
}

export interface LinkComponent extends BaseComponent {
  type: "link";

  props: {
    title: string;
    linkType: LinkType;
    // URL / 전화번호 / 이메일 주소
    value: string;
    // URL일 때 새 창
    newWindow?: boolean;
    disabled?: boolean;
  };
}

export interface ContainerComponent extends BaseComponent {
  type: "container";

  props: {
    direction?: "row" | "column";
    gap?: number;
    justifyContent?: ContainerJustifyContent;
    alignItems?: ContainerAlignItems;
    maxWidth?: number;
  };
  children: LayoutComponent[];
}

export interface GridComponent extends BaseComponent {
  type: "grid";
  props: {
    columns?: number;
    gap?: number;
  };
  children: LayoutComponent[];
}

export interface FlexComponent extends BaseComponent {
  type: "flex";

  props: {
    direction?: "row" | "column";
    gap?: number;

    justifyContent?:
      | "flex-start"
      | "center"
      | "flex-end"
      | "space-between"
      | "space-around"
      | "space-evenly";

    alignItems?: "flex-start" | "center" | "flex-end" | "stretch";
  };

  children: LayoutComponent[];
}

export interface DividerComponent extends BaseComponent {
  type: "divider";

  props: {
    thickness?: number;
    color?: string;
    lineStyle?: "solid" | "dashed" | "dotted";
  };
}

export interface SpacerComponent extends BaseComponent {
  type: "spacer";

  props: {
    height: number;
  };
}
export interface VideoComponent extends BaseComponent {
  type: "video";

  props: {
    src: string;
    controls?: boolean;
    autoplay?: boolean;
    muted?: boolean;
    loop?: boolean;
  };
}

export interface CodeEditorComponent extends BaseComponent {
  type: "codeEditor";

  props: {
    value: string;
    language: CodeLanguage;
    readOnly?: boolean;
  };
}

export interface ImageGalleryComponent extends BaseComponent {
  type: "imageGallery";

  props: {
    urls: string[];
    columns?: number;
    gap?: number;
    objectFit?: "cover" | "contain" | "fill";
    borderRadius?: number;
  };
}

export interface ImageSliderComponent extends BaseComponent {
  type: "imageSlider";

  props: {
    urls: string[];
    autoplay?: boolean;
    interval?: number;
    showDots?: boolean;
    showArrows?: boolean;
    loop?: boolean;
  };
}

export interface CardComponent extends BaseComponent {
  type: "card";

  props: {
    title?: string;
    content?: string;
  };
}

// Alert

export type AlertVariant =
  | "primary"
  | "secondary"
  | "success"
  | "danger"
  | "warning"
  | "info"
  | "light"
  | "dark";

export interface AlertComponent extends BaseComponent {
  type: "alert";

  props: {
    message: string;
    variant?: AlertVariant;
  };
}

// Badge

export type BadgeVariant =
  | "primary"
  | "secondary"
  | "success"
  | "danger"
  | "warning"
  | "info"
  | "light"
  | "dark";

export interface BadgeComponent extends BaseComponent {
  type: "badge";

  props: {
    text: string;
    variant?: BadgeVariant;
  };
}

export type LayoutComponent =
  | ButtonComponent
  | ScrollToTopButtonComponent
  | HeadingComponent
  | TextAreaComponent
  | QuillComponent
  | ImageComponent
  | LinkComponent
  | GridComponent
  | FlexComponent
  | DividerComponent
  | SpacerComponent
  | VideoComponent
  | CodeEditorComponent
  | ImageGalleryComponent
  | ImageSliderComponent
  | CardComponent
  | AlertComponent
  | BadgeComponent
  | ContainerComponent;

export type ChildrenComponent = Extract<
  LayoutComponent,
  { children: LayoutComponent[] }
>;

export function isLayoutContainer(
  component: LayoutComponent,
): component is ChildrenComponent {
  return (
    CONTAINER_TYPES.includes(component.type as ContainerType) &&
    "children" in component &&
    Array.isArray(component.children)
  );
}

export interface HistoryState {
  past: LayoutComponent[][];
  present: LayoutComponent[];
  future: LayoutComponent[][];
}

export type ComponentsUpdater =
  | LayoutComponent[]
  | ((prev: LayoutComponent[]) => LayoutComponent[]);

export type TemplateFile =
  | {
      version: 1;
      templateType: "project";
      name: string;
      createdAt: string;
      components: LayoutComponent[];
    }
  | {
      version: 1;
      templateType: "component";
      name: string;
      createdAt: string;
      component: LayoutComponent;
    };

export type TemplateItem = {
  id: string;
  name: string;
  description?: string;
  components: LayoutComponent[];
  projectCustomCss?: string;
  createdAt?: string;
};

export type TemplateDragData = {
  type: "template";
  templateId: string;
};

export type FavoriteComponent = {
  id: string;
  sourceComponentId: string;
  name: string;
  component: LayoutComponent;
};

export const AUTOSAVE_KEY = "layout-editor-autosave";

export type AutoSaveData = {
  version: 1;
  savedAt: string;
  components: LayoutComponent[];
  projectCustomCss: string;
};

export type CommitHistory = (
  updater: (prev: LayoutComponent[]) => LayoutComponent[],
) => void;

export type SetComponents = (
  updater: LayoutComponent[] | ((prev: LayoutComponent[]) => LayoutComponent[]),
  recordHistory?: boolean,
) => void;

export type InsertTarget = {
  parentId: string | null;
  index: number;
} | null;

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export type SelectionSetter = Dispatch<SetStateAction<string | null>>;
export type BooleanSetter = Dispatch<SetStateAction<boolean>>;
export type InsertTargetSetter = Dispatch<SetStateAction<InsertTarget>>;
export type FavoriteSetter = Dispatch<SetStateAction<FavoriteComponent[]>>;
