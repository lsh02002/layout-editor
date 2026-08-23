import type { CSSProperties, Dispatch, SetStateAction } from "react";

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
  };

  children: LayoutComponent[];
}

export type LayoutComponent =
  | ButtonComponent
  | ScrollToTopButtonComponent
  | HeadingComponent
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
  updater: (prev: LayoutComponent[]) => LayoutComponent[],
) => void;

export type InsertTarget = {
  parentId: string | null;
  index: number;
} | null;

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export type EditValues = {
  editingComponentId: string | null;
  editTitle: string;
  editValue: string;
  editPlaceholder: string;
  editDirection: "row" | "column";
  editDisabled: boolean;
  editStyle: CSSProperties;
  editContentStyle: CSSProperties;
  editCustomCss: string;
  editImageUrl: string;
  editLinkType: LinkType;
  editLinkNewWindow: boolean;
  editComponentName: string;
  editHeadingLevel: HeadingLevel;
};

export type SelectionSetter = Dispatch<SetStateAction<string | null>>;

export type BooleanSetter = Dispatch<SetStateAction<boolean>>;

export type InsertTargetSetter = Dispatch<SetStateAction<InsertTarget>>;

export type FavoriteSetter = Dispatch<SetStateAction<FavoriteComponent[]>>;
