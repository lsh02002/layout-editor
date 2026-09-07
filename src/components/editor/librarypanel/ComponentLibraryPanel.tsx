import { useState, memo } from "react";

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

  const tabMenu = [
    { value: "favorites", label: "즐겨찾기" },
    { value: "templates", label: "템플릿" },    
  ];

  return (
    <>
      <div className="p-2">
        <ul className="nav nav-tabs">
          {tabMenu.map((tab) => (
            <li key={tab.value} className="nav-item">
              <button
                type="button"
                className={`nav-link ${panelTab === tab.value ? "active" : ""}`}
                onClick={() =>
                  setPanelTab(tab.value as "favorites" | "templates")
                }
              >
                {tab.label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {panelTab === "favorites" && (
        <div style={{ padding: 8, minHeight: 260 }}>
          <FavoritePanel
            favorites={favorites}
            hasSelectedComponent={hasSelectedComponent}
            onAddSelected={onAddSelected}
            onInsert={onInsert}
            onRemove={onRemove}
          />
        </div>
      )}

      {panelTab === "templates" && (
        <div style={{ padding: 8, minHeight: 260 }}>
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

export default memo(ComponentLibraryPanel);
