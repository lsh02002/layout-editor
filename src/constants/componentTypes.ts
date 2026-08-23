import type { ComponentType } from "../types/types";

export const VALID_COMPONENT_TYPES = [
  "button",
  "heading",
  "textarea",
  "quill",
  "image",
  "link",
  "container",
  "scrollToTopButton",
] as const satisfies readonly ComponentType[];
