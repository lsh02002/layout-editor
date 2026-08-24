import React from "react";
import type { LayoutComponent } from "../../types/types";

type DropTarget = {
  parentId: string | null;
  index: number;
  area: "canvas" | "layer";
} | null;

type LayerPanelProps = {
  visible: boolean;
  components: LayoutComponent[];
  selectedComponentId: string | null;
  draggingId: string | null;
  search: string;
  activeDropTarget: DropTarget;
  onSearchChange: (value: string) => void;
  onClose: () => void;
  onEdit: (componentId: string) => void;
  onAddFavorite: () => void;
  onDragStart: (
    event: React.DragEvent<HTMLElement>,
    componentId: string,
  ) => void;
  onDragEnd: () => void;
  onPointerDragStart: (
    event: React.PointerEvent<HTMLElement>,
    componentId: string,
  ) => void;
  onPointerDragMove: (event: React.PointerEvent<HTMLElement>) => void;
  onPointerDragEnd: (event: React.PointerEvent<HTMLElement>) => void;
  onPointerDragCancel: () => void;
  onDrop: (
    event: React.DragEvent<HTMLElement>,
    parentId: string | null,
    index: number,
  ) => void;
  onActiveDropTargetChange: (target: DropTarget) => void;
};

const highlightSearchText = (text: string, keyword: string) => {
  const search = keyword.trim();

  if (!search) {
    return text;
  }

  const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (part.toLowerCase() !== search.toLowerCase()) {
      return <React.Fragment key={index}>{part}</React.Fragment>;
    }

    return (
      <mark
        key={index}
        style={{
          padding: "0 2px",
          borderRadius: 3,
          background: "#fff3cd",
          color: "inherit",
        }}
      >
        {part}
      </mark>
    );
  });
};

const getComponentDisplayName = (component: LayoutComponent) => {
  if (component.type === "textarea") {
    return component.props.value || component.name || component.type;
  }

  if (component.type === "quill") {
    const plainText = component.props.value
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<\/p>/gi, " ")
      .replace(/<\/div>/gi, " ")
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/gi, " ")
      .replace(/\u00A0/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    return plainText || component.name || component.type;
  }

  if (component.type === "heading") {
    return component.props.text || component.name?.trim() || "Heading";
  }

  if (component.name?.trim()) {
    return component.name.trim();
  }

  if (
    "title" in component.props &&
    typeof component.props.title === "string" &&
    component.props.title.trim()
  ) {
    return `${component.props.title.trim()} (${component.type})`;
  }

  return component.type;
};

