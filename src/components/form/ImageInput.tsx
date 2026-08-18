import {
  useEffect,
  useRef,
  useState,
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
  const [filePreviewUrls, setFilePreviewUrls] = useState<string[]>([]);

  const objectUrlsRef = useRef<string[]>([]);

  const clearObjectUrls = () => {
    objectUrlsRef.current.forEach((url) => {
      URL.revokeObjectURL(url);
    });

    objectUrlsRef.current = [];
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);

    if (files.length === 0) {
      return;
    }

    const remainCount = maxCount - previewUrls.length;

    const selected = files.slice(0, Math.max(0, remainCount));

    clearObjectUrls();

    const urls = selected.map((file) => URL.createObjectURL(file));

    objectUrlsRef.current = urls;

    setData(selected);
    setFilePreviewUrls(urls);

    e.target.value = "";
  };

  const removeOldImage = (index: number) => {
    if (disabled) return;

    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    if (disabled) return;

    const targetUrl = filePreviewUrls[index];

    if (targetUrl) {
      URL.revokeObjectURL(targetUrl);

      objectUrlsRef.current = objectUrlsRef.current.filter(
        (url) => url !== targetUrl,
      );
    }

    setFilePreviewUrls((prev) => prev.filter((_, i) => i !== index));

    setData(data.filter((_, i) => i !== index));
  };

  useEffect(() => {
    return () => {
      clearObjectUrls();
    };
  }, []);

  const totalCount = previewUrls.length + filePreviewUrls.length;

  const canAdd = !disabled && totalCount < maxCount;

  return (
    <div className="w-100 mb-3">
      <input
        type="file"        
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
                style={{
                  width: 24,
                  height: 24,
                  padding: 0,
                  lineHeight: 1,
                }}
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
                style={{
                  width: 24,
                  height: 24,
                  padding: 0,
                  lineHeight: 1,
                }}
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
