import { useSyncExternalStore } from "react";

import { builderState } from "../utils/builderState";

export const useBuilderState = () => {
  useSyncExternalStore(
    builderState.subscribe,
    () => JSON.stringify(builderState.all()),
    () => "{}",
  );

  return builderState;
};