export default function LayerPanel({
  visible,
  components,
  selectedComponentId,
  draggingId,
  search,
  activeDropTarget,
  onSearchChange,
  onClose,
  onEdit,
  onAddFavorite,
  onDragStart,
  onDragEnd,
  onPointerDragStart,
  onPointerDragMove,
  onPointerDragEnd,
  onPointerDragCancel,
  onDrop,
  onActiveDropTargetChange,
}: LayerPanelProps) {
  if (!visible) {
    return null;
  }

  const renderDropZone = (
    parentId: string | null,
    index: number,
    depth: number,
  ) => {
    const isActive =
      activeDropTarget?.area === "layer" &&
      activeDropTarget.parentId === parentId &&
      activeDropTarget.index === index;

    return (
      <div
        data-drop-zone="true"
        data-drop-area="layer"
        data-drop-parent={parentId ?? "root"}
        data-drop-index={index}
        onDragEnter={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onActiveDropTargetChange({ parentId, index, area: "layer" });
        }}
        onDragOver={(event) => {
          event.preventDefault();
          event.stopPropagation();
          event.dataTransfer.dropEffect = "move";
          onActiveDropTargetChange({ parentId, index, area: "layer" });
        }}
        onDragLeave={(event) => {
          event.stopPropagation();

          if (event.currentTarget.contains(event.relatedTarget as Node)) {
            return;
          }

          onActiveDropTargetChange(null);
        }}
        onDrop={(event) => onDrop(event, parentId, index)}
        style={{
          marginLeft: depth * 14,
          height: isActive ? 18 : 10,
          marginTop: 2,
          marginBottom: 2,
          borderRadius: 4,
          position: "relative",
          zIndex: 20,
          pointerEvents: "auto",
          background: isActive ? "rgba(13, 110, 253, 0.18)" : "transparent",
          borderTop: isActive ? "2px solid #0d6efd" : "2px solid transparent",
          transition: "height 80ms ease, background 80ms ease",
        }}
      />
    );
  };

  const renderTree = (
    items: LayoutComponent[],
    parentId: string | null = null,
    depth = 0,
  ): React.ReactNode => {
    const sorted = [...items].sort((a, b) => a.order - b.order);

    return (
      <>
        {renderDropZone(parentId, 0, depth)}

        {sorted.map((component, index) => {
          const isContainer = component.type === "container";
          const isSelected = selectedComponentId === component.id;
          const isDragging = draggingId === component.id;

          return (
            <React.Fragment key={component.id}>
              <div
                onClick={() => onEdit(component.id)}
                onDoubleClick={() => onEdit(component.id)}
                style={{
                  marginLeft: depth * 14,
                  padding: "6px 8px",
                  borderRadius: 6,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  cursor: "pointer",
                  userSelect: "none",
                  opacity: isDragging ? 0.4 : 1,
                  background: isSelected
                    ? "rgba(13, 110, 253, 0.12)"
                    : "transparent",
                  border: isSelected
                    ? "1px solid rgba(13, 110, 253, 0.35)"
                    : "1px solid transparent",
                }}
              >
                <button
                  type="button"
                  className="layer-drag-handle"
                  draggable={!search}
                  onDragStart={(event) => {
                    event.stopPropagation();

                    if (search) {
                      event.preventDefault();
                      return;
                    }

                    onDragStart(event, component.id);
                  }}
                  onDragEnd={onDragEnd}
                  onPointerDown={(event) => {
                    event.stopPropagation();
                    onPointerDragStart(event, component.id);
                  }}
                  onPointerMove={onPointerDragMove}
                  onPointerUp={onPointerDragEnd}
                  onPointerCancel={onPointerDragCancel}
                  onContextMenu={(event) => event.preventDefault()}
                  onClick={(event) => event.stopPropagation()}
                  style={{
                    cursor: isDragging ? "grabbing" : "grab",
                    touchAction: "none",
                    userSelect: "none",
                    WebkitUserSelect: "none",
                    width: 36,
                    height: 36,
                    minWidth: 36,
                    padding: 0,
                    border: 0,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "transparent",
                    flexShrink: 0,
                    fontWeight: 700,
                  }}
                  title="드래그하여 이동"
                >
                  ⋮⋮
                </button>

                <span style={{ width: 14, textAlign: "center", flexShrink: 0 }}>
                  {isContainer ? "▾" : "•"}
                </span>

                <span
                  style={{
                    flex: 1,
                    minWidth: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    fontSize: 13,
                    fontWeight: isContainer ? 600 : 400,
                  }}
                >
                  {highlightSearchText(
                    getComponentDisplayName(component) ?? "",
                    search,
                  )}
                </span>

                <small
                  className="text-secondary"
                  style={{ fontSize: 9, flexShrink: 0 }}
                >
                  {highlightSearchText(component.type, search)}
                </small>
              </div>

              {isContainer && (
                <div>
                  {renderTree(component.children, component.id, depth + 1)}
                </div>
              )}

              {renderDropZone(parentId, index + 1, depth)}
            </React.Fragment>
          );
        })}
      </>
    );
  };

  return (
    <aside
      onDragOver={(event) => {
        if (draggingId) {
          event.preventDefault();
        }
      }}
      onDrop={(event) => event.preventDefault()}
      className="editor-side-panel left"
      style={{ display: "flex", flexDirection: "column" }}
    >
      <div className="d-flex align-items-center justify-content-between border-bottom px-3 py-2">
        <strong>레이어</strong>
        <button type="button" className="btn btn-sm border-0" onClick={onClose}>
          ×
        </button>
      </div>

      <div className="p-2 border-bottom">
        <div className="input-group input-group-sm">
          <span className="input-group-text">🔍</span>
          <input
            type="text"
            className="form-control"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="이름 또는 타입 검색"
          />
          {search && (
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => onSearchChange("")}
              aria-label="검색 초기화"
            >
              ×
            </button>
          )}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 8 }}>
        {components.length > 0 ? (
          renderTree(components)
        ) : (
          <div
            className="text-secondary text-center"
            style={{ padding: 20, fontSize: 13 }}
          >
            {search
              ? `"${search}" 검색 결과가 없습니다.`
              : "컴포넌트가 없습니다."}
          </div>
        )}
      </div>

      {selectedComponentId && (
        <div className="p-2">
          <button
            type="button"
            className="btn btn-outline-warning btn-sm w-100"
            onClick={onAddFavorite}
          >
            ⭐ 즐겨찾기 등록
          </button>
        </div>
      )}
    </aside>
  );
}
