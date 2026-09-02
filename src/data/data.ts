import type { LayoutComponent } from "../types/types";

export const data: LayoutComponent[] = [
  {
    id: "container-001",
    type: "container",
    order: 0,

    props: {
      direction: "row",
      gap: 16,
    },

    style: {
      width: "100%",
      padding: 16,
      // border: "1px solid #ddd",
    },

    children: [],
  },
];

export const FAKE_IMAGE_URL = "https://picsum.photos/id/238/1200/500";

export const FAKE_IMAGE_SLIDER_URLS = [
  "https://picsum.photos/id/238/1200/500",
  "https://picsum.photos/id/239/1200/500",
  "https://picsum.photos/id/240/1200/500",
];