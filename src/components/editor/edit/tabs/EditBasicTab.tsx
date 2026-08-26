import type { CSSProperties, Dispatch, SetStateAction } from "react";

import type {
  ComponentType,
  LayoutComponent,
  LinkType,
} from "../../../../types/types";

import EditButtonFields from "../fields/EditButtonFields";
import EditContainerFields from "../fields/EditContainerFields";
import EditHeadingFields from "../fields/EditHeadingFields";
import EditImageFields from "../fields/EditImageFields";
import EditLinkFields from "../fields/EditLinkFields";
import EditQuillFields from "../fields/EditQuillFields";
import EditTextareaFields from "../fields/EditTextareaFields";

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

type Props = {
  editType: ComponentType;

  editTitle: string;
  setEditTitle: Dispatch<SetStateAction<string>>;

  editValue: string;
  setEditValue: Dispatch<SetStateAction<string>>;

  editPlaceholder: string;
  setEditPlaceholder: Dispatch<SetStateAction<string>>;

  editDirection: "row" | "column";
  setEditDirection: Dispatch<SetStateAction<"row" | "column">>;

  editDisabled: boolean;
  setEditDisabled: Dispatch<SetStateAction<boolean>>;

  editContentStyle: CSSProperties;

  editImageUrl: string;
  setEditImageUrl: Dispatch<SetStateAction<string>>;

  editImagePreviewUrl: string;
  setEditImagePreviewUrl: Dispatch<SetStateAction<string>>;

  editLinkType: LinkType;
  setEditLinkType: Dispatch<SetStateAction<LinkType>>;

  editLinkNewWindow: boolean;
  setEditLinkNewWindow: Dispatch<SetStateAction<boolean>>;

  editComponentName: string;
  setEditComponentName: Dispatch<SetStateAction<string>>;

  editHeadingLevel: HeadingLevel;
  setEditHeadingLevel: Dispatch<SetStateAction<HeadingLevel>>;

  onImmediateChange: (
    updater: (component: LayoutComponent) => LayoutComponent,
  ) => void;
};

