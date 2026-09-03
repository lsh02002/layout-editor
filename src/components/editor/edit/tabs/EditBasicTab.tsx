import type { CSSProperties, Dispatch, SetStateAction } from "react";

import type {
  ComponentType,
  LayoutComponent,
  LinkType,
  HeadingLevel,
  ContainerJustifyContent,
  ContainerAlignItems,
  CodeLanguage,
} from "../../../../types/types";

import EditButtonFields from "../fields/EditButtonFields";
import EditContainerFields from "../fields/EditContainerFields";
import EditHeadingFields from "../fields/EditHeadingFields";
import EditImageFields from "../fields/EditImageFields";
import EditLinkFields from "../fields/EditLinkFields";
import EditQuillFields from "../fields/EditQuillFields";
import EditTextareaFields from "../fields/EditTextareaFields";
import EditDividerFields from "../fields/EditDividerFields";
import EditSpacerFields from "../fields/EditSpacerFields";
import EditVideoFields from "../fields/EditVideoFields";
import EditCodeEditorFields from "../fields/EditCodeEditorFields";
import EditImageSliderFields from "../fields/EditImageSliderFields";
import EditImageGalleryFields from "../fields/EditImageGalleryFields";

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

  editGalleryUrls: string[];
  setEditGalleryUrls: Dispatch<SetStateAction<string[]>>;
  editGalleryColumns: number;
  setEditGalleryColumns: Dispatch<SetStateAction<number>>;
  editGalleryGap: number;
  setEditGalleryGap: Dispatch<SetStateAction<number>>;
  editGalleryObjectFit: "cover" | "contain" | "fill";
  setEditGalleryObjectFit: Dispatch<
    SetStateAction<"cover" | "contain" | "fill">
  >;
  editGalleryBorderRadius: number;
  setEditGalleryBorderRadius: Dispatch<SetStateAction<number>>;

  editSliderUrls: string[];
  setEditSliderUrls: Dispatch<SetStateAction<string[]>>;
  editSliderAutoplay: boolean;
  setEditSliderAutoplay: Dispatch<SetStateAction<boolean>>;
  editSliderInterval: number;
  setEditSliderInterval: Dispatch<SetStateAction<number>>;
  editSliderShowArrows: boolean;
  setEditSliderShowArrows: Dispatch<SetStateAction<boolean>>;
  editSliderShowDots: boolean;
  setEditSliderShowDots: Dispatch<SetStateAction<boolean>>;
  editSliderLoop: boolean;
  setEditSliderLoop: Dispatch<SetStateAction<boolean>>;

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

  editDividerThickness: number;
  setEditDividerThickness: Dispatch<SetStateAction<number>>;

  editDividerColor: string;
  setEditDividerColor: Dispatch<SetStateAction<string>>;

  editDividerLineStyle: "solid" | "dashed" | "dotted";
  setEditDividerLineStyle: Dispatch<
    SetStateAction<"solid" | "dashed" | "dotted">
  >;

  editSpacerHeight: number;
  setEditSpacerHeight: Dispatch<SetStateAction<number>>;

  editContainerGap: number;
  setEditContainerGap: Dispatch<SetStateAction<number>>;
  editContainerJustifyContent: ContainerJustifyContent;
  setEditContainerJustifyContent: Dispatch<
    SetStateAction<ContainerJustifyContent>
  >;
  editContainerAlignItems: ContainerAlignItems;
  setEditContainerAlignItems: Dispatch<SetStateAction<ContainerAlignItems>>;
  editContainerMaxWidth: number | undefined;
  setEditContainerMaxWidth: Dispatch<SetStateAction<number | undefined>>;

  editVideoControls: boolean;
  setEditVideoControls: Dispatch<SetStateAction<boolean>>;
  editVideoAutoplay: boolean;
  setEditVideoAutoplay: Dispatch<SetStateAction<boolean>>;
  editVideoMuted: boolean;
  setEditVideoMuted: Dispatch<SetStateAction<boolean>>;
  editVideoLoop: boolean;
  setEditVideoLoop: Dispatch<SetStateAction<boolean>>;

  editCodeLanguage: CodeLanguage;
  setEditCodeLanguage: Dispatch<SetStateAction<CodeLanguage>>;
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

  editGalleryUrls,
  setEditGalleryUrls,
  editGalleryColumns,
  setEditGalleryColumns,
  editGalleryGap,
  setEditGalleryGap,
  editGalleryObjectFit,
  setEditGalleryObjectFit,
  editGalleryBorderRadius,
  setEditGalleryBorderRadius,

  editSliderUrls,
  setEditSliderUrls,
  editSliderAutoplay,
  setEditSliderAutoplay,
  editSliderInterval,
  setEditSliderInterval,
  editSliderShowArrows,
  setEditSliderShowArrows,
  editSliderShowDots,
  setEditSliderShowDots,
  editSliderLoop,
  setEditSliderLoop,

  editLinkType,
  setEditLinkType,

  editLinkNewWindow,
  setEditLinkNewWindow,

  editComponentName,
  setEditComponentName,

  editHeadingLevel,
  setEditHeadingLevel,

  editDividerThickness,
  setEditDividerThickness,

  editDividerColor,
  setEditDividerColor,

  editDividerLineStyle,
  setEditDividerLineStyle,

  editSpacerHeight,
  setEditSpacerHeight,

  editContainerGap,
  setEditContainerGap,
  editContainerJustifyContent,
  setEditContainerJustifyContent,
  editContainerAlignItems,
  setEditContainerAlignItems,
  editContainerMaxWidth,
  setEditContainerMaxWidth,

  editVideoControls,
  setEditVideoControls,
  editVideoAutoplay,
  setEditVideoAutoplay,
  editVideoMuted,
  setEditVideoMuted,
  editVideoLoop,
  setEditVideoLoop,

  editCodeLanguage,
  setEditCodeLanguage,

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

        case "codeEditor":
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

        case "video":
          return {
            ...component,
            props: {
              ...component.props,
              src: value,
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

  const handleDividerThicknessChange = (thickness: number) => {
    setEditDividerThickness(thickness);

    onImmediateChange((component) => {
      if (component.type !== "divider") {
        return component;
      }

      return {
        ...component,
        props: {
          ...component.props,
          thickness,
        },
      };
    });
  };

  const handleDividerColorChange = (color: string) => {
    setEditDividerColor(color);
  };

  const handleDividerColorCommit = () => {
    if (!/^#[0-9a-fA-F]{6}$/.test(editDividerColor)) {
      return;
    }
    onImmediateChange((component) => {
      if (component.type !== "divider") {
        return component;
      }

      if (component.props.color === editDividerColor) {
        return component;
      }

      return {
        ...component,
        props: {
          ...component.props,
          color: editDividerColor,
        },
      };
    });
  };

  const handleDividerLineStyleChange = (
    lineStyle: "solid" | "dashed" | "dotted",
  ) => {
    setEditDividerLineStyle(lineStyle);

    onImmediateChange((component) => {
      if (component.type !== "divider") {
        return component;
      }

      return {
        ...component,
        props: {
          ...component.props,
          lineStyle,
        },
      };
    });
  };

  const handleSpacerHeightChange = (height: number) => {
    setEditSpacerHeight(height);

    onImmediateChange((component) => {
      if (component.type !== "spacer") {
        return component;
      }

      return {
        ...component,
        props: {
          ...component.props,
          height,
        },
      };
    });
  };

  const handleContainerGapChange = (gap: number) => {
    setEditContainerGap(gap);

    onImmediateChange((component) => {
      if (component.type !== "container") {
        return component;
      }

      return {
        ...component,

        props: {
          ...component.props,
          gap,
        },
      };
    });
  };

  const handleContainerJustifyChange = (
    justifyContent: ContainerJustifyContent,
  ) => {
    setEditContainerJustifyContent(justifyContent);
    onImmediateChange((component) => {
      if (component.type !== "container") {
        return component;
      }

      return {
        ...component,

        props: {
          ...component.props,
          justifyContent,
        },
      };
    });
  };

  const handleContainerAlignChange = (alignItems: ContainerAlignItems) => {
    setEditContainerAlignItems(alignItems);
    onImmediateChange((component) => {
      if (component.type !== "container") {
        return component;
      }

      return {
        ...component,

        props: {
          ...component.props,
          alignItems,
        },
      };
    });
  };

  const handleContainerMaxWidthChange = (maxWidth: number | undefined) => {
    setEditContainerMaxWidth(maxWidth);
    onImmediateChange((component) => {
      if (component.type !== "container") {
        return component;
      }

      return {
        ...component,

        props: {
          ...component.props,
          maxWidth,
        },
      };
    });
  };

  const handleVideoControlsChange = (controls: boolean) => {
    setEditVideoControls(controls);

    onImmediateChange((component) => {
      if (component.type !== "video") {
        return component;
      }

      return {
        ...component,
        props: {
          ...component.props,
          controls,
        },
      };
    });
  };

  const handleVideoAutoplayChange = (autoplay: boolean) => {
    setEditVideoAutoplay(autoplay);

    if (autoplay) {
      setEditVideoMuted(true);
    }

    onImmediateChange((component) => {
      if (component.type !== "video") {
        return component;
      }

      return {
        ...component,
        props: {
          ...component.props,
          autoplay,
          muted: autoplay ? true : component.props.muted,
        },
      };
    });
  };

  const handleVideoMutedChange = (muted: boolean) => {
    setEditVideoMuted(muted);

    onImmediateChange((component) => {
      if (component.type !== "video") {
        return component;
      }

      return {
        ...component,
        props: {
          ...component.props,
          muted,
        },
      };
    });
  };

  const handleVideoLoopChange = (loop: boolean) => {
    setEditVideoLoop(loop);

    onImmediateChange((component) => {
      if (component.type !== "video") {
        return component;
      }

      return {
        ...component,
        props: {
          ...component.props,
          loop,
        },
      };
    });
  };

  const handleCodeLanguageChange = (language: CodeLanguage) => {
    setEditCodeLanguage(language);

    onImmediateChange((component) => {
      if (component.type !== "codeEditor") {
        return component;
      }

      return {
        ...component,
        props: {
          ...component.props,
          language,
        },
      };
    });
  };

  const handleGalleryUrlsChange = (urls: string[]) => {
    setEditGalleryUrls(urls);

    onImmediateChange((component) => {
      if (component.type !== "imageGallery") {
        return component;
      }

      return {
        ...component,
        props: {
          ...component.props,
          urls,
        },
      };
    });
  };

  const handleGalleryPropsChange = (
    values: Partial<{
      columns: number;
      gap: number;
      objectFit: "cover" | "contain" | "fill";
      borderRadius: number;
    }>,
  ) => {
    onImmediateChange((component) => {
      if (component.type !== "imageGallery") {
        return component;
      }

      return {
        ...component,
        props: {
          ...component.props,
          ...values,
        },
      };
    });
  };

  const handleSliderUrlsChange = (urls: string[]) => {
    setEditSliderUrls(urls);

    onImmediateChange((component) => {
      if (component.type !== "imageSlider") {
        return component;
      }

      return {
        ...component,
        props: {
          ...component.props,
          urls,
        },
      };
    });
  };

  const handleSliderPropsChange = (
    values: Partial<{
      autoplay: boolean;
      interval: number;
      showArrows: boolean;
      showDots: boolean;
      loop: boolean;
    }>,
  ) => {
    onImmediateChange((component) => {
      if (component.type !== "imageSlider") {
        return component;
      }

      return {
        ...component,
        props: {
          ...component.props,
          ...values,
        },
      };
    });
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

      {editType === "imageGallery" && (
        <EditImageGalleryFields
          componentName={editComponentName}
          urls={editGalleryUrls}
          columns={editGalleryColumns}
          gap={editGalleryGap}
          objectFit={editGalleryObjectFit}
          borderRadius={editGalleryBorderRadius}
          onComponentNameChange={handleComponentNameChange}
          onUrlsChange={handleGalleryUrlsChange}
          onColumnsChange={(value) => {
            setEditGalleryColumns(value);
            handleGalleryPropsChange({
              columns: value,
            });
          }}
          onGapChange={(value) => {
            setEditGalleryGap(value);
            handleGalleryPropsChange({
              gap: value,
            });
          }}
          onObjectFitChange={(value) => {
            setEditGalleryObjectFit(value);
            handleGalleryPropsChange({
              objectFit: value,
            });
          }}
          onBorderRadiusChange={(value) => {
            setEditGalleryBorderRadius(value);
            handleGalleryPropsChange({
              borderRadius: value,
            });
          }}
        />
      )}

      {editType === "imageSlider" && (
        <EditImageSliderFields
          componentName={editComponentName}
          urls={editSliderUrls}
          autoplay={editSliderAutoplay}
          interval={editSliderInterval}
          showArrows={editSliderShowArrows}
          showDots={editSliderShowDots}
          loop={editSliderLoop}
          onComponentNameChange={handleComponentNameChange}
          onUrlsChange={handleSliderUrlsChange}
          onAutoplayChange={(value) => {
            setEditSliderAutoplay(value);
            handleSliderPropsChange({
              autoplay: value,
            });
          }}
          onIntervalChange={(value) => {
            setEditSliderInterval(value);
            handleSliderPropsChange({
              interval: value,
            });
          }}
          onShowArrowsChange={(value) => {
            setEditSliderShowArrows(value);
            handleSliderPropsChange({
              showArrows: value,
            });
          }}
          onShowDotsChange={(value) => {
            setEditSliderShowDots(value);
            handleSliderPropsChange({
              showDots: value,
            });
          }}
          onLoopChange={(value) => {
            setEditSliderLoop(value);
            handleSliderPropsChange({
              loop: value,
            });
          }}
        />
      )}

      {editType === "video" && (
        <div className="mb-3">
          <EditVideoFields
            componentName={editComponentName}
            src={editValue}
            controls={editVideoControls}
            autoplay={editVideoAutoplay}
            muted={editVideoMuted}
            loop={editVideoLoop}
            onComponentNameChange={handleComponentNameChange}
            onSrcChange={handleValueChange}
            onControlsChange={handleVideoControlsChange}
            onAutoplayChange={handleVideoAutoplayChange}
            onMutedChange={handleVideoMutedChange}
            onLoopChange={handleVideoLoopChange}
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

      {/* Divider */}
      {editType === "divider" && (
        <div className="mb-3">
          <EditDividerFields
            componentName={editComponentName}
            thickness={editDividerThickness}
            color={editDividerColor}
            lineStyle={editDividerLineStyle}
            onComponentNameChange={handleComponentNameChange}
            onThicknessChange={handleDividerThicknessChange}
            onColorChange={handleDividerColorChange}
            onColorCommit={handleDividerColorCommit}
            onLineStyleChange={handleDividerLineStyleChange}
          />
        </div>
      )}

      {/* Spacer */}
      {editType === "spacer" && (
        <div className="mb-3">
          <EditSpacerFields
            componentName={editComponentName}
            height={editSpacerHeight}
            onComponentNameChange={handleComponentNameChange}
            onHeightChange={handleSpacerHeightChange}
          />
        </div>
      )}

      {editType === "codeEditor" && (
        <div className="mb-3">
          <EditCodeEditorFields
            componentName={editComponentName}
            value={editValue}
            language={editCodeLanguage}
            onComponentNameChange={handleComponentNameChange}
            onValueChange={handleValueChange}
            onLanguageChange={handleCodeLanguageChange}
          />
        </div>
      )}

      {/* Container */}
      {editType === "container" && (
        <div className="mb-3">
          <EditContainerFields
            componentName={editComponentName}
            direction={editDirection}
            gap={editContainerGap}
            justifyContent={editContainerJustifyContent}
            alignItems={editContainerAlignItems}
            maxWidth={editContainerMaxWidth}
            onComponentNameChange={handleComponentNameChange}
            onDirectionChange={handleDirectionChange}
            onGapChange={handleContainerGapChange}
            onJustifyContentChange={handleContainerJustifyChange}
            onAlignItemsChange={handleContainerAlignChange}
            onMaxWidthChange={handleContainerMaxWidthChange}
          />
        </div>
      )}

      {/* Disabled */}
      {editType !== "container" &&
        editType !== "heading" &&
        editType !== "divider" &&
        editType !== "spacer" && (
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
