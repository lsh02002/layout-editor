import type { ShapeType } from "../../../types/types";

export const getShapePoints = (shapeType: ShapeType) => {
  switch (shapeType) {
    case "triangle":
      return "50,2 98,98 2,98";

    case "diamond":
      return "50,2 98,50 50,98 2,50";

    case "pentagon":
      return "50,2 98,38 80,98 20,98 2,38";

    case "hexagon":
      return "25,2 75,2 98,50 75,98 25,98 2,50";

    case "star":
      return "50,2 61,36 98,36 68,57 79,94 50,72 21,94 32,57 2,36 39,36";

    case "arrow-right":
      return "2,25 65,25 65,2 98,50 65,98 65,75 2,75";

    case "chevron":
      return "2,2 70,2 98,50 70,98 2,98 30,50";

    case "parallelogram":
      return "20,2 98,2 80,98 2,98";

    default:
      return "";
  }
};
