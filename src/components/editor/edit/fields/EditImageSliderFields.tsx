import EditComponentNameField from "./EditComponentNameField";

type Props = {
  componentName: string;
  urls: string[];

  autoplay: boolean;
  interval: number;
  showArrows: boolean;
  showDots: boolean;
  loop: boolean;

  onComponentNameChange: (value: string) => void;
  onUrlsChange: (urls: string[]) => void;
  onAutoplayChange: (value: boolean) => void;
  onIntervalChange: (value: number) => void;
  onShowArrowsChange: (value: boolean) => void;
  onShowDotsChange: (value: boolean) => void;
  onLoopChange: (value: boolean) => void;
};

function EditImageSliderFields({
  componentName,
  urls,

  autoplay,
  interval,
  showArrows,
  showDots,
  loop,

  onComponentNameChange,
  onUrlsChange,
  onAutoplayChange,
  onIntervalChange,
  onShowArrowsChange,
  onShowDotsChange,
  onLoopChange,
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
    if (to < 0 || to >= urls.length) {
      return;
    }

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
        <label className="form-label">슬라이드 이미지</label>

        <div className="d-flex flex-column gap-2">
          {urls.map((url, index) => (
            <div key={index} className="border rounded p-2">
              <div
                className="
                    d-flex
                    gap-1
                    mb-2
                  "
              >
                <small
                  className="
                      text-secondary
                      me-auto
                    "
                >
                  이미지 {index + 1}
                </small>

                <button
                  type="button"
                  className="
                      btn
                      btn-outline-secondary
                      btn-sm
                    "
                  disabled={index === 0}
                  onClick={() => moveUrl(index, index - 1)}
                >
                  ↑
                </button>

                <button
                  type="button"
                  className="
                      btn
                      btn-outline-secondary
                      btn-sm
                    "
                  disabled={index === urls.length - 1}
                  onClick={() => moveUrl(index, index + 1)}
                >
                  ↓
                </button>

                <button
                  type="button"
                  className="
                      btn
                      btn-outline-danger
                      btn-sm
                    "
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
                onChange={(event) => updateUrl(index, event.target.value)}
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
          className="
            btn
            btn-outline-primary
            btn-sm
            mt-2
          "
          onClick={addUrl}
        >
          + 이미지 추가
        </button>
      </div>

      <div className="form-check mb-2">
        <input
          id="slider-autoplay"
          type="checkbox"
          className="form-check-input"
          checked={autoplay}
          onChange={(event) => onAutoplayChange(event.target.checked)}
        />

        <label htmlFor="slider-autoplay" className="form-check-label">
          자동 재생
        </label>
      </div>

      <div className="form-check mb-2">
        <input
          id="slider-loop"
          type="checkbox"
          className="form-check-input"
          checked={loop}
          onChange={(event) => onLoopChange(event.target.checked)}
        />

        <label htmlFor="slider-loop" className="form-check-label">
          반복 재생
        </label>
      </div>

      <div className="mb-3">
        <label className="form-label">자동 재생 간격</label>

        <div className="input-group">
          <input
            type="number"
            className="form-control"
            min={500}
            step={500}
            value={interval}
            disabled={!autoplay}
            onChange={(event) =>
              onIntervalChange(Math.max(500, Number(event.target.value) || 500))
            }
          />

          <span className="input-group-text">ms</span>
        </div>
      </div>

      <div className="form-check mb-2">
        <input
          id="slider-arrows"
          type="checkbox"
          className="form-check-input"
          checked={showArrows}
          onChange={(event) => onShowArrowsChange(event.target.checked)}
        />

        <label htmlFor="slider-arrows" className="form-check-label">
          좌우 화살표 표시
        </label>
      </div>

      <div className="form-check mb-3">
        <input
          id="slider-dots"
          type="checkbox"
          className="form-check-input"
          checked={showDots}
          onChange={(event) => onShowDotsChange(event.target.checked)}
        />

        <label htmlFor="slider-dots" className="form-check-label">
          페이지 점 표시
        </label>
      </div>
    </>
  );
}

export default EditImageSliderFields;
