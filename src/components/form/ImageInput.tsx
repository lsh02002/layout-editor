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
}

const ImageInput = ({
  disabled,
  name,
  setData,
  previewUrls,
  setPreviewUrls,
}: ImageInputProps) => {
  const [filePreviewUrls, setFilePreviewUrls] = useState<string[]>([]);

  // 현재 생성한 object URL들을 보관
  const objectUrlsRef = useRef<string[]>([]);

  const clearObjectUrls = () => {
    objectUrlsRef.current.forEach((url) => {
      URL.revokeObjectURL(url);
    });

    objectUrlsRef.current = [];
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const selected = Array.from(files).slice(0, 4);

    // 기존 object URL 제거
    clearObjectUrls();

    // 새 preview URL 생성
    const urls = selected.map((file) => URL.createObjectURL(file));

    objectUrlsRef.current = urls;

    setData(selected);
    setFilePreviewUrls(urls);

    // 기존 서버 이미지 preview 제거
    setPreviewUrls([]);
  };

  // 컴포넌트가 사라질 때 URL 정리
  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((url) => {
        URL.revokeObjectURL(url);
      });
    };
  }, []);

  return (
    <div className="w-100 mb-3">
      <input
        type="file"
        id={name}
        name={name}
        accept="image/*"
        multiple
        disabled={disabled}
        onChange={handleChange}
        className="d-none"
      />

      <label
        htmlFor={name}
        className={`
      d-flex justify-content-center align-items-center
      border rounded position-relative
      ${disabled ? "opacity-50" : ""}
    `}
        style={{
          width: "120px",
          height: "120px",
          cursor: disabled ? "default" : "pointer",
          fontSize: "32px",
        }}
      >
        <div className="position-absolute top-50 start-50 translate-middle text-dark">
          +
        </div>
        <div className="d-flex flex-wrap justify-content-center gap-2 mt-3">
          {previewUrls.map((url, i) => (
            <img
              key={`old-${i}`}
              src={url}
              alt={`기존 이미지 ${i + 1}`}
              className="rounded border"
              style={{
                width: 120,
                height: 120,
                objectFit: "cover",
              }}
            />
          ))}

          {filePreviewUrls.map((url, i) => (
            <img
              key={`new-${i}`}
              src={url}
              alt={`새 이미지 ${i + 1}`}
              className="rounded border"
              style={{
                width: 120,
                height: 120,
                objectFit: "cover",
              }}
            />
          ))}
        </div>
      </label>
    </div>
  );
};

export default ImageInput;
