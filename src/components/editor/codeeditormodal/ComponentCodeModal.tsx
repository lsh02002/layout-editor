import { useMemo, useState } from "react";
import { isLayoutContainer, type LayoutComponent } from "../../../types/types";
import CodeEditor from "../utils/codeEditor";
import {
  containsComponent,
  flattenComponents,
  updateComponentRecursive,
} from "../utils/componentTree";
import { getComponentDisplayName } from "../utils/componentDisplayName";
import { useEditorConfig } from "../../../context/usehooks";

type Props = {
  show: boolean;
  selectedComponentIds: string[];
  components: LayoutComponent[];
  setSelectedComponentIds: React.Dispatch<React.SetStateAction<string[]>>;
  scrollToCanvasComponent: (componentId: string) => void;
  setComponents: React.Dispatch<React.SetStateAction<LayoutComponent[]>>;
  onClose: () => void;
};

export default function ComponentCodeModal({
  show,
  components,
  selectedComponentIds,
  setSelectedComponentIds,
  setComponents,
  scrollToCanvasComponent,
  onClose,
}: Props) {
  const { components: componentRegistry } = useEditorConfig();
  const [hoveredComponentId, setHoveredComponentId] = useState<string | null>(
    null,
  );

  const layeredComponentOptionNames = (
    layerComponents: LayoutComponent[],
    depth: number = 0,
  ): { label: string; hasJSActions: boolean; componentId: string }[] => {
    return layerComponents.flatMap((component) => {
      const name = getComponentDisplayName(componentRegistry, component);
      const current = {
        label: `${"　".repeat(depth)}${name} - ${component.type}`,
        hasJSActions: (component.jsActions?.length ?? 0) > 0,
        componentId: component.id,
      };

      if ("children" in component && Array.isArray(component.children)) {
        return [
          current,
          ...layeredComponentOptionNames(component.children, depth + 1),
        ];
      }

      return [current];
    });
  };

  const allComponents = useMemo(
    () => flattenComponents(components),
    [components],
  );

  const codeComponents = useMemo(
    () =>
      allComponents.filter(
        (component) => component.jsActions && component.jsActions.length > 0,
      ),
    [allComponents],
  );

  const addJsAction = (componentId: string) => {
    if (!componentId) {
      return;
    }

    setComponents((current) =>
      updateComponentRecursive(current, componentId, (component) => ({
        ...component,
        jsActions: [
          ...(component.jsActions ?? []),
          {
            id: crypto.randomUUID(),
            event: "click",
            code: "",
            enabled: true,
            stopPropagation: false,
            preventDefault: false,
          },
        ],
      })),
    );
  };

  const removeJsAction = (componentId: string, actionId: string) => {
    setComponents((current) =>
      updateComponentRecursive(current, componentId, (component) => ({
        ...component,
        jsActions: component.jsActions?.filter(
          (action) => action.id !== actionId,
        ),
      })),
    );
  };

  const updateCode = (componentId: string, actionId: string, code: string) => {
    setComponents((current) =>
      updateComponentRecursive(current, componentId, (component) => ({
        ...component,
        jsActions: component.jsActions?.map((action) =>
          action.id === actionId
            ? {
                ...action,
                code,
              }
            : action,
        ),
      })),
    );
  };

  const findRootSlide = (
    components: LayoutComponent[],
    targetId: string,
  ): LayoutComponent | null => {
    for (const component of components) {
      if (
        isLayoutContainer(component) &&
        containsComponent(component, targetId)
      ) {
        return component;
      }
    }

    return null;
  };

  const codeComponentItems = useMemo(
    () =>
      codeComponents.map((component) => {
        const rootSlide = findRootSlide(allComponents, component.id);

        return {
          component,
          rootSlideDisplayName: rootSlide
            ? getComponentDisplayName(componentRegistry, rootSlide)
            : "",
        };
      }),
    [codeComponents, allComponents, componentRegistry],
  );

  if (!show) {
    return null;
  }

  return (
    <>
      <div
        className="modal fade show"
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        tabIndex={-1}
      >
        <div
          className="modal-dialog modal-xl modal-dialog-scrollable"
          style={{
            maxWidth: "960px",
          }}
        >
          <div className="modal-content">
            <div className="modal-header">
              <div>
                <h5 className="modal-title">Component Code</h5>

                <small className="text-muted">
                  {codeComponents.length} components
                </small>
              </div>

              <button type="button" className="btn-close" onClick={onClose} />
            </div>

            <div className="p-3">
              <label
                htmlFor="component-code-add-action"
                className="form-label fw-semibold"
              >
                JS Action 추가
              </label>

              <select
                id="component-code-add-action"
                aria-label="JS Action을 추가할 컴포넌트"
                className="form-select"                
                onChange={(event) => addJsAction(event.target.value)}
              >
                <option value="">컴포넌트를 선택하세요</option>

                {layeredComponentOptionNames(components, 0).map(
                  (optionData) => {
                    const hasJsAction = optionData.hasJSActions;
                    const label =
                      optionData.label.length > 50
                        ? `${optionData.label.slice(0, 50)}...`
                        : optionData.label;
                    return (
                      <option
                        key={optionData.label + optionData.componentId}
                        value={optionData.componentId}
                        disabled={hasJsAction}
                      >
                        {label}
                        {hasJsAction ? " (✓)" : ""}
                      </option>
                    );
                  },
                )}
              </select>

              <small className="text-muted">
                컴포넌트를 선택하면 기본 Click JS Action이 추가됩니다.
                <br />
                click 외 다른 이벤트를 추가하려면 오른쪽 에디터 창을
                이용해주세요.
              </small>
            </div>

            <div className="modal-body">
              {codeComponents.length === 0 ? (
                <div
                  className="text-muted"
                  style={{
                    padding: "64px 24px",
                    textAlign: "center",
                  }}
                >
                  등록된 코드가 없습니다.
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "24px",
                  }}
                >
                  {codeComponentItems.map(
                    ({ component, rootSlideDisplayName }) => {
                      const isSelected = selectedComponentIds?.includes(
                        component.id,
                      );

                      return (
                        <div
                          key={component.id}
                          className="card"
                          onMouseEnter={() =>
                            setHoveredComponentId(component.id)
                          }
                          onMouseLeave={() => setHoveredComponentId(null)}
                          onClick={() => {
                            setSelectedComponentIds([component.id]);
                            scrollToCanvasComponent(component.id);
                          }}
                        >
                          <div
                            className="card-header"
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: "16px",
                              border:
                                hoveredComponentId === component.id ||
                                isSelected
                                  ? "1px solid rgba(13, 110, 253, 0.35)"
                                  : "1px solid transparent",
                              background: isSelected
                                ? "rgba(13, 110, 253, 0.12)"
                                : "transparent",
                              borderRadius:
                                hoveredComponentId === component.id ||
                                isSelected
                                  ? "4px"
                                  : "0px",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                              }}
                            >
                              <strong>
                                (
                                {rootSlideDisplayName.length > 16
                                  ? rootSlideDisplayName.slice(0, 16) + "..."
                                  : rootSlideDisplayName}
                                )
                              </strong>
                              <strong>
                                {getComponentDisplayName(
                                  componentRegistry,
                                  component,
                                )}
                              </strong>

                              <span className="badge text-bg-secondary">
                                {component.type}
                              </span>
                            </div>

                            <small className="text-muted">{component.id}</small>
                          </div>

                          <div className="card-body">
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "20px",
                              }}
                            >
                              {component.jsActions?.map((action) => (
                                <div key={action.id}>
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "space-between",
                                      marginBottom: "8px",
                                    }}
                                  >
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                      }}
                                    >
                                      <strong>{action.event}</strong>

                                      <span
                                        className={
                                          action.enabled
                                            ? "badge text-bg-success"
                                            : "badge text-bg-secondary"
                                        }
                                      >
                                        {action.enabled
                                          ? "enabled"
                                          : "disabled"}
                                      </span>
                                    </div>

                                    <small className="text-muted">
                                      {action.id}
                                    </small>

                                    <button
                                      className="m-1 btn btn-sm btn-outline-danger"
                                      onClick={() =>
                                        removeJsAction(component.id, action.id)
                                      }
                                    >
                                      Delete
                                    </button>
                                  </div>

                                  <CodeEditor
                                    data={action.code}
                                    setData={(value) =>
                                      updateCode(
                                        component.id,
                                        action.id,
                                        value ?? "",
                                      )
                                    }
                                    height="120px"
                                    language="javascript"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="modal-backdrop fade show" onClick={onClose} />
    </>
  );
}
