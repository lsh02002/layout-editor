import { z } from "zod";

const baseComponentSchema = z.object({
  id: z.string().trim().min(1, "id가 올바르지 않습니다."),
  name: z.string().trim().min(1, "name이 올바르지 않습니다.").optional(),
  customCss: z.string().optional(),

  order: z.number().finite("order가 올바르지 않습니다."),

  style: z.record(z.string(), z.unknown()).optional(),
  contentStyle: z.record(z.string(), z.unknown()).optional(),
  layout: z.record(z.string(), z.unknown()).optional(),
});

const disabledSchema = z.object({
  disabled: z.boolean().optional(),
});

/**
 * Button
 */
const buttonSchema = baseComponentSchema.extend({
  type: z.literal("button"),

  props: disabledSchema.extend({
    title: z.string({
      error: "button.title이 올바르지 않습니다.",
    }),
  }),
});

/**
 * Scroll To Top Button
 */
const scrollToTopButtonSchema = baseComponentSchema.extend({
  type: z.literal("scrollToTopButton"),

  props: disabledSchema.extend({
    title: z.string({
      error: "scrollToTopButton.title이 올바르지 않습니다.",
    }),
  }),
});

/**
 * Heading
 */
const headingSchema = baseComponentSchema.extend({
  type: z.literal("heading"),

  props: disabledSchema.extend({
    text: z.string({
      error: "heading.text가 올바르지 않습니다.",
    }),

    level: z.union([
      z.literal(1),
      z.literal(2),
      z.literal(3),
      z.literal(4),
      z.literal(5),
      z.literal(6),
    ]),
  }),
});

/**
 * Textarea
 */
const textareaSchema = baseComponentSchema.extend({
  type: z.literal("textarea"),

  props: disabledSchema.extend({
    value: z.string({
      error: "textarea.value가 올바르지 않습니다.",
    }),

    placeholder: z.string().optional(),

    rows: z.number().optional(),
  }),
});

/**
 * Quill
 */
const quillSchema = baseComponentSchema.extend({
  type: z.literal("quill"),

  props: disabledSchema.extend({
    value: z.string({
      error: "quill.value가 올바르지 않습니다.",
    }),

    placeholder: z.string().optional(),
  }),
});

/**
 * Image
 */
const imageSchema = baseComponentSchema.extend({
  type: z.literal("image"),

  props: disabledSchema.extend({
    urls: z
      .array(z.string(), {
        error: "image.urls가 배열이 아닙니다.",
      })
      .max(1, "이미지 컴포넌트에는 이미지 1개만 허용됩니다."),
  }),
});

/**
 * Link
 */
const linkSchema = baseComponentSchema.extend({
  type: z.literal("link"),

  props: disabledSchema.extend({
    title: z.string({
      error: "link.title이 올바르지 않습니다.",
    }),

    value: z.string({
      error: "link.value가 올바르지 않습니다.",
    }),

    linkType: z.enum(["url", "tel", "email"], {
      error: "link.linkType이 올바르지 않습니다.",
    }),

    newWindow: z.boolean().optional(),
  }),
});

/**
 * Container는 자기 자신을 children으로 가질 수 있기 때문에
 * recursive schema가 필요함.
 */

type ComponentSchema =
  | z.infer<typeof buttonSchema>
  | z.infer<typeof scrollToTopButtonSchema>
  | z.infer<typeof headingSchema>
  | z.infer<typeof textareaSchema>
  | z.infer<typeof quillSchema>
  | z.infer<typeof imageSchema>
  | z.infer<typeof linkSchema>
  | {
      id: string;
      name?: string;
      customCss?: string;
      order: number;
      type: "container";
      props: {
        direction: "row" | "column";
        disabled?: boolean;
      };
      style?: Record<string, unknown>;
      contentStyle?: Record<string, unknown>;
      layout?: Record<string, unknown>;
      children: ComponentSchema[];
    };

const componentSchema: z.ZodType<ComponentSchema> = z.lazy(() =>
  z.discriminatedUnion("type", [
    buttonSchema,
    scrollToTopButtonSchema,
    headingSchema,
    textareaSchema,
    quillSchema,
    imageSchema,
    linkSchema,

    baseComponentSchema.extend({
      type: z.literal("container"),

      props: disabledSchema.extend({
        direction: z.enum(["row", "column"], {
          error: "container.direction이 올바르지 않습니다.",
        }),
      }),

      children: z.array(componentSchema, {
        error: "container.children이 배열이 아닙니다.",
      }),
    }),
  ]),
);

export const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const validateComponent = (
  value: unknown,
  path = "components",
): string | null => {
  const result = componentSchema.safeParse(value);

  if (result.success) {
    return null;
  }

  const issue = result.error.issues[0];

  if (!issue) {
    return `${path}: 컴포넌트 형식이 올바르지 않습니다.`;
  }

  const issuePath =
    issue.path.length > 0
      ? `.${issue.path
          .map((key) => (typeof key === "number" ? `[${key}]` : String(key)))
          .join(".")
          .replace(/\.\[/g, "[")}`
      : "";

  return `${path}${issuePath}: ${issue.message}`;
};

export { componentSchema };
