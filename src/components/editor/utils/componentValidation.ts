import type { ComponentType } from "../../../types/types";
import { VALID_COMPONENT_TYPES } from "../../../types/types";

export const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const isValidComponentType = (value: unknown): value is ComponentType =>
  typeof value === "string" &&
  VALID_COMPONENT_TYPES.includes(
    value as (typeof VALID_COMPONENT_TYPES)[number],
  );

export const validateComponent = (
  value: unknown,
  path = "components",
): string | null => {
  if (!isObject(value)) {
    return `${path}: 컴포넌트 형식이 올바르지 않습니다.`;
  }

  if (typeof value.id !== "string" || value.id.trim() === "") {
    return `${path}: id가 올바르지 않습니다.`;
  }

  if (
    value.name !== undefined &&
    (typeof value.name !== "string" || value.name.trim() === "")
  ) {
    return `${path}: name이 올바르지 않습니다.`;
  }

  if (value.customCss !== undefined && typeof value.customCss !== "string") {
    return `${path}: customCss가 올바르지 않습니다.`;
  }

  if (!isValidComponentType(value.type)) {
    return `${path}: 지원하지 않는 component type입니다. (${String(
      value.type,
    )})`;
  }

  if (typeof value.order !== "number" || !Number.isFinite(value.order)) {
    return `${path}: order가 올바르지 않습니다.`;
  }

  if (!isObject(value.props)) {
    return `${path}: props가 올바르지 않습니다.`;
  }

  if (value.style !== undefined && !isObject(value.style)) {
    return `${path}: style이 올바르지 않습니다.`;
  }

  if (value.contentStyle !== undefined && !isObject(value.contentStyle)) {
    return `${path}: contentStyle이 올바르지 않습니다.`;
  }

  if (value.layout !== undefined && !isObject(value.layout)) {
    return `${path}: layout이 올바르지 않습니다.`;
  }

  const props = value.props;

  switch (value.type) {
    case "button": {
      if (typeof props.title !== "string") {
        return `${path}: button.title이 올바르지 않습니다.`;
      }
      break;
    }

    case "scrollToTopButton": {
      if (typeof props.title !== "string") {
        return `${path}: scrollToTopButton.title이 올바르지 않습니다.`;
      }
      break;
    }

    case "heading": {
      if (typeof props.text !== "string") {
        return `${path}: heading.text가 올바르지 않습니다.`;
      }

      if (
        props.level !== 1 &&
        props.level !== 2 &&
        props.level !== 3 &&
        props.level !== 4 &&
        props.level !== 5 &&
        props.level !== 6
      ) {
        return `${path}: heading.level이 올바르지 않습니다.`;
      }

      break;
    }

    case "textarea": {
      if (typeof props.value !== "string") {
        return `${path}: textarea.value가 올바르지 않습니다.`;
      }

      if (
        props.placeholder !== undefined &&
        typeof props.placeholder !== "string"
      ) {
        return `${path}: textarea.placeholder가 올바르지 않습니다.`;
      }

      if (props.rows !== undefined && typeof props.rows !== "number") {
        return `${path}: textarea.rows가 올바르지 않습니다.`;
      }

      break;
    }

    case "quill": {
      if (typeof props.value !== "string") {
        return `${path}: quill.value가 올바르지 않습니다.`;
      }

      if (
        props.placeholder !== undefined &&
        typeof props.placeholder !== "string"
      ) {
        return `${path}: quill.placeholder가 올바르지 않습니다.`;
      }

      break;
    }

    case "image": {
      if (!Array.isArray(props.urls)) {
        return `${path}: image.urls가 배열이 아닙니다.`;
      }

      if (props.urls.some((url) => typeof url !== "string")) {
        return `${path}: image.urls에 잘못된 값이 있습니다.`;
      }

      if (props.urls.length > 1) {
        return `${path}: 이미지 컴포넌트에는 이미지 1개만 허용됩니다.`;
      }

      break;
    }

    case "link": {
      if (typeof props.title !== "string") {
        return `${path}: link.title이 올바르지 않습니다.`;
      }

      if (typeof props.value !== "string") {
        return `${path}: link.value가 올바르지 않습니다.`;
      }

      if (
        props.linkType !== "url" &&
        props.linkType !== "tel" &&
        props.linkType !== "email"
      ) {
        return `${path}: link.linkType이 올바르지 않습니다.`;
      }

      if (
        props.newWindow !== undefined &&
        typeof props.newWindow !== "boolean"
      ) {
        return `${path}: link.newWindow 값이 올바르지 않습니다.`;
      }

      break;
    }

    case "container": {
      if (props.direction !== "row" && props.direction !== "column") {
        return `${path}: container.direction이 올바르지 않습니다.`;
      }

      if (!Array.isArray(value.children)) {
        return `${path}: container.children이 배열이 아닙니다.`;
      }

      for (let index = 0; index < value.children.length; index += 1) {
        const error = validateComponent(
          value.children[index],
          `${path}.children[${index}]`,
        );

        if (error) {
          return error;
        }
      }

      break;
    }
  }

  if (
    "disabled" in props &&
    props.disabled !== undefined &&
    typeof props.disabled !== "boolean"
  ) {
    return `${path}: disabled 값이 올바르지 않습니다.`;
  }

  return null;
};
