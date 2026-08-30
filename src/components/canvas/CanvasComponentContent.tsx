import { memo, type CSSProperties, type JSX } from "react";
import type { LayoutComponent } from "../../types/types";
import { getLinkHref } from "../editor/utils/linkUtils";

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
      const style: CSSProperties = {
        margin: 0,        
        ...component.contentStyle,
        width: "100%",
      };
      const Tag = `h${component.props.level}` as keyof JSX.IntrinsicElements;
      return <Tag style={style}>{component.props.text}</Tag>;
    }

    case "textarea":
      return (
        <div
          style={{
            ...component.contentStyle,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {component.props.value ||
            component.props.placeholder ||
            "내용을 입력하세요."}
        </div>
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
        <div style={{ ...component.contentStyle, width: "100%" }}>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt=""
              draggable={false}
              style={{ width: "100%", height: "auto", display: "block" }}
            />
          ) : (
            <div className="text-secondary">이미지 없음</div>
          )}
        </div>
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
  }
}

export default memo(CanvasComponentContent);
