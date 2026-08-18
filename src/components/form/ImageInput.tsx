import {
  useMemo,
  useEffect,
  type ChangeEvent,
  type Dispatch,
  type SetStateAction,
} from "react";

interface ImageInputProps {
  disabled?: boolean;
  name: string;
  data: File[];
  setData: (files: File[]) => void;
  previewUrls: string[];
  setPreviewUrls: Dispatch<SetStateAction<string[]>>;
  maxCount?: number;
}

const ImageInput = ({
  disabled,
  name,
  data,
  setData,
  previewUrls,
  setPreviewUrls,
  maxCount = 4,
}: ImageInputProps) => {
  const filePreviewUrls = useMemo(
    () => data.map((file) => URL.createObjectURL(file)),
    [data],
  );

  useEffect(() => {
    return () => {
      filePreviewUrls.forEach((url) => {
        URL.revokeObjectURL(url);
      });
    };
  }, [filePreviewUrls]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);

    if (files.length === 0) {
      return;
    }

    const remain = maxCount - previewUrls.length - data.length;

    if (remain <= 0) {
      return;
    }

    const selected = files.slice(0, remain);

    setData([...data, ...selected]);

    e.target.value = "";
  };

  const removeOldImage = (index: number) => {
    if (disabled) {
      return;
    }

    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    if (disabled) {
      return;
    }

    setData(data.filter((_, i) => i !== index));
  };

  const totalCount = previewUrls.length + data.length;

  const canAdd = !disabled && totalCount < maxCount;

  return (
    <div className="w-100 mb-3">
      <input
        type="file"
        id={name}
        name={name}
        accept="image/*"
        multiple
        disabled={!canAdd}
        onChange={handleChange}
        className="d-none"
      />

      <div className="d-flex flex-wrap gap-2">
        {previewUrls.map((url, index) => (
          <div key={`old-${url}-${index}`} className="position-relative">
            <img
              src={url}
              alt={`기존 이미지 ${index + 1}`}
              className="rounded border"
              style={{
                width: 120,
                height: 120,
                objectFit: "cover",
              }}
            />

            {!disabled && (
              <button
                type="button"
                className="btn btn-danger btn-sm position-absolute top-0 end-0"
                onClick={() => removeOldImage(index)}
              >
                ×
              </button>
            )}
          </div>
        ))}

        {filePreviewUrls.map((url, index) => (
          <div key={`new-${url}-${index}`} className="position-relative">
            <img
              src={url}
              alt={`새 이미지 ${index + 1}`}
              className="rounded border"
              style={{
                width: 120,
                height: 120,
                objectFit: "cover",
              }}
            />

            {!disabled && (
              <button
                type="button"
                className="btn btn-danger btn-sm position-absolute top-0 end-0"
                onClick={() => removeNewImage(index)}
              >
                ×
              </button>
            )}
          </div>
        ))}

        {canAdd && (
          <label
            htmlFor={name}
            className="
              d-flex
              justify-content-center
              align-items-center
              border
              rounded
            "
            style={{
              width: 120,
              height: 120,
              cursor: "pointer",
              fontSize: 32,
            }}
          >
            +
          </label>
        )}
      </div>

      <div className="form-text">
        {totalCount} / {maxCount}
      </div>
    </div>
  );
};

export default ImageInput;
