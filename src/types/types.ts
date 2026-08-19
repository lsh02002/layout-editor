import type { CSSProperties } from "react";

export type ComponentType = LayoutComponent["type"];
export type ContainerDirection = "row" | "column";

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
  contentStyle?: CSSProperties;
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
  | ContainerComponent;

export interface EditorSnapshot {
  components: LayoutComponent[];
  imageFiles: Record<string, File[]>;
}

export interface HistoryState {
  past: EditorSnapshot[];
  present: EditorSnapshot;
  future: EditorSnapshot[];
}

export type ComponentsUpdater =
  | LayoutComponent[]
  | ((prev: LayoutComponent[]) => LayoutComponent[]);
