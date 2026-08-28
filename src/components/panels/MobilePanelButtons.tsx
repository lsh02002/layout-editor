import { memo } from "react";

type Props = {
  favoriteCount: number;
  onToggleLayers: () => void;
  onToggleFavorites: () => void;
};
function MobilePanelButtons({
  favoriteCount,
  onToggleLayers,
  onToggleFavorites,
}: Props) {
  return (
    <div className="editor-mobile-panel-buttons">
      <button
        type="button"
        className="btn btn-dark btn-sm"
        onClick={onToggleLayers}
        style={{ flex: 1 }}
      >
        레이어
      </button>
      <button
        type="button"
        className="btn btn-warning btn-sm"
        onClick={onToggleFavorites}
        style={{ flex: 1 }}
      >
        ⭐ 즐겨찾기{favoriteCount > 0 && <> ({favoriteCount})</>}
      </button>
    </div>
  );
}

export default memo(MobilePanelButtons);
