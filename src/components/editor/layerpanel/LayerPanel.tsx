import React, { memo, useMemo, useRef } from "react";
import type { LayoutComponent } from "../../../types/types";
import { getComponentDisplayName } from "../utils/componentDisplayName";
import { useEditorConfig } from "../../../context/usehooks";

type DropTarget = {
  parentId: string | null;
  index: number;
  area: "canvas" | "layer";
} | null;

type LayerPanelProps = {
  previewMode: boolean;
  visible: boolean;
  components: LayoutComponent[];
  selectedComponentIds: string[];
  draggingIds: string[];
  search: string;
  activeDropTarget: DropTarget;
  setSelectedComponentIds: React.Dispatch<React.SetStateAction<string[]>>;
  onSearchChange: (value: string) => void;
  onSelect: (
    id: string,
    openEditPanel?: boolean,
    multiSelect?: boolean,
  ) => void;
  onEdit: (id: string) => void;
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

const flattenComponents = (items: LayoutComponent[]): LayoutComponent[] => {
  return items.flatMap((component) => {
    const children = "children" in component ? (component.children ?? []) : [];

    return [component, ...flattenComponents(children)];
  });
};

function LayerPanel({
  previewMode,
  visible,
  components,
  selectedComponentIds,
  draggingIds,
  search,
  activeDropTarget,
  setSelectedComponentIds,
  onSearchChange,
  onSelect,
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
  const { components: componentRegistry } = useEditorConfig();
  const primarySelectedId = selectedComponentIds.at(-1) ?? null;

  const flatComponents = useMemo(
    () => flattenComponents(components),
    [components],
  );

  const flatComponentIds = useMemo(
    () => flatComponents.map((component) => component.id),
    [flatComponents],
  );

  const lastSelectedIdRef = useRef<string | null>(null);

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
          const isTemplate = event.dataTransfer.types.includes(
            "application/x-pagebuilder-template",
          );
          event.dataTransfer.dropEffect = isTemplate ? "copy" : "move";
          onActiveDropTargetChange({
            parentId,
            index,
            area: "layer",
          });
        }}
        onDragLeave={(event) => {
          event.stopPropagation();

          if (event.currentTarget.contains(event.relatedTarget as Node)) {
            return;
          }

          onActiveDropTargetChange(null);
        }}
        onDrop={(event) => {
          event.preventDefault();
          event.stopPropagation();

          onDrop(event, parentId, index);
          onActiveDropTargetChange(null);
        }}
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
          const isSelected = selectedComponentIds.includes(component.id);
          const isDragging = draggingIds.includes(component.id);
          return (
            <React.Fragment key={component.id}>
              <div
                onClick={(event) => {
                  if (previewMode) {
                    return;
                  }

                  event.preventDefault();
                  event.stopPropagation();

                  const currentId = component.id;
                  // Shift + 클릭 → 범위 선택
                  if (event.shiftKey) {
                    const anchorId =
                      lastSelectedIdRef.current ?? primarySelectedId;
                    if (anchorId) {
                      const startIndex = flatComponentIds.indexOf(anchorId);
                      const endIndex = flatComponentIds.indexOf(currentId);
                      if (startIndex !== -1 && endIndex !== -1) {
                        const from = Math.min(startIndex, endIndex);
                        const to = Math.max(startIndex, endIndex);
                        const rangeIds = flatComponentIds.slice(from, to + 1);

                        // 현재 클릭한 항목을 항상 마지막에 둠
                        const orderedRangeIds = [
                          ...rangeIds.filter((id) => id !== currentId),
                          currentId,
                        ];

                        if (event.ctrlKey || event.metaKey) {
                          setSelectedComponentIds((prev) => {
                            const existing = prev.filter(
                              (id) => !orderedRangeIds.includes(id),
                            );
                            return [...existing, ...orderedRangeIds];
                          });
                        } else {
                          setSelectedComponentIds(orderedRangeIds);
                        }

                        return;
                      }
                    }
                  }
                  // Ctrl / Cmd + 클릭
                  const multiSelect = event.ctrlKey || event.metaKey;
                  onSelect(currentId, false, multiSelect);
                  // Shift 범위 선택의 anchor
                  lastSelectedIdRef.current = currentId;
                }}
                onDoubleClick={(event) => {
                  if (previewMode) {
                    return;
                  }

                  event.preventDefault();
                  event.stopPropagation();

                  onEdit(component.id);
                }}
                style={{
                  marginLeft: depth * 14,
                  padding: "6px 8px",
                  borderRadius: 6,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  cursor: previewMode ? "default" : "pointer",
                  userSelect: "none",
                  opacity: isDragging ? 0.4 : 1,
                  background:
                    !previewMode && isSelected
                      ? "rgba(13, 110, 253, 0.12)"
                      : "transparent",
                  border:
                    !previewMode && isSelected
                      ? "1px solid rgba(13, 110, 253, 0.35)"
                      : "1px solid transparent",
                }}
              >
                <button
                  type="button"
                  className="layer-drag-handle"
                  draggable={!previewMode && !search}
                  onDragStart={(event) => {
                    event.stopPropagation();

                    if (search || previewMode) {
                      event.preventDefault();
                      return;
                    }

                    onDragStart(event, component.id);
                  }}
                  onDragEnd={onDragEnd}
                  onPointerDown={(event) => {
                    event.stopPropagation();

                    if (search) {
                      event.preventDefault();
                      return;
                    }

                    if (previewMode) {
                      event.preventDefault();
                      return;
                    }

                    onPointerDragStart(event, component.id);
                  }}
                  onPointerMove={(event) => {
                    event.stopPropagation();

                    if (search) {
                      event.preventDefault();
                      return;
                    }

                    if (previewMode) {
                      event.preventDefault();
                      return;
                    }

                    onPointerDragMove(event);
                  }}
                  onPointerUp={(event) => {
                    event.stopPropagation();

                    if (search) {
                      event.preventDefault();
                      return;
                    }

                    if (previewMode) {
                      event.preventDefault();
                      return;
                    }

                    onPointerDragEnd(event);
                  }}
                  onPointerCancel={(event) => {
                    event.stopPropagation();

                    if (search) {
                      event.preventDefault();
                      return;
                    }

                    if (previewMode) {
                      event.preventDefault();
                      return;
                    }

                    onPointerDragCancel();
                  }}
                  onContextMenu={(event) => event.preventDefault()}
                  onClick={(event) => event.stopPropagation()}
                  style={{
                    cursor: previewMode ? "default" : "grab",
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
                    getComponentDisplayName(componentRegistry, component) ?? "",
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
        if (draggingIds.length > 0) {
          event.preventDefault();
        }
      }}
      onDrop={(event) => event.preventDefault()}
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        minHeight: 0,
      }}
    >
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

      {primarySelectedId && selectedComponentIds?.length === 1 && (
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

export default memo(LayerPanel);
