import EditComponentNameField from "./EditComponentNameField";

type Props = {
  componentName: string;
  urls: string[];
  columns: number;
  gap: number;
  objectFit: "cover" | "contain" | "fill";
  borderRadius: number;

  onComponentNameChange: (value: string) => void;
  onUrlsChange: (urls: string[]) => void;
  onColumnsChange: (value: number) => void;
  onGapChange: (value: number) => void;
  onObjectFitChange: (value: "cover" | "contain" | "fill") => void;
  onBorderRadiusChange: (value: number) => void;
};

function EditImageGalleryFields({
  componentName,
  urls,
  columns,
  gap,
  objectFit,
  borderRadius,
  onComponentNameChange,
  onUrlsChange,
  onColumnsChange,
  onGapChange,
  onObjectFitChange,
  onBorderRadiusChange,
}: Props) {
  const updateUrl = (index: number, value: string) => {
    onUrlsChange(urls.map((url, i) => (i === index ? value : url)));
  };

  const removeUrl = (index: number) => {
    onUrlsChange(urls.filter((_, i) => i !== index));
  };

  const addUrl = () => {
    onUrlsChange([...urls, ""]);
  };

  const moveUrl = (from: number, to: number) => {
    if (to < 0 || to >= urls.length) return;

    const next = [...urls];
    const [removed] = next.splice(from, 1);
    next.splice(to, 0, removed);

    onUrlsChange(next);
  };

  return (
    <>
      <EditComponentNameField
        value={componentName}
        onChange={onComponentNameChange}
      />

      <div className="mb-3">
        <label className="form-label">갤러리 이미지</label>

        <div className="d-flex flex-column gap-2">
          {urls.map((url, index) => (
            <div key={index} className="border rounded p-2">
              <div className="d-flex gap-1 mb-2">
                <small className="text-secondary me-auto">
                  이미지 {index + 1}
                </small>

                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  disabled={index === 0}
                  onClick={() => moveUrl(index, index - 1)}
                >
                  ↑
                </button>

                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  disabled={index === urls.length - 1}
                  onClick={() => moveUrl(index, index + 1)}
                >
                  ↓
                </button>

                <button
                  type="button"
                  className="btn btn-outline-danger btn-sm"
                  onClick={() => removeUrl(index)}
                >
                  삭제
                </button>
              </div>

              <input
                type="text"
                className="form-control"
                value={url}
                placeholder="이미지 URL"
                onChange={(e) => updateUrl(index, e.target.value)}
              />

              {url.trim() && (
                <img
                  src={url}
                  alt=""
                  className="mt-2 rounded"
                  style={{
                    display: "block",
                    width: "100%",
                    maxHeight: 120,
                    objectFit: "cover",
                  }}
                />
              )}
            </div>
          ))}
        </div>

        <button
          type="button"
          className="btn btn-outline-primary btn-sm mt-2"
          onClick={addUrl}
        >
          + 이미지 추가
        </button>
      </div>

      <div className="mb-3">
        <label className="form-label">열 개수</label>

        <input
          type="number"
          className="form-control"
          min={1}
          max={12}
          value={columns}
          onChange={(e) =>
            onColumnsChange(
              Math.min(12, Math.max(1, Number(e.target.value) || 1)),
            )
          }
        />
      </div>

      <div className="mb-3">
        <label className="form-label">이미지 간격</label>

        <div className="input-group">
          <input
            type="number"
            className="form-control"
            min={0}
            value={gap}
            onChange={(e) =>
              onGapChange(Math.max(0, Number(e.target.value) || 0))
            }
          />

          <span className="input-group-text">px</span>
        </div>
      </div>

      <div className="mb-3">
        <label className="form-label">이미지 맞춤</label>

        <select
          className="form-select"
          value={objectFit}
          onChange={(e) =>
            onObjectFitChange(e.target.value as "cover" | "contain" | "fill")
          }
        >
          <option value="cover">Cover</option>
          <option value="contain">Contain</option>
          <option value="fill">Fill</option>
        </select>
      </div>

      <div className="mb-3">
        <label className="form-label">모서리 둥글기</label>

        <div className="input-group">
          <input
            type="number"
            className="form-control"
            min={0}
            value={borderRadius}
            onChange={(e) =>
              onBorderRadiusChange(Math.max(0, Number(e.target.value) || 0))
            }
          />

          <span className="input-group-text">px</span>
        </div>
      </div>
    </>
  );
}

export default EditImageGalleryFields;
