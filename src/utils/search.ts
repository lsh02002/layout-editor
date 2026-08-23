import type { LayoutComponent } from "../types/types";

export const normalizeSearchText = (value: string) =>
  value
    .toLowerCase()
    .replace(/\u00A0/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

export const getComponentSearchText = (component: LayoutComponent) => {
  const componentName = component.name ?? "";
  let content = "";
  switch (component.type) {
    case "button":
      content = component.props.title ?? "";
      break;
    case "heading":
      content = [
        component.props.text,
        `h${component.props.level}`,
        "heading",
        "제목",
      ]
        .filter(Boolean)
        .join(" ");
      break;
    case "textarea":
      content = [component.props.value, component.props.placeholder]
        .filter(Boolean)
        .join(" ");
      break;
    case "quill":
      content = [
        component.props.value
          ?.replace(/<[^>]*>/g, " ")
          .replace(/\s+/g, " ")
          .trim(),
        component.props.placeholder,
      ]
        .filter(Boolean)
        .join(" ");
      break;
    case "image":
      content = "image 이미지";
      break;
    case "container":
      content = "container 컨테이너";
      break;
    case "scrollToTopButton":
      content = [component.props.title, "scrollToTop", "scroll top", "맨위로"]
        .filter(Boolean)
        .join(" ");
      break;
    case "link":
      content = [
        component.props.title,
        component.props.value,
        component.props.linkType,
        "link",
        "링크",
      ]
        .filter(Boolean)
        .join(" ");
      break;
  }
  return `${componentName} ${component.type.toLowerCase()} ${content}`.toLowerCase();
};

export const filterLayerComponents = (
  items: LayoutComponent[],
  search: string,
): LayoutComponent[] => {
  const keyword = normalizeSearchText(search);
  if (!keyword) return items;
  const filterRecursive = (
    component: LayoutComponent,
  ): LayoutComponent | null => {
    const selfMatched = normalizeSearchText(
      getComponentSearchText(component),
    ).includes(keyword);
    if (component.type !== "container") return selfMatched ? component : null;
    const filteredChildren = component.children
      .map(filterRecursive)
      .filter((child): child is LayoutComponent => child !== null);
    return selfMatched || filteredChildren.length > 0
      ? {
          ...component,
          children: selfMatched ? component.children : filteredChildren,
        }
      : null;
  };
  return items
    .map(filterRecursive)
    .filter((component): component is LayoutComponent => component !== null);
};
