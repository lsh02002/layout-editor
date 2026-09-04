import { useState } from "react";

import type { ComponentType, LayoutComponent } from "../../../types/types";

import EditButtonFields from "./fields/EditButtonFields";
import EditCodeEditorFields from "./fields/EditCodeEditorFields";
import EditContainerFields from "./fields/EditContainerFields";
import EditDividerFields from "./fields/EditDividerFields";
import EditHeadingFields from "./fields/EditHeadingFields";
import EditImageFields from "./fields/EditImageFields";
import EditImageGalleryFields from "./fields/EditImageGalleryFields";
import EditImageSliderFields from "./fields/EditImageSliderFields";
import EditLinkFields from "./fields/EditLinkFields";
import EditQuillFields from "./fields/EditQuillFields";
import EditSpacerFields from "./fields/EditSpacerFields";
import EditTextareaFields from "./fields/EditTextareaFields";
import EditVideoFields from "./fields/EditVideoFields";

import type { EditBasicContext } from "./types/editBasicContext";
import { componentRegistry } from "../registry/componentRegistry";
import FieldRenderer from "../../canvas/renderers";

type ComponentOf<T extends ComponentType> = Extract<
  LayoutComponent,
  { type: T }
>;

type PropsOf<T extends ComponentType> = ComponentOf<T>["props"];

function updateName(context: EditBasicContext, name: string) {
  context.updateComponent((component) => ({
    ...component,
    name,
  }));
}

function patchProps<T extends ComponentType>(
  context: EditBasicContext,
  type: T,
  values: Partial<PropsOf<T>>,
) {
  context.updateComponent((component) => {
    if (component.type !== type) {
      return component;
    }

    return {
      ...component,

      props: {
        ...component.props,
        ...values,
      },
    } as LayoutComponent;
  });
}

export function ButtonEditor(context: EditBasicContext) {
  const { component } = context;

  if (component.type !== "button") {
    return null;
  }

  return (
    <EditButtonFields
      componentName={component.name ?? ""}
      title={component.props.title}
      placeholder="버튼"
      onComponentNameChange={(name) => {
        updateName(context, name);
      }}
      onTitleChange={(title) => {
        patchProps(context, "button", {
          title,
        });
      }}
    />
  );
}

export function ScrollToTopButtonEditor(context: EditBasicContext) {
  const { component } = context;

  if (component.type !== "scrollToTopButton") {
    return null;
  }

  return (
    <EditButtonFields
      componentName={component.name ?? ""}
      title={component.props.title}
      placeholder="↑"
      onComponentNameChange={(name) => {
        updateName(context, name);
      }}
      onTitleChange={(title) => {
        patchProps(context, "scrollToTopButton", {
          title,
        });
      }}
    />
  );
}

export function HeadingEditor(context: EditBasicContext) {
  const { component } = context;

  if (component.type !== "heading") {
    return null;
  }

  return (
    <EditHeadingFields
      value={component.props.text}
      level={component.props.level}
      onValueChange={(text) => {
        patchProps(context, "heading", {
          text,
        });
      }}
      onLevelChange={(level) => {
        patchProps(context, "heading", {
          level,
        });
      }}
    />
  );
}

export function TextareaEditor(context: EditBasicContext) {
  const { component } = context;

  if (component.type !== "textarea") {
    return null;
  }

  return (
    <EditTextareaFields
      componentName={component.name ?? ""}
      value={component.props.value ?? ""}
      placeholder={component.props.placeholder ?? ""}
      contentStyle={component.contentStyle ?? {}}
      onComponentNameChange={(name) => {
        updateName(context, name);
      }}
      onValueChange={(value) => {
        patchProps(context, "textarea", {
          value,
        });
      }}
      onPlaceholderChange={(placeholder) => {
        patchProps(context, "textarea", {
          placeholder,
        });
      }}
    />
  );
}

export function QuillEditor(context: EditBasicContext) {
  const { component } = context;

  if (component.type !== "quill") {
    return null;
  }

  return (
    <EditQuillFields
      componentName={component.name ?? ""}
      value={component.props.value ?? ""}
      placeholder={component.props.placeholder ?? ""}
      onComponentNameChange={(name) => {
        updateName(context, name);
      }}
      onValueChange={(value) => {
        patchProps(context, "quill", {
          value,
        });
      }}
      onPlaceholderChange={(placeholder) => {
        patchProps(context, "quill", {
          placeholder,
        });
      }}
    />
  );
}

type ImageComponent = Extract<LayoutComponent, { type: "image" }>;

type ImageEditorInnerProps = {
  context: EditBasicContext;
  component: ImageComponent;
};

