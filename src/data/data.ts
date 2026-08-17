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
      border: "1px solid #ddd",
    },

    children: [
      {
        id: "text-001",
        type: "textarea",
        order: 0,

        style: {
          width: "50%",
        },

        props: {
          value: "",
          rows: 5,
          placeholder: "내용을 입력하세요",
          disabled: false,
        },
      },

      {
        id: "btn-001",
        type: "button",
        order: 1,

        style: {
          width: "50%",
        },

        props: {
          title: "저장하기",
          disabled: false,
          action: {
            type: "submit",
            payload: null,
          },
        },
      },
    ],
  },
];
