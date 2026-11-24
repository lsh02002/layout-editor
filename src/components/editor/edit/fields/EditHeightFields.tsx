import type { Dispatch, SetStateAction } from "react";

import type { ComponentLayout } from "../../../../types/types";

import CSSSizeInput from "./CSSSizeInput";

type Props = {
  editLayout: ComponentLayout;
  setEditLayout: Dispatch<SetStateAction<ComponentLayout>>;
  onLayoutChange: (layout: Partial<ComponentLayout>) => void;
  savedLayout: ComponentLayout;
};

function EditHeightFields({
  editLayout,
  setEditLayout,
  onLayoutChange,
  savedLayout,
}: Props) {
  return (
    <div className="col-md-12">
      <CSSSizeInput
        label="Height"
        mode={editLayout.heightMode ?? "auto"}
        value={Number(editLayout.height)}
        unit={editLayout.heightUnit ?? "px"}
        savedValue={{
          mode: savedLayout.heightMode ?? "auto",
          value: Number(savedLayout.height),
          unit: savedLayout.heightUnit ?? "px",
        }}
        defaultValue={100}
        onChange={({ mode, value, unit }) => {
          const nextLayout: Partial<ComponentLayout> = {
            heightMode: mode,
            height: value,
            heightUnit: unit ?? "px",
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

export default EditHeightFields;
