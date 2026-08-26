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