function ImageEditorInner({ context, component }: ImageEditorInnerProps) {
  const imageUrl = component.props.urls?.[0] ?? "";

  const [previewUrl, setPreviewUrl] = useState(imageUrl);

  return (
    <EditImageFields
      componentName={component.name ?? ""}
      imageUrl={imageUrl}
      previewUrl={previewUrl}
      onComponentNameChange={(name) => {
        updateName(context, name);
      }}
      onImageUrlChange={(url) => {
        setPreviewUrl(url);

        patchProps(context, "image", {
          urls: url.trim() ? [url.trim()] : [],
        });
      }}
      onPreviewUrlChange={setPreviewUrl}
    />
  );
}

export function ImageEditor(context: EditBasicContext) {
  const { component } = context;

  if (component.type !== "image") {
    return null;
  }

  return (
    <ImageEditorInner
      key={component.id}
      context={context}
      component={component}
    />
  );
}

export function ImageSliderEditor(context: EditBasicContext) {
  const { component } = context;

  if (component.type !== "imageSlider") {
    return null;
  }

  return (
    <EditImageSliderFields
      componentName={component.name ?? ""}
      urls={component.props.urls}
      autoplay={component.props.autoplay ?? false}
      interval={component.props.interval ?? 3000}
      showArrows={component.props.showArrows ?? true}
      showDots={component.props.showDots ?? true}
      loop={component.props.loop ?? true}
      onComponentNameChange={(name) => {
        updateName(context, name);
      }}
      onUrlsChange={(urls) => {
        patchProps(context, "imageSlider", {
          urls,
        });
      }}
      onAutoplayChange={(autoplay) => {
        patchProps(context, "imageSlider", {
          autoplay,
        });
      }}
      onIntervalChange={(interval) => {
        patchProps(context, "imageSlider", {
          interval,
        });
      }}
      onShowArrowsChange={(showArrows) => {
        patchProps(context, "imageSlider", {
          showArrows,
        });
      }}
      onShowDotsChange={(showDots) => {
        patchProps(context, "imageSlider", {
          showDots,
        });
      }}
      onLoopChange={(loop) => {
        patchProps(context, "imageSlider", {
          loop,
        });
      }}
    />
  );
}

export function ImageGalleryEditor(context: EditBasicContext) {
  const { component } = context;

  if (component.type !== "imageGallery") {
    return null;
  }

  return (
    <EditImageGalleryFields
      componentName={component.name ?? ""}
      urls={component.props.urls}
      columns={component.props.columns ?? 3}
      gap={component.props.gap ?? 8}
      objectFit={component.props.objectFit ?? "cover"}
      borderRadius={component.props.borderRadius ?? 8}
      onComponentNameChange={(name) => {
        updateName(context, name);
      }}
      onUrlsChange={(urls) => {
        patchProps(context, "imageGallery", {
          urls,
        });
      }}
      onColumnsChange={(columns) => {
        patchProps(context, "imageGallery", {
          columns,
        });
      }}
      onGapChange={(gap) => {
        patchProps(context, "imageGallery", {
          gap,
        });
      }}
      onObjectFitChange={(objectFit) => {
        patchProps(context, "imageGallery", {
          objectFit,
        });
      }}
      onBorderRadiusChange={(borderRadius) => {
        patchProps(context, "imageGallery", {
          borderRadius,
        });
      }}
    />
  );
}

export function VideoEditor(context: EditBasicContext) {
  const { component } = context;

  if (component.type !== "video") {
    return null;
  }

  return (
    <EditVideoFields
      componentName={component.name ?? ""}
      src={component.props.src ?? ""}
      controls={component.props.controls ?? true}
      autoplay={component.props.autoplay ?? false}
      muted={component.props.muted ?? false}
      loop={component.props.loop ?? false}
      onComponentNameChange={(name) => {
        updateName(context, name);
      }}
      onSrcChange={(src) => {
        patchProps(context, "video", {
          src,
        });
      }}
      onControlsChange={(controls) => {
        patchProps(context, "video", {
          controls,
        });
      }}
      onAutoplayChange={(autoplay) => {
        context.updateComponent((current) => {
          if (current.type !== "video") {
            return current;
          }

          return {
            ...current,

            props: {
              ...current.props,

              autoplay,

              muted: autoplay ? true : current.props.muted,
            },
          };
        });
      }}
      onMutedChange={(muted) => {
        patchProps(context, "video", {
          muted,
        });
      }}
      onLoopChange={(loop) => {
        patchProps(context, "video", {
          loop,
        });
      }}
    />
  );
}

export function LinkEditor(context: EditBasicContext) {
  const { component } = context;

  if (component.type !== "link") {
    return null;
  }

  return (
    <EditLinkFields
      componentName={component.name ?? ""}
      title={component.props.title ?? ""}
      linkType={component.props.linkType}
      value={component.props.value ?? ""}
      newWindow={component.props.newWindow ?? false}
      onComponentNameChange={(name) => {
        updateName(context, name);
      }}
      onTitleChange={(title) => {
        patchProps(context, "link", {
          title,
        });
      }}
      onValueChange={(value) => {
        patchProps(context, "link", {
          value,
        });
      }}
      onLinkTypeChange={(linkType) => {
        context.updateComponent((current) => {
          if (current.type !== "link") {
            return current;
          }

          return {
            ...current,

            props: {
              ...current.props,

              linkType,

              newWindow: linkType === "url" ? current.props.newWindow : false,
            },
          };
        });
      }}
      onNewWindowChange={(newWindow) => {
        patchProps(context, "link", {
          newWindow,
        });
      }}
    />
  );
}

type DividerComponent = Extract<LayoutComponent, { type: "divider" }>;

type DividerEditorInnerProps = {
  context: EditBasicContext;
  component: DividerComponent;
};

function DividerEditorInner({ context, component }: DividerEditorInnerProps) {
  const [color, setColor] = useState(component.props.color ?? "#dee2e6");

  const commitColor = () => {
    if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
      return;
    }

    if (color === component.props.color) {
      return;
    }

    patchProps(context, "divider", {
      color,
    });
  };

  return (
    <EditDividerFields
      componentName={component.name ?? ""}
      thickness={component.props.thickness ?? 3}
      color={color}
      lineStyle={component.props.lineStyle ?? "solid"}
      onComponentNameChange={(name) => {
        updateName(context, name);
      }}
      onThicknessChange={(thickness) => {
        patchProps(context, "divider", {
          thickness,
        });
      }}
      onColorChange={(value) => {
        setColor(value);
      }}
      onColorCommit={commitColor}
      onLineStyleChange={(lineStyle) => {
        patchProps(context, "divider", {
          lineStyle,
        });
      }}
    />
  );
}

export function DividerEditor(context: EditBasicContext) {
  const { component } = context;

  if (component.type !== "divider") {
    return null;
  }

  return (
    <DividerEditorInner
      key={component.id}
      context={context}
      component={component}
    />
  );
}

export function SpacerEditor(context: EditBasicContext) {
  const { component } = context;

  if (component.type !== "spacer") {
    return null;
  }

  return (
    <EditSpacerFields
      componentName={component.name ?? ""}
      height={component.props.height ?? 32}
      onComponentNameChange={(name) => {
        updateName(context, name);
      }}
      onHeightChange={(height) => {
        patchProps(context, "spacer", {
          height,
        });
      }}
    />
  );
}

export function CodeEditorEditor(context: EditBasicContext) {
  const { component } = context;

  if (component.type !== "codeEditor") {
    return null;
  }

  return (
    <EditCodeEditorFields
      componentName={component.name ?? ""}
      value={component.props.value ?? ""}
      language={component.props.language}
      onComponentNameChange={(name) => {
        updateName(context, name);
      }}
      onValueChange={(value) => {
        patchProps(context, "codeEditor", {
          value,
        });
      }}
      onLanguageChange={(language) => {
        patchProps(context, "codeEditor", {
          language,
        });
      }}
    />
  );
}

export function ContainerEditor(context: EditBasicContext) {
  const { component } = context;

  if (component.type !== "container") {
    return null;
  }

  return (
    <EditContainerFields
      componentName={component.name ?? ""}
      direction={component.props.direction ?? "column"}
      gap={component.props.gap ?? 0}
      justifyContent={component.props.justifyContent ?? "flex-start"}
      alignItems={component.props.alignItems ?? "stretch"}
      maxWidth={component.props.maxWidth}
      onComponentNameChange={(name) => {
        updateName(context, name);
      }}
      onDirectionChange={(direction) => {
        patchProps(context, "container", {
          direction,
        });
      }}
      onGapChange={(gap) => {
        patchProps(context, "container", {
          gap,
        });
      }}
      onJustifyContentChange={(justifyContent) => {
        patchProps(context, "container", {
          justifyContent,
        });
      }}
      onAlignItemsChange={(alignItems) => {
        patchProps(context, "container", {
          alignItems,
        });
      }}
      onMaxWidthChange={(maxWidth) => {
        patchProps(context, "container", {
          maxWidth,
        });
      }}
    />
  );
}

export default function RegistryFieldsEditor({
  component,
  updateComponent,
}: {
  component: LayoutComponent;
  updateComponent: (
    updater: (current: LayoutComponent) => LayoutComponent,
  ) => void;
}) {
  const fields = componentRegistry[component.type].fields;
  if (!fields) {
    return null;
  }
  return (
    <>
      {Object.entries(fields).map(([name, field]) => (
        <FieldRenderer
          key={name}
          name={name}
          field={field}
          value={(component.props as Record<string, unknown>)[name]}
          onChange={(value) => {
            updateComponent(
              (current) =>
                ({
                  ...current,
                  props: {
                    ...current.props,
                    [name]: value,
                  },
                }) as LayoutComponent,
            );
          }}
        />
      ))}
    </>
  );
}