function EditBasicTab({
  editType,

  editTitle,
  setEditTitle,

  editValue,
  setEditValue,

  editPlaceholder,
  setEditPlaceholder,

  editDirection,
  setEditDirection,

  editDisabled,
  setEditDisabled,

  editContentStyle,

  editImageUrl,
  setEditImageUrl,

  editImagePreviewUrl,
  setEditImagePreviewUrl,

  editLinkType,
  setEditLinkType,

  editLinkNewWindow,
  setEditLinkNewWindow,

  editComponentName,
  setEditComponentName,

  editHeadingLevel,
  setEditHeadingLevel,

  onImmediateChange,
}: Props) {
  const handleComponentNameChange = (name: string) => {
    setEditComponentName(name);

    onImmediateChange((component) => ({
      ...component,
      name,
    }));
  };

  const handleTitleChange = (title: string) => {
    setEditTitle(title);

    onImmediateChange((component) => {
      if (
        component.type !== "button" &&
        component.type !== "link" &&
        component.type !== "scrollToTopButton"
      ) {
        return component;
      }

      return {
        ...component,
        props: {
          ...component.props,
          title,
        },
      } as LayoutComponent;
    });
  };

  const handleValueChange = (value: string) => {
    setEditValue(value);

    onImmediateChange((component) => {
      switch (component.type) {
        case "heading":
          return {
            ...component,
            props: {
              ...component.props,
              text: value,
            },
          };

        case "textarea":
        case "quill":
          return {
            ...component,
            props: {
              ...component.props,
              value,
            },
          };

        case "link":
          return {
            ...component,
            props: {
              ...component.props,
              value,
            },
          };

        default:
          return component;
      }
    });
  };

  const handlePlaceholderChange = (placeholder: string) => {
    setEditPlaceholder(placeholder);

    onImmediateChange((component) => {
      if (component.type !== "textarea" && component.type !== "quill") {
        return component;
      }

      return {
        ...component,
        props: {
          ...component.props,
          placeholder,
        },
      };
    });
  };

  const handleImageUrlChange = (url: string) => {
    setEditImageUrl(url);

    onImmediateChange((component) => {
      if (component.type !== "image") {
        return component;
      }

      return {
        ...component,
        props: {
          ...component.props,
          urls: url.trim() ? [url.trim()] : [],
        },
      };
    });
  };

  const handleHeadingLevelChange = (level: HeadingLevel) => {
    setEditHeadingLevel(level);

    onImmediateChange((component) => {
      if (component.type !== "heading") {
        return component;
      }

      return {
        ...component,
        props: {
          ...component.props,
          level,
        },
      };
    });
  };

  const handleLinkTypeChange = (linkType: LinkType) => {
    setEditLinkType(linkType);

    if (linkType !== "url") {
      setEditLinkNewWindow(false);
    }

    onImmediateChange((component) => {
      if (component.type !== "link") {
        return component;
      }

      return {
        ...component,
        props: {
          ...component.props,
          linkType,
          newWindow: linkType === "url" ? component.props.newWindow : false,
        },
      };
    });
  };

  const handleLinkNewWindowChange = (newWindow: boolean) => {
    setEditLinkNewWindow(newWindow);

    onImmediateChange((component) => {
      if (component.type !== "link") {
        return component;
      }

      return {
        ...component,
        props: {
          ...component.props,
          newWindow,
        },
      };
    });
  };

  const handleDirectionChange = (direction: "row" | "column") => {
    setEditDirection(direction);

    onImmediateChange((component) => {
      if (component.type !== "container") {
        return component;
      }

      return {
        ...component,
        props: {
          ...component.props,
          direction,
        },
      };
    });
  };

  const handleDisabledChange = (disabled: boolean) => {
    setEditDisabled(disabled);

    onImmediateChange(
      (component) =>
        ({
          ...component,
          props: {
            ...component.props,
            disabled,
          },
        }) as LayoutComponent,
    );
  };

  return (
    <>
      {/* 타입 */}
      <div className="mb-3">
        <label className="form-label">타입</label>

        <input type="text" className="form-control" value={editType} disabled />
      </div>

      {/* 버튼 */}
      {(editType === "button" || editType === "scrollToTopButton") && (
        <div className="mb-3">
          <EditButtonFields
            componentName={editComponentName}
            title={editTitle}
            placeholder={editType === "scrollToTopButton" ? "↑" : "버튼"}
            onComponentNameChange={handleComponentNameChange}
            onTitleChange={handleTitleChange}
          />
        </div>
      )}

      {/* Heading */}
      {editType === "heading" && (
        <div className="mb-3">
          <EditHeadingFields
            value={editValue}
            level={editHeadingLevel}
            onValueChange={handleValueChange}
            onLevelChange={handleHeadingLevelChange}
          />
        </div>
      )}

      {/* Textarea */}
      {editType === "textarea" && (
        <div className="mb-3">
          <EditTextareaFields
            componentName={editComponentName}
            value={editValue}
            placeholder={editPlaceholder}
            contentStyle={editContentStyle}
            onComponentNameChange={handleComponentNameChange}
            onValueChange={handleValueChange}
            onPlaceholderChange={handlePlaceholderChange}
          />
        </div>
      )}

      {/* Quill */}
      {editType === "quill" && (
        <div className="mb-3">
          <EditQuillFields
            componentName={editComponentName}
            value={editValue}
            placeholder={editPlaceholder}
            onComponentNameChange={handleComponentNameChange}
            onValueChange={handleValueChange}
            onPlaceholderChange={handlePlaceholderChange}
          />
        </div>
      )}

      {/* Image */}
      {editType === "image" && (
        <div className="mb-3">
          <EditImageFields
            componentName={editComponentName}
            imageUrl={editImageUrl}
            previewUrl={editImagePreviewUrl}
            onComponentNameChange={handleComponentNameChange}
            onImageUrlChange={handleImageUrlChange}
            onPreviewUrlChange={setEditImagePreviewUrl}
          />
        </div>
      )}

      {/* Link */}
      {editType === "link" && (
        <div className="mb-3">
          <EditLinkFields
            componentName={editComponentName}
            title={editTitle}
            linkType={editLinkType}
            value={editValue}
            newWindow={editLinkNewWindow}
            onComponentNameChange={handleComponentNameChange}
            onTitleChange={handleTitleChange}
            onValueChange={handleValueChange}
            onLinkTypeChange={handleLinkTypeChange}
            onNewWindowChange={handleLinkNewWindowChange}
          />
        </div>
      )}

      {/* Container */}
      {editType === "container" && (
        <div className="mb-3">
          <EditContainerFields
            componentName={editComponentName}
            direction={editDirection}
            onComponentNameChange={handleComponentNameChange}
            onDirectionChange={handleDirectionChange}
          />
        </div>
      )}

      {/* Disabled */}
      {editType !== "container" && (
        <div className="form-check mb-3">
          <input
            type="checkbox"
            className="form-check-input"
            id="editDisabled"
            checked={editDisabled}
            onChange={(event) => {
              handleDisabledChange(event.target.checked);
            }}
          />

          <label className="form-check-label" htmlFor="editDisabled">
            Disabled
          </label>
        </div>
      )}
    </>
  );
}

export default EditBasicTab;
