import type { CSSProperties } from "react";

export interface ComponentLayout {
  width?: number | string;
  height?: number | string;
  x?: number;
  y?: number;
}

interface BaseComponent {
  id: string;
  order: number;
  layout?: ComponentLayout;
  style?: CSSProperties;
}

interface ButtonComponent extends BaseComponent {
  type: "button";

  props: {
    title: string;
    disabled?: boolean;

    action: {
      type: "submit" | "reset" | "navigate" | "none";
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
  | TextAreaComponent
  | QuillComponent
  | ImageComponent
  | ContainerComponent;
