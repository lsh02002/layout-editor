import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { z } from "zod";
import type { LayoutComponent } from "../../../types/types";
import type { EditBasicContext } from "../edit/types/editBasicContext";
import type { HtmlExporter } from "../utils/htmlexport/htmlExportTypes";

type FieldOption<T extends string | number = string | number> = {
  label: string;
  value: T;
};

export type ComponentField =
  | {
      type: "text";
      label: string;
      placeholder?: string;
      getValue?: (value: unknown) => string;
      setValue?: (value: string) => unknown;
    }
  | {
      type: "textarea";
      label: string;
      placeholder?: string;
    }
  | {
      type: "number";
      label: string;
      min?: number;
      max?: number;
    }
  | {
      type: "select";
      label: string;
      options: FieldOption[];
    }
  | {
      type: "checkbox";
      label: string;
    }
  | {
      type: "radio";
      label: string;
      options: FieldOption[];
    };

export type RegistryCreatedComponent<TType extends string = string> = {
  id: string;
  name: string;
  type: TType;
  order: number;
  props: Record<string, unknown>;
  [key: string]: unknown;
};

export type ComponentRegistryShape<TType extends string = string> = {
  label: string;
  description: string;
  icon: LucideIcon;
  supportsDisabled: boolean;
  propsSchema: z.ZodTypeAny;
  maxInstances?: number;
  fields: Partial<Record<string, ComponentField>>;
  defaultProps: Record<string, unknown>;
  createComponent: (
    id: string,
    props: Record<string, unknown>,
  ) => RegistryCreatedComponent<TType>;
  editor: (
    context: EditBasicContext,
    fields: Partial<Record<string, ComponentField>>,
  ) => ReactNode;
  canvas?: (component: LayoutComponent) => ReactNode;
  getSearchText?: (component: LayoutComponent) => string;
  getDisplayName?: (component: LayoutComponent) => string;
  exportHtml: HtmlExporter;
};

export type ComponentRegistry = Record<string, ComponentRegistryShape>;
export type RegistryComponentType = string;

export type EditorConfig = {
  components: ComponentRegistry;
};

export type RegisteredLayoutComponent =
  | LayoutComponent
  | RegistryCreatedComponent;

export function getComponentRegistryEntries(
  componentRegistry: ComponentRegistry,
) {
  return Object.entries(componentRegistry);
}

export function createDefaultComponent(
  componentRegistry: ComponentRegistry,
  type: RegistryComponentType,
): RegisteredLayoutComponent {
  return createComponentFromProps(componentRegistry, type, {});
}

export function createComponentFromProps(
  componentRegistry: ComponentRegistry,
  type: RegistryComponentType,
  props: Record<string, unknown>,
  name?: string,
): RegisteredLayoutComponent {
  const definition = componentRegistry[type];
  const mergedProps = {
    ...structuredClone(definition.defaultProps),
    ...props,
  };
  const component = definition.createComponent(
    crypto.randomUUID(),
    mergedProps,
  );
  return {
    ...component,
    name: name?.trim() || component.name,
  };
}

export function getComponentDefinition(
  componentRegistry: ComponentRegistry,
  type: RegistryComponentType,
) {
  return componentRegistry[type];
}

export function renderComponentEditor(
  componentRegistry: ComponentRegistry,
  context: EditBasicContext,
): ReactNode {
  const definition = componentRegistry[context.component.type];
  return definition.editor(context, definition.fields);
}

export function renderComponentCanvas(
  componentRegistry: ComponentRegistry,
  component: RegisteredLayoutComponent,
): ReactNode {
  const definition = componentRegistry[component.type];
  if (!definition?.canvas) {
    return null;
  }
  return definition.canvas(component as LayoutComponent);
}

export function validateComponentProps(
  componentRegistry: ComponentRegistry,
  component: RegisteredLayoutComponent,
) {
  const definition = componentRegistry[component.type];

  if (!definition) {
    return {
      success: false,
    };
  }

  return definition.propsSchema.safeParse(component.props);
}

export function getComponentSearchText(
  componentRegistry: ComponentRegistry,
  component: RegisteredLayoutComponent,
): string {
  const definition = componentRegistry[component.type];
  const content =
    definition.getSearchText?.(component as LayoutComponent) ?? "";
  return [
    component.name ?? "",
    component.type,
    definition.label,
    definition.description,
    content,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}
