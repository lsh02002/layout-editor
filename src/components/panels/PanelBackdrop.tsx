type Props = { visible: boolean; onClick: () => void };
export function PanelBackdrop({ visible, onClick }: Props) {
  if (!visible) return null;
  return <div className="editor-panel-backdrop" onClick={onClick} />;
}
