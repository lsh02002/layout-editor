import { useCallback, useState } from "react";
import type {
  FavoriteComponent,
  LayoutComponent,
  CommitHistory,
} from "../../../types/types";

import {
  cloneComponent,
  findComponentLocation,
  findComponentRecursive,
  hasComponentType,
  insertComponentRecursive,
  normalizeOrder,
} from "../utils/componentTree";

type Options = {
  components: LayoutComponent[];
  selectedComponentIds: string[];
  commitHistory: CommitHistory;
  setSelectedComponentIds: React.Dispatch<React.SetStateAction<string[]>>;
};

export const useFavoriteComponents = ({
  components,
  selectedComponentIds,
  commitHistory,
  setSelectedComponentIds,
}: Options) => {
  const primarySelectedId = selectedComponentIds?.at(-1) ?? null;

  const [favoriteComponents, setFavoriteComponents] = useState<
    FavoriteComponent[]
  >([]);

  const addSelectedComponentToFavorites = useCallback(() => {
    if (!primarySelectedId) {
      return;
    }

    const component = findComponentRecursive(components, primarySelectedId);

    if (!component) {
      return;
    }

    if (
      component.type === "scrollToTopButton" &&
      hasComponentType(components, component.type)
    ) {
      alert("Scroll To Top Button은 한번만 등록 가능합니다.");
      return;
    }

    const alreadyExists = favoriteComponents.some(
      (favorite) => favorite.sourceComponentId === component.id,
    );

    if (alreadyExists) {
      alert("이미 즐겨찾기에 등록된 컴포넌트입니다.");
      return;
    }

    setFavoriteComponents((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        sourceComponentId: component.id,
        name: component.name?.trim() || component.type,
        component: structuredClone(component),
      },
    ]);
  }, [components, favoriteComponents, primarySelectedId]);

  const insertFavoriteComponent = useCallback(
    (favorite: FavoriteComponent) => {
      const cloned = cloneComponent(favorite.component);

      if (!primarySelectedId) {
        commitHistory((prev) => normalizeOrder([...prev, cloned]));

        setSelectedComponentIds([cloned.id]);
        return;
      }

      const selected = findComponentRecursive(components, primarySelectedId);

      if (selected && selected.type === "container") {
        commitHistory((prev) =>
          insertComponentRecursive(
            prev,
            selected.id,
            selected.children.length,
            cloned,
          ),
        );

        setSelectedComponentIds([cloned.id]);
        return;
      }

      const location = findComponentLocation(components, primarySelectedId);

      if (!location) {
        return;
      }

      commitHistory((prev) =>
        insertComponentRecursive(
          prev,
          location.parentId,
          location.index + 1,
          cloned,
        ),
      );

      setSelectedComponentIds([cloned.id]);
    },
    [commitHistory, components, primarySelectedId, setSelectedComponentIds],
  );

  const removeFavoriteComponent = useCallback((favoriteId: string) => {
    setFavoriteComponents((prev) =>
      prev.filter((favorite) => favorite.id !== favoriteId),
    );
  }, []);

  return {
    favoriteComponents,
    setFavoriteComponents,
    addSelectedComponentToFavorites,
    insertFavoriteComponent,
    removeFavoriteComponent,
  };
};
