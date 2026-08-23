import EditComponentNameField from "./EditComponentNameField";

type Props = {
  componentName: string;
  imageUrl: string;
  previewUrl: string;
  onComponentNameChange: (value: string) => void;
  onImageUrlChange: (value: string) => void;
  onPreviewUrlChange: (value: string) => void;
};

function EditImageFields({
  componentName,
  imageUrl,
  previewUrl,
  onComponentNameChange,
  onImageUrlChange,
  onPreviewUrlChange,
}: Props) {
  return (
    <>
      <EditComponentNameField
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
              onImageUrlChange("");
              onPreviewUrlChange("");
              return;
            }

            const nextUrl = URL.createObjectURL(file);
            onImageUrlChange(nextUrl);
            onPreviewUrlChange(nextUrl);
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

        {!previewUrl && imageUrl && (
          <div className="form-text">기존 이미지가 설정되어 있습니다.</div>
        )}
      </div>
    </>
  );
}

export default EditImageFields;
