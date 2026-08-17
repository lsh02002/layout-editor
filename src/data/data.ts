import type { LayoutComponent } from "../types/types";

export const data: LayoutComponent[] = [
  {
    id: "btn-001",
    type: "button",
    order: 0,
    props: {
      title: "저장하기",
      disabled: false,
      action: {
        type: "submit",
        payload: null,
      },
    },
    style: {
      width: "100%",
      marginTop: "16px",
    },
  },
  {
    id: "text-001",
    type: "textarea",
    order: 1,
    props: {
      value: "코딩 재미있네요",
      rows: 5,
      placeholder: "내용을 입력하세요",
      disabled: false,
    },
    style: {
      width: "100%",
    },
  },
  {
    id: "quill-001",
    type: "quill",
    order: 2,
    props: {
      value: "<p>코딩 잘되면 좋겠어요</p>",
      placeholder: "본문을 입력하세요",
      disabled: false,
    },
    style: {
      width: "50%",
    },
  },
  {
    id: "image-001",
    type: "image",
    order: 3,
    props: {
      urls: [
        "https://picsum.photos/id/237/600/400",
        "https://picsum.photos/id/1025/600/400",
      ],
      maxCount: 5,
      disabled: false,
    },
    style: {
      width: "100%",
    },
  },
];
