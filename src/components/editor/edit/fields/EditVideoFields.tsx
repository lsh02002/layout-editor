import EditComponentNameField from "./EditComponentNameField";

type Props = {
  componentName: string;
  src: string;
  controls: boolean;
  autoplay: boolean;
  muted: boolean;
  loop: boolean;
  onComponentNameChange: (value: string) => void;
  onSrcChange: (value: string) => void;
  onControlsChange: (value: boolean) => void;
  onAutoplayChange: (value: boolean) => void;
  onMutedChange: (value: boolean) => void;
  onLoopChange: (value: boolean) => void;
};

function EditVideoFields({
  componentName,
  src,
  controls,
  autoplay,
  muted,
  loop,
  onComponentNameChange,
  onSrcChange,
  onControlsChange,
  onAutoplayChange,
  onMutedChange,
  onLoopChange,
}: Props) {
  return (
    <>
      <EditComponentNameField
        value={componentName}
        onChange={onComponentNameChange}
      />

      <div className="mb-3">
        <label className="form-label">동영상 URL</label>

        <input
          type="url"
          className="form-control"
          value={src}
          placeholder="https://example.com/video.mp4"
          onChange={(event) => onSrcChange(event.target.value)}
        />
      </div>

      <div className="form-check mb-2">
        <input
          className="form-check-input"
          type="checkbox"
          id="video-controls"
          checked={controls}
          onChange={(event) => onControlsChange(event.target.checked)}
        />

        <label className="form-check-label" htmlFor="video-controls">
          컨트롤 표시
        </label>
      </div>

      <div className="form-check mb-2">
        <input
          className="form-check-input"
          type="checkbox"
          id="video-autoplay"
          checked={autoplay}
          onChange={(event) => onAutoplayChange(event.target.checked)}
        />

        <label className="form-check-label" htmlFor="video-autoplay">
          자동 재생
        </label>
      </div>

      <div className="form-check mb-2">
        <input
          className="form-check-input"
          type="checkbox"
          id="video-muted"
          checked={muted}
          onChange={(event) => onMutedChange(event.target.checked)}
        />

        <label className="form-check-label" htmlFor="video-muted">
          음소거
        </label>
      </div>

      <div className="form-check">
        <input
          className="form-check-input"
          type="checkbox"
          id="video-loop"
          checked={loop}
          onChange={(event) => onLoopChange(event.target.checked)}
        />

        <label className="form-check-label" htmlFor="video-loop">
          반복 재생
        </label>
      </div>
    </>
  );
}

export default EditVideoFields;
