import type { LayoutComponent } from "../types/types";

export const getLinkHref = (
  component: Extract<LayoutComponent, { type: "link" }>,
) => {
  const value = component.props.value?.trim() ?? "";
  if (!value) return "#";
  switch (component.props.linkType) {
    case "tel":
      return `tel:${value.replace(/\s+/g, "")}`;
    case "email":
      return `mailto:${value}`;
    case "url":
    default:
      return /^https?:\/\//i.test(value) ? value : `https://${value}`;
  }
};
