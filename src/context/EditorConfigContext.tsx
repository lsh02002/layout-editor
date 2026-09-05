import type { EditorConfig } from "../components/editor/registry/componentRegistry";

import { EditorConfigContext } from "./usehooks";

export function EditorConfigProvider({
  config,
  children,
}: {
  config: EditorConfig;
  children: React.ReactNode;
}) {
  return (
    <EditorConfigContext.Provider value={config}>
      {children}
    </EditorConfigContext.Provider>
  );
}
