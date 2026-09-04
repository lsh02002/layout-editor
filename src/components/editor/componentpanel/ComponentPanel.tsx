import { componentRegistryEntries } from "../../editor/registry/componentRegistry";

function ComponentPanel() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
      }}
    >
      <div
        style={{
          padding: 12,
          borderBottom: "1px solid #dee2e6",
        }}
      >
        <strong>컴포넌트</strong>

        <div
          className="text-secondary"
          style={{
            marginTop: 4,
            fontSize: 12,
          }}
        >
          추가할 컴포넌트를 드래그해서 캔버스 드랍존(+)에 놓으세요.
        </div>
      </div>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          padding: 8,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 8,
          }}
        >
          {componentRegistryEntries.map(([type, definition]) => {
            const Icon = definition.icon;

            return (
              <button
                key={type}
                type="button"
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.effectAllowed = "copy";

                  event.dataTransfer.setData(
                    "application/x-component-type",
                    type,
                  );
                }}
                className="btn btn-light border text-start"
                style={{
                  minHeight: 92,
                  padding: 10,
                  cursor: "grab",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: 28,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    marginBottom: 8,
                    borderRadius: 6,
                    color: "#495057",
                  }}
                >
                  <Icon size={17} strokeWidth={1.8} />
                  &nbsp;
                  {definition.label}
                </div>

                <div
                  className="text-secondary"
                  style={{
                    marginTop: 4,
                    fontSize: 11,
                    lineHeight: 1.35,
                  }}
                >
                  {definition.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ComponentPanel;
