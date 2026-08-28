import React from "react";
import type { CanvasViewport } from "../../types/types";

type ProjectToolbarProps = {
  previewMode: boolean;

  isMobile: boolean;
  canvasViewport: CanvasViewport;
  onCanvasViewportChange: (viewport: CanvasViewport) => void;

  snapEnabled: boolean;
  gridSize: number;
  canUndo: boolean;
  canRedo: boolean;
  hasUnsavedChanges: boolean;
  hasSelectedComponent: boolean;
  lastAutoSavedAt: string | null;
  setSelectedComponentId: React.Dispatch<React.SetStateAction<string | null>>;
  setPreviewMode: React.Dispatch<React.SetStateAction<boolean>>;
  onSnapEnabledChange: (value: boolean) => void;
  onGridSizeChange: (value: number) => void;
  onOpenProjectCss: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onSaveProject: () => void;
  onLoadProject: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDownloadHtml: () => void | Promise<void>;
  onOpenProjectTemplate: () => void;
  onOpenSelectedTemplate: () => void;
  onLoadTemplate: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

export default function ProjectToolbar({
  previewMode,
  isMobile,
  canvasViewport,
  onCanvasViewportChange,
  snapEnabled,
  gridSize,
  canUndo,
  canRedo,
  hasUnsavedChanges,
  hasSelectedComponent,
  lastAutoSavedAt,
  setSelectedComponentId,
  setPreviewMode,
  onSnapEnabledChange,
  onGridSizeChange,
  onOpenProjectCss,
  onUndo,
  onRedo,
  onSaveProject,
  onLoadProject,
  onDownloadHtml,
  onOpenProjectTemplate,
  onOpenSelectedTemplate,
  onLoadTemplate,
}: ProjectToolbarProps) {
  return (
    <div
      className="d-flex flex-wrap align-items-center gap-2 mb-3 p-2 border rounded bg-light"
      style={{ position: "sticky", top: 0, zIndex: 1000 }}
    >
      <div className="d-flex align-items-center gap-2 pe-2 border-end">
        <button
          type="button"
          className={
            previewMode
              ? "btn btn-primary btn-sm"
              : "btn btn-outline-primary btn-sm"
          }
          onClick={() => {
            setPreviewMode((prev) => {
              const next = !prev;

              if (next) {
                setSelectedComponentId(null);
              }

              return next;
            });
          }}
        >
          <i className={previewMode ? "bi bi-pencil-square" : "bi bi-eye"} />{" "}
          {previewMode ? "편집 모드" : "미리보기"}
        </button>
        <div className="form-check mb-0">
          <input
            id="snap-enabled"
            type="checkbox"
            className="form-check-input"
            checked={snapEnabled}
            onChange={(event) => onSnapEnabledChange(event.target.checked)}
          />
          <label htmlFor="snap-enabled" className="form-check-label">
            스냅
          </label>
        </div>

        <select
          className="form-select form-select-sm"
          style={{ width: 82 }}
          value={gridSize}
          disabled={!snapEnabled}
          onChange={(event) => onGridSizeChange(Number(event.target.value))}
        >
          <option value={5}>5px</option>
          <option value={10}>10px</option>
          <option value={20}>20px</option>
          <option value={25}>25px</option>
          <option value={50}>50px</option>
        </select>
      </div>

      <div className="d-flex align-items-center gap-1 pe-2 border-end">
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm"
          onClick={onOpenProjectCss}
          title="프로젝트 Custom CSS"
        >
          CSS
        </button>
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm"
          disabled={!canUndo}
          onClick={onUndo}
          title="Ctrl + Z"
        >
          ↶ Undo
        </button>
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm"
          disabled={!canRedo}
          onClick={onRedo}
          title="Ctrl + Y"
        >
          ↷ Redo
        </button>
      </div>

      <div className="d-flex align-items-center gap-1 pe-2 border-end">
        <div style={{ position: "relative" }}>
          <button
            type="button"
            className="btn btn-success btn-sm"
            onClick={onSaveProject}
            title="Ctrl + S"
          >
            💾 프로젝트 저장
          </button>
          {hasUnsavedChanges && (
            <span
              title="저장되지 않은 변경사항 있음"
              style={{
                position: "absolute",
                top: -4,
                right: -4,
                width: 9,
                height: 9,
                backgroundColor: "#dc3545",
                borderRadius: "50%",
                border: "2px solid white",
                pointerEvents: "none",
              }}
            />
          )}
        </div>

        <label
          className="btn btn-outline-success btn-sm mb-0"
          style={{ cursor: "pointer" }}
        >
          📂 불러오기
          <input
            type="file"
            accept=".json,application/json"
            onChange={onLoadProject}
            style={{ display: "none" }}
          />
        </label>

        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => void onDownloadHtml()}
        >
          HTML 다운로드
        </button>
      </div>

      <div className="d-flex align-items-center gap-1 pe-2 border-end">
        <button
          type="button"
          className="btn btn-outline-primary btn-sm"
          onClick={onOpenProjectTemplate}
        >
          전체 템플릿
        </button>
        <button
          type="button"
          className="btn btn-outline-primary btn-sm"
          disabled={!hasSelectedComponent}
          onClick={onOpenSelectedTemplate}
        >
          선택 템플릿
        </button>
        <label
          className="btn btn-outline-primary btn-sm mb-0"
          style={{ cursor: "pointer" }}
        >
          템플릿 불러오기
          <input
            type="file"
            accept=".pbtpl,.json,application/json"
            onChange={onLoadTemplate}
            style={{ display: "none" }}
          />
        </label>
      </div>

      {!isMobile && (
        <div className="d-flex align-items-center gap-1 pe-2 border-end">
          <button
            type="button"
            className={
              canvasViewport === "desktop"
                ? "btn btn-secondary btn-sm"
                : "btn btn-outline-secondary btn-sm"
            }
            onClick={() => onCanvasViewportChange("desktop")}
            title="Desktop - 1100px"
          >
            <i className="bi bi-display" />
          </button>

          <button
            type="button"
            className={
              canvasViewport === "tablet"
                ? "btn btn-secondary btn-sm"
                : "btn btn-outline-secondary btn-sm"
            }
            onClick={() => onCanvasViewportChange("tablet")}
            title="Tablet - 768px"
          >
            <i className="bi bi-tablet" />
          </button>

          <button
            type="button"
            className={
              canvasViewport === "mobile"
                ? "btn btn-secondary btn-sm"
                : "btn btn-outline-secondary btn-sm"
            }
            onClick={() => onCanvasViewportChange("mobile")}
            title="Mobile - 390px"
          >
            <i className="bi bi-phone" />
          </button>
        </div>
      )}
      <div
        className="ms-auto d-flex align-items-center"
        style={{ minHeight: 31 }}
      >
        {lastAutoSavedAt ? (
          <small
            className="text-secondary"
            title={new Date(lastAutoSavedAt).toLocaleString()}
          >
            자동 저장{" "}
            {new Date(lastAutoSavedAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </small>
        ) : (
          <small className="text-secondary">자동 저장 대기</small>
        )}
      </div>
    </div>
  );
}
