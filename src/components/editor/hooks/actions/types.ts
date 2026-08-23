import type { CSSProperties, Dispatch, SetStateAction } from "react";

import type {
  FavoriteComponent,
  LayoutComponent,
  LinkType,
} from "../../../../types/types";

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
