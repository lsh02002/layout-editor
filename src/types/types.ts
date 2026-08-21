import type { CSSProperties } from "react";

export type ComponentType = LayoutComponent["type"];
export type ContainerDirection = "row" | "column";
export type LinkType = "url" | "tel" | "email";

export interface ComponentLayout {
  width?: number | string;
  height?: number | string;
  x?: number;
  y?: number;
}

interface BaseComponent {
  id: string;
  name?: string;
  order: number;
  layout?: ComponentLayout;
  style?: CSSProperties;
  contentStyle?: CSSProperties;
  customCss?: string;
}

interface ButtonComponent extends BaseComponent {
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

interface TextAreaComponent extends BaseComponent {
  type: "textarea";

  props: {
    value: string;
    rows?: number;
    placeholder?: string;
    disabled?: boolean;
  };
}

interface ScrollToTopButtonComponent extends BaseComponent {
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

interface QuillComponent extends BaseComponent {
  type: "quill";

  props: {
    value: string;
    placeholder?: string;
    disabled?: boolean;
  };
}

interface ImageComponent extends BaseComponent {
  type: "image";

  props: {
    urls: string[];
    maxCount?: number;
    disabled?: boolean;
  };
}

interface LinkComponent extends BaseComponent {
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

interface ContainerComponent extends BaseComponent {
  type: "container";

  props: {
    direction?: "row" | "column";
    gap?: number;
  };

  children: LayoutComponent[];
}

export type LayoutComponent =
  | ButtonComponent
  | ScrollToTopButtonComponent
  | TextAreaComponent
  | QuillComponent
  | ImageComponent
  | LinkComponent
  | ContainerComponent;

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

export type FavoriteComponent = {
  id: string;
  sourceComponentId: string;
  name: string;
  component: LayoutComponent;
};
