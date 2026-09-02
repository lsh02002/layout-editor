import { memo, type JSX } from "react";
import type { LayoutComponent } from "../../types/types";
import ImageSlider from "../editor/utils/ImageSlider";
import CodeEditor from "../editor/utils/codeEditor";
import { getLinkHref } from "../editor/utils/linkUtils";
import { FAKE_IMAGE_URL } from "../../data/data";

type Props = {
  component: Exclude<LayoutComponent, { type: "container" }>;
};

function CanvasComponentContent({ component }: Props) {
  switch (component.type) {
    case "button":
      return (
        <button
          type="button"
          className="btn btn-primary w-100 mt-4"
          disabled={component.props.disabled ?? false}
          style={component.contentStyle}
        >
          {component.props.title}
        </button>
      );

    case "scrollToTopButton":
      return (
        <button
          type="button"
          className="btn btn-secondary rounded-circle"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          style={component.contentStyle}
          disabled={component.props.disabled ?? false}
        >
          {component.props.title}
        </button>
      );

    case "heading": {
      const Tag = `h${component.props.level}` as keyof JSX.IntrinsicElements;

      const defaultFontSize =
        {
          1: "2.5rem",
          2: "2rem",
          3: "1.75rem",
          4: "1.5rem",
          5: "1.25rem",
          6: "1rem",
        }[component.props.level] ?? "1rem";

      return (
        <Tag
          style={{
            margin: 0,
            padding: 0,

            fontFamily: "inherit",
            fontSize: defaultFontSize,
            fontWeight: 700,
            lineHeight: 1.2,
            wordBreak: "break-word",
            ...component.contentStyle,
          }}
        >
          {component.props.text}
        </Tag>
      );
    }

    case "textarea":
      return (
        <textarea
          value={component.props.value ?? ""}
          placeholder={component.props.placeholder ?? "내용을 입력하세요."}
          disabled={component.props.disabled ?? false}
          readOnly
          tabIndex={-1}
          ref={(element) => {
            if (!element) return;

            element.style.height = "auto";
            element.style.height = `${element.scrollHeight}px`;
          }}
          style={{
            display: "block",
            boxSizing: "border-box",

            width: "100%",
            maxWidth: "100%",

            // 스크롤 제거
            overflow: "hidden",

            // 사용자 resize 제거
            resize: "none",

            fontFamily: "inherit",
            fontSize: "inherit",
            fontWeight: "inherit",
            fontStyle: "inherit",
            lineHeight: "inherit",
            letterSpacing: "inherit",
            color: "inherit",
            border: "none",
            wordBreak: "break-word",

            ...component.contentStyle,

            pointerEvents: "none",
          }}
        />
      );
    case "quill":
      return (
        <div
          style={{
            ...component.contentStyle,
            pointerEvents: "none",
            wordBreak: "break-word",
          }}
          dangerouslySetInnerHTML={{
            __html:
              component.props.value ||
              `<span style="color:#6c757d">${component.props.placeholder || "본문을 입력하세요."}</span>`,
          }}
        />
      );

    case "image": {
      const imageUrl = component.props.urls?.[0];
      return (
        <div
          style={{
            ...component.contentStyle,
            width: "100%",
            height: "100%",
            minWidth: 0,
            minHeight: 0,
            overflow: "hidden",
          }}
        >
          {imageUrl ? (
            <img
              src={imageUrl || FAKE_IMAGE_URL}
              alt=""
              draggable={false}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "fill",
                display: "block",
              }}
            />
          ) : (
            <div className="text-secondary">이미지 없음</div>
          )}
        </div>
      );
    }

    case "video": {
      const src = component.props.src;

      if (!src) {
        return (
          <div
            className="text-secondary border rounded d-flex align-items-center justify-content-center"
            style={{
              ...component.contentStyle,
              width: "100%",
              minHeight: 180,
            }}
          >
            동영상 없음
          </div>
        );
      }

      return (
        <video
          src={src}
          controls={component.props.controls ?? true}
          autoPlay={component.props.autoplay ?? true}
          muted={component.props.muted ?? false}
          loop={component.props.loop ?? false}
          playsInline
          style={{
            ...component.contentStyle,
            display: "block",
            width: "100%",
            height: "auto",
            minHeight: 180,
            objectFit: "contain",
          }}
        />
      );
    }

    case "link": {
      const href = getLinkHref(component);
      const openNewWindow =
        component.props.linkType === "url" && component.props.newWindow;

      return (
        <a
          href={href}
          target={openNewWindow ? "_blank" : undefined}
          rel={openNewWindow ? "noopener noreferrer" : undefined}
          style={{
            ...component.contentStyle,
            display: "inline-block",
            pointerEvents: component.props.disabled ? "none" : "auto",
            opacity: component.props.disabled ? 0.5 : 1,
          }}
        >
          {component.props.title || component.props.value || "링크"}
        </a>
      );
    }

    case "divider":
      return (
        <hr
          style={{
            width: "100%",
            margin: 0,
            border: 0,
            borderTop: `${component.props.thickness ?? 3}px ${
              component.props.lineStyle ?? "solid"
            } ${component.props.color ?? "#dee2e6"}`,
            ...component.contentStyle,
          }}
        />
      );

    case "spacer":
      return (
        <div
          style={{
            width: "100%",
            height: component.props.height ?? 32,
            minHeight: component.props.height ?? 32,
            ...component.contentStyle,
          }}
        />
      );

    case "codeEditor":
      return (
        <div
          style={{
            ...component.contentStyle,
            width: "100%",
            height: "100%",
            minWidth: 0,
            overflow: "hidden",
            backgroundColor: "#1f2329",
          }}
        >
          <CodeEditor
            data={String(component.props.value ?? "")}
            setData={() => {}}
            language={component.props.language}
            height="100%"
            readOnly
          />
        </div>
      );

    case "imageSlider":
      return <ImageSlider component={component} />;
  }
}

export default memo(CanvasComponentContent);
