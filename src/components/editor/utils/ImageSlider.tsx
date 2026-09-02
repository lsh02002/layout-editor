import { memo, useEffect, useState } from "react";

import type { ImageSliderComponent } from "../../../types/types";

type Props = {
  component: ImageSliderComponent;
};

function ImageSlider({ component }: Props) {
  const {
    urls = [],
    autoplay = true,
    interval = 3000,
    showArrows = true,
    showDots = true,
    loop = true,
  } = component.props;

  const slideUrls = urls.filter((url) => url.trim());
  const count = slideUrls.length;
  const canLoop = loop && count > 1;
  const displayUrls = canLoop
    ? [slideUrls[count - 1], ...slideUrls, slideUrls[0]]
    : slideUrls;

  const [currentIndex, setCurrentIndex] = useState(canLoop ? 1 : 0);
  const [transitionEnabled, setTransitionEnabled] = useState(true);
  const realIndex =
    count <= 0
      ? 0
      : canLoop
        ? (currentIndex - 1 + count) % count
        : Math.min(currentIndex, count - 1);

  const goPrev = () => {
    if (count <= 1) return;
    setTransitionEnabled(true);
    setCurrentIndex((prev) => {
      if (canLoop) {
        return prev - 1;
      }
      return prev <= 0 ? 0 : prev - 1;
    });
  };

  const goNext = () => {
    if (count <= 1) return;
    setTransitionEnabled(true);
    setCurrentIndex((prev) => {
      if (canLoop) {
        return prev + 1;
      }
      return prev >= count - 1 ? count - 1 : prev + 1;
    });
  };

  const handleTransitionEnd = () => {
    if (!canLoop) return;

    if (currentIndex === count + 1) {
      setTransitionEnabled(false);
      setCurrentIndex(1);
      return;
    }

    if (currentIndex === 0) {
      setTransitionEnabled(false);

      setCurrentIndex(count);
    }
  };

  useEffect(() => {
    if (!autoplay || count <= 1) {
      return;
    }

    const timer = window.setInterval(
      () => {
        setTransitionEnabled(true);
        setCurrentIndex((prev) => {
          if (canLoop) {
            return prev + 1;
          }
          return prev >= count - 1 ? 0 : prev + 1;
        });
      },
      Math.max(interval, 500),
    );

    return () => {
      window.clearInterval(timer);
    };
  }, [autoplay, interval, count, canLoop]);

  if (!count) {
    return (
      <div
        className="
          d-flex
          align-items-center
          justify-content-center
          text-secondary
          bg-light
        "
        style={{
          width: "100%",
          height: "100%",
          minHeight: 200,
        }}
      >
        슬라이드 이미지 없음
      </div>
    );
  }

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
      }}
    >
      <div
        onTransitionEnd={handleTransitionEnd}
        style={{
          display: "flex",
          width: "100%",
          height: "100%",

          transform: `translateX(-${currentIndex * 100}%)`,

          transition: transitionEnabled ? "transform 350ms ease" : "none",
        }}
      >
        {displayUrls.map((url, index) => (
          <div
            key={`${url}-${index}`}
            style={{
              flex: "0 0 100%",
              width: "100%",
              height: "100%",
              minWidth: 0,
            }}
          >
            <img
              src={url}
              alt=""
              draggable={false}
              style={{
                display: "block",
                width: "100%",
                height: "100%",
                objectFit: "cover",
                userSelect: "none",
                pointerEvents: "none",
              }}
            />
          </div>
        ))}
      </div>

      {showArrows && count > 1 && (
        <>
          <button
            type="button"
            aria-label="이전 슬라이드"
            className="
                btn
                btn-dark
                rounded-circle
              "
            onPointerDown={(event) => {
              event.stopPropagation();
            }}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();

              goPrev();
            }}
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              zIndex: 5,

              width: 36,
              height: 36,
              padding: 0,

              display: "flex",
              alignItems: "center",
              justifyContent: "center",

              transform: "translateY(-50%)",
            }}
          >
            ‹
          </button>

          <button
            type="button"
            aria-label="다음 슬라이드"
            className="
                btn
                btn-dark
                rounded-circle
              "
            onPointerDown={(event) => {
              event.stopPropagation();
            }}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();

              goNext();
            }}
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              zIndex: 5,

              width: 36,
              height: 36,
              padding: 0,

              display: "flex",
              alignItems: "center",
              justifyContent: "center",

              transform: "translateY(-50%)",
            }}
          >
            ›
          </button>
        </>
      )}

      {showDots && count > 1 && (
        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: 12,
            zIndex: 5,

            display: "flex",
            alignItems: "center",
            gap: 7,

            transform: "translateX(-50%)",
          }}
        >
          {slideUrls.map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`슬라이드 ${index + 1}`}
              onPointerDown={(event) => {
                event.stopPropagation();
              }}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();

                setTransitionEnabled(true);

                setCurrentIndex(canLoop ? index + 1 : index);
              }}
              style={{
                width: 10,
                height: 10,

                padding: 0,
                border: 0,
                borderRadius: "50%",

                background: "#fff",

                opacity: realIndex === index ? 1 : 0.45,

                cursor: "pointer",

                transition: "opacity 150ms ease",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default memo(ImageSlider);
