import { z } from "zod";
import type { ComponentType, LayoutComponent } from "../../../types/types";
import { componentRegistry } from "../registry/componentRegistry";

const baseComponentSchema = z.object({
  id: z.string().trim().min(1, "id가 올바르지 않습니다."),
  name: z.string().trim().min(1, "name이 올바르지 않습니다.").optional(),
  customCss: z.string().optional(),
  order: z.number().finite("order가 올바르지 않습니다."),
  type: z.string(),
  props: z.unknown(),
  style: z.record(z.string(), z.unknown()).optional(),
  contentStyle: z.record(z.string(), z.unknown()).optional(),
  layout: z.record(z.string(), z.unknown()).optional(),
});

export const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isComponentType = (value: string): value is ComponentType =>
  value in componentRegistry;

const formatIssuePath = (basePath: string, issuePath: PropertyKey[]) => {
  if (issuePath.length === 0) {
    return basePath;
  }

  const suffix = issuePath
    .map((key) => {
      if (typeof key === "number") {
        return `[${key}]`;
      }

      return `.${String(key)}`;
    })
    .join("");

  return `${basePath}${suffix}`;
};

const formatIssue = (
  path: string,
  issue: {
    path: PropertyKey[];
    message: string;
  },
) => {
  return `${formatIssuePath(path, issue.path)}: ${issue.message}`;
};

export const validateComponent = (
  value: unknown,
  path = "components",
): string | null => {
  const baseResult = baseComponentSchema.safeParse(value);

  if (!baseResult.success) {
    const issue = baseResult.error.issues[0];

    if (!issue) {
      return `${path}: 컴포넌트 형식이 올바르지 않습니다.`;
    }

    return formatIssue(path, issue);
  }

  const component = baseResult.data;

  if (!isComponentType(component.type)) {
    return `${path}.type: 지원하지 않는 컴포넌트 타입입니다: ${component.type}`;
  }

  const definition = componentRegistry[component.type];
  const propsResult = definition.propsSchema.safeParse(component.props);

  if (!propsResult.success) {
    const issue = propsResult.error.issues[0];

    if (!issue) {
      return `${path}.props: props 형식이 올바르지 않습니다.`;
    }

    return formatIssue(`${path}.props`, issue);
  }

  if (component.type === "container") {
    if (!isObject(value)) {
      return `${path}: container 형식이 올바르지 않습니다.`;
    }

    const children = value.children;

    if (!Array.isArray(children)) {
      return `${path}.children: container.children이 배열이 아닙니다.`;
    }

    for (let index = 0; index < children.length; index += 1) {
      const error = validateComponent(
        children[index],
        `${path}.children[${index}]`,
      );

      if (error) {
        return error;
      }
    }
  }

  return null;
};

export const validateComponents = (value: unknown): string | null => {
  if (!Array.isArray(value)) {
    return "components: 배열이 아닙니다.";
  }

  for (let index = 0; index < value.length; index += 1) {
    const error = validateComponent(value[index], `components[${index}]`);

    if (error) {
      return error;
    }
  }

  return null;
};

export const componentSchema: z.ZodType<LayoutComponent> =
  z.custom<LayoutComponent>(
    (value) => validateComponent(value, "component") === null,
    {
      error: "컴포넌트 형식이 올바르지 않습니다.",
    },
  );

export const componentsSchema: z.ZodType<LayoutComponent[]> = z.custom<
  LayoutComponent[]
>((value) => validateComponents(value) === null, {
  error: "컴포넌트 배열 형식이 올바르지 않습니다.",
});
