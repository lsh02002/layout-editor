import type { LayoutComponent } from "../../../types/types";

export const getComponentDisplayName = (component: LayoutComponent) => {
  if (component.type === "textarea") {
    return component.props.value || component.name || component.type;
  }

  if (component.type === "quill") {
    const plainText = component.props.value
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<\/p>/gi, " ")
      .replace(/<\/div>/gi, " ")
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/gi, " ")
      .replace(/\u00A0/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    return plainText || component.name || component.type;
  }

  if (component.type === "heading") {
    return component.props.text || component.name?.trim() || "Heading";
  }

  if (component.name?.trim()) {
    return component.name.trim();
  }

  if (
    "title" in component.props &&
    typeof component.props.title === "string" &&
    component.props.title.trim()
  ) {
    return `${component.props.title.trim()} (${component.type})`;
  }

  return component.type;
};
