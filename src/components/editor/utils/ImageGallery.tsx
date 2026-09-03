import { memo } from "react";
import type { ImageGalleryComponent } from "../../../types/types";

type Props = {
  component: ImageGalleryComponent;
};

function ImageGallery({ component }: Props) {
  const {
    urls = [],
    columns = 3,
    gap = 8,
    objectFit = "cover",
    borderRadius = 8,
  } = component.props;

  if (!urls.length) {
    return (
      <div
        style={{
          width: "100%",
          minHeight: 120,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px dashed #ced4da",
          borderRadius: 8,
          color: "#868e96",
          ...component.contentStyle,
        }}
      >
        이미지가 없습니다.
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${Math.max(columns, 1)}, minmax(0, 1fr))`,
        gap,
        width: "100%",
        ...component.contentStyle,
      }}
    >
      {urls.map((url, index) => (
        <div
          key={`${url}-${index}`}
          style={{
            width: "100%",
            aspectRatio: "1 / 1",
            overflow: "hidden",
            borderRadius,
          }}
        >
          <img
            src={url}
            alt={`${component.name ?? "Gallery"} ${index + 1}`}
            draggable={false}
            style={{
              display: "block",
              width: "100%",
              height: "100%",
              objectFit,
            }}
          />
        </div>
      ))}
    </div>
  );
}

export default memo(ImageGallery);
