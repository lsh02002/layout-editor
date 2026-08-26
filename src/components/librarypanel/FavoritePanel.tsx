import type { FavoriteComponent } from "../../types/types";

type Props = {
  favorites: FavoriteComponent[];
  hasSelectedComponent: boolean;
  onAddSelected: () => void;
  onInsert: (favorite: FavoriteComponent) => void;
  onRemove: (favoriteId: string) => void;
};

function FavoritePanel({
  favorites,
  hasSelectedComponent,
  onAddSelected,
  onInsert,
  onRemove,
}: Props) {
  return (
    <div className="editor-favorite-section">
      <div
        className="d-flex align-items-center justify-content-between px-3 py-2"
        style={{
          borderTop: "1px solid #e2e8f0",
          borderBottom: "1px solid #e2e8f0",
          background: "#f8fafc",
        }}
      >
        {hasSelectedComponent && (
          <div className="w-100 d-flex justify-content-end gap-2">
            <button
              type="button"
              className="btn btn-outline-warning btn-sm"
              onClick={onAddSelected}
            >
              + 추가
            </button>
          </div>
        )}
      </div>

      <div style={{ padding: 8 }}>
        {favorites.length === 0 ? (
          <div
            className="text-secondary text-center"
            style={{
              padding: "24px 12px",
              fontSize: 13,
            }}
          >
            등록된 즐겨찾기가 없습니다.
          </div>
        ) : (
          favorites.map((favorite) => (
            <div key={favorite.id} className="border rounded p-2 mb-2">
              <div className="d-flex justify-content-between align-items-center gap-2">
                <div
                  style={{
                    minWidth: 0,
                    flex: 1,
                  }}
                >
                  <strong
                    style={{
                      display: "block",
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                      textOverflow: "ellipsis",
                      fontSize: 13,
                    }}
                  >
                    {favorite.name}
                  </strong>

                  <small className="text-secondary">
                    {favorite.component.type}
                  </small>
                </div>

                <div className="d-flex gap-1">
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => onInsert(favorite)}
                  >
                    추가
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm"
                    onClick={() => onRemove(favorite.id)}
                  >
                    삭제
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default FavoritePanel;
