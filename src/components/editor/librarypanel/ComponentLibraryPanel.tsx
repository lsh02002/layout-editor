import { useState } from "react";

import type { FavoriteComponent, TemplateItem } from "../../../types/types";

import FavoritePanel from "./FavoritePanel";
import TemplatePreviewListPanel from "./TemplatePreviewListPanel";

type Props = {
  favorites: FavoriteComponent[];
  hasSelectedComponent: boolean;
  onAddSelected: () => void;
  onInsert: (favorite: FavoriteComponent) => void;
  onRemove: (favoriteId: string) => void;

  templateFiles: {
    name: string;
    data: TemplateItem;
  }[];

  setTemplateFiles: (
    files: {
      name: string;
      data: TemplateItem;
    }[],
  ) => void;

  selectedTemplateId: string | null;

  setSelectedTemplateId: (id: string | null) => void;
};

function ComponentLibraryPanel({
  favorites,
  hasSelectedComponent,
  onAddSelected,
  onInsert,
  onRemove,
  templateFiles,
  setTemplateFiles,
  selectedTemplateId,
  setSelectedTemplateId,
}: Props) {
  const [panelTab, setPanelTab] = useState<"favorites" | "templates">(
    "favorites",
  );

  return (
    <>
      <div className="p-2">
        <ul className="nav nav-tabs">
          <li className="nav-item">
            <button
              type="button"
              className={`nav-link ${panelTab === "favorites" ? "active" : ""}`}
              onClick={() => setPanelTab("favorites")}
            >
              즐겨찾기
            </button>
          </li>

          <li className="nav-item">
            <button
              type="button"
              className={`nav-link ${panelTab === "templates" ? "active" : ""}`}
              onClick={() => setPanelTab("templates")}
            >
              템플릿
            </button>
          </li>
        </ul>
      </div>

      {panelTab === "favorites" && (
        <FavoritePanel
          favorites={favorites}
          hasSelectedComponent={hasSelectedComponent}
          onAddSelected={onAddSelected}
          onInsert={onInsert}
          onRemove={onRemove}
        />
      )}

      {panelTab === "templates" && (
        <div style={{ padding: 8 }}>
          <TemplatePreviewListPanel
            templateFiles={templateFiles}
            setTemplateFiles={setTemplateFiles}
            selectedTemplateId={selectedTemplateId}
            setSelectedTemplateId={setSelectedTemplateId}
          />
        </div>
      )}
    </>
  );
}

export default ComponentLibraryPanel;
