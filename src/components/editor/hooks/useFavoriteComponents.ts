import { useCallback, useState } from "react";

import type { FavoriteComponent, LayoutComponent } from "../../../types/types";

import {
  cloneComponent,
  findComponentLocation,
  findComponentRecursive,
  hasComponentType,
  insertComponentRecursive,
  normalizeOrder,
} from "../utils/componentTree";

type CommitHistory = (
  updater: (prev: LayoutComponent[]) => LayoutComponent[],
) => void;

type Options = {
  components: LayoutComponent[];
  selectedComponentId: string | null;
  commitHistory: CommitHistory;
  setSelectedComponentId: (id: string | null) => void;
};

export const useFavoriteComponents = ({
  components,
  selectedComponentId,
  commitHistory,
  setSelectedComponentId,
}: Options) => {
  const [favoriteComponents, setFavoriteComponents] = useState<
    FavoriteComponent[]
  >([]);

  const addSelectedComponentToFavorites = useCallback(() => {
    if (!selectedComponentId) {
      return;
    }

    const component = findComponentRecursive(components, selectedComponentId);

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
  }, [components, favoriteComponents, selectedComponentId]);

  const insertFavoriteComponent = useCallback(
    (favorite: FavoriteComponent) => {
      const cloned = cloneComponent(favorite.component);

      if (!selectedComponentId) {
        commitHistory((prev) => normalizeOrder([...prev, cloned]));

        setSelectedComponentId(cloned.id);
        return;
      }

      const selected = findComponentRecursive(components, selectedComponentId);

      if (selected && selected.type === "container") {
        commitHistory((prev) =>
          insertComponentRecursive(
            prev,
            selected.id,
            selected.children.length,
            cloned,
          ),
        );

        setSelectedComponentId(cloned.id);
        return;
      }

      const location = findComponentLocation(components, selectedComponentId);

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

      setSelectedComponentId(cloned.id);
    },
    [commitHistory, components, selectedComponentId, setSelectedComponentId],
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
