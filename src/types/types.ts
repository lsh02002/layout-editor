import type React from "react";

export interface ComponentLayout {
  width?: number | string;
  height?: number | string;
  x?: number;
  y?: number;
}

interface BaseComponent {
  id: string;
  order: number;

  // 배치/크기
  layout?: ComponentLayout;

  // 디자인 스타일
  style?: React.CSSProperties;
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

export type LayoutComponent =
  | ButtonComponent
  | TextAreaComponent
  | QuillComponent
  | ImageComponent;

export type ComponentType = LayoutComponent["type"];
