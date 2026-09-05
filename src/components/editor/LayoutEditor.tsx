import type { EditorConfig } from "./registry/componentRegistry";
import { EditorConfigProvider } from "../../context/EditorConfigContext";
import LayoutEditorContent from "./LayoutEditorContent";

function LayoutEditor({ config }: { config: EditorConfig }) {
  return (
    <EditorConfigProvider config={config}>
      <LayoutEditorContent />
    </EditorConfigProvider>
  );
}

export default LayoutEditor;
