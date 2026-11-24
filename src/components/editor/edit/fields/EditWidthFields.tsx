import type { Dispatch, SetStateAction } from "react";
import type { ComponentLayout } from "../../../../types/types";
import CSSSizeInput from "./CSSSizeInput";

type Props = {
  editLayout: ComponentLayout;
  setEditLayout: Dispatch<SetStateAction<ComponentLayout>>;
  onLayoutChange: (layout: Partial<ComponentLayout>) => void;
  savedLayout: ComponentLayout;
};

function EditWidthFields({
  editLayout,
  setEditLayout,
  onLayoutChange,
  savedLayout,
}: Props) {
  return (
    <div className="col-md-12">
      <CSSSizeInput
        label="Width"
        mode={editLayout.widthMode ?? "auto"}
        value={Number(editLayout.width)}
        unit={editLayout.widthUnit ?? "px"}
        savedValue={{
          mode: savedLayout.widthMode ?? "auto",
          value: Number(savedLayout.width),
          unit: savedLayout.widthUnit ?? "px",
        }}
        defaultValue={300}
        onChange={({ mode, value, unit }) => {
          const nextLayout: Partial<ComponentLayout> = {
            widthMode: mode,
            width: value,
            widthUnit: unit ?? "px",
          };

          setEditLayout((prev) => ({
            ...prev,
            ...nextLayout,
          }));

          onLayoutChange(nextLayout);
        }}
      />
    </div>
  );
}

export default EditWidthFields;
