import ComponentNameField from "./ComponentNameField";

type Props = {
  componentName: string;
  previewUrl: string;
  onComponentNameChange: (value: string) => void;
  onPreviewUrlChange: (value: string) => void;
};

function ImageFields({
  componentName,
  previewUrl,
  onComponentNameChange,
  onPreviewUrlChange,
}: Props) {
  return (
    <>
      <ComponentNameField
        value={componentName}
        onChange={onComponentNameChange}
      />

      <div className="mb-3">
        <label className="form-label">이미지</label>

        <input
          type="file"
          className="form-control"
          accept="image/*"
          onChange={(event) => {
            const file = event.target.files?.[0] ?? null;

            if (!file) {
              onPreviewUrlChange("");
              return;
            }

            onPreviewUrlChange(URL.createObjectURL(file));
          }}
        />

        {previewUrl && (
          <div className="mt-3">
            <img
              src={previewUrl}
              alt="미리보기"
              style={{
                display: "block",
                maxWidth: "100%",
                maxHeight: 300,
                objectFit: "contain",
                borderRadius: 8,
              }}
            />
          </div>
        )}
      </div>
    </>
  );
}

export default ImageFields;
