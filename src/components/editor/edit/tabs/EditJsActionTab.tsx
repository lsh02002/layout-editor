import {
  isLayoutContainer,
  type ComponentJsAction,
  type ComponentJsEvent,
  type LayoutComponent,
} from "../../../../types/types";
import { useMemo, useState } from "react";
import CodeEditor from "../../utils/codeEditor";
import { getComponentDisplayName } from "../../utils/componentDisplayName";
import { useEditorConfig } from "../../../../context/usehooks";

type Props = {
  components: LayoutComponent[];
  actions: ComponentJsAction[];
  onChange: (actions: ComponentJsAction[]) => void;
};

const EVENT_OPTIONS: {
  value: ComponentJsEvent;
  label: string;
}[] = [
  { value: "click", label: "Click" },
  { value: "dblclick", label: "Double Click" },
  { value: "mouseenter", label: "Mouse Enter" },
  { value: "mouseleave", label: "Mouse Leave" },
  { value: "focus", label: "Focus" },
  { value: "blur", label: "Blur" },
  { value: "input", label: "Input" },
  { value: "change", label: "Change" },
];

export const EditJsActionTab = ({
  actions = [],
  onChange,
  components,
}: Props) => {
  const { components: componentRegistry } = useEditorConfig();
  const [targetComponentId, setTargetComponentId] = useState("");

  const [textValue, setTextValue] = useState("");
  const [styleProperty, setStyleProperty] = useState("");
  const [styleValue, setStyleValue] = useState("");
  const [attributeName, setAttributeName] = useState("");
  const [attributeValue, setAttributeValue] = useState("");

  const componentOptions = useMemo(() => {
    const result: {
      id: string;
      label: string;
    }[] = [];

    const walk = (items: LayoutComponent[], depth = 0) => {
      items.forEach((item) => {
        result.push({
          id: item.id,
          label: `${"　".repeat(depth)}${getComponentDisplayName(componentRegistry, item)} - ${item.type}`,
        });

        if (isLayoutContainer(item)) {
          walk(item.children, depth + 1);
        }
      });
    };

    walk(components);

    return result;
  }, [componentRegistry, components]);

  const updateActions = (nextActions: ComponentJsAction[]) => {
    onChange(nextActions);
  };

  const addAction = () => {
    updateActions([
      ...actions,
      {
        id: crypto.randomUUID(),
        event: "click",
        code: "",
        enabled: true,
        stopPropagation: false,
        preventDefault: false,
      },
    ]);
  };

  const updateAction = (id: string, patch: Partial<ComponentJsAction>) => {
    updateActions(
      actions.map((action) =>
        action.id === id
          ? {
              ...action,
              ...patch,
            }
          : action,
      ),
    );
  };

  const removeAction = (id: string) => {
    updateActions(actions.filter((action) => action.id !== id));
  };

  const appendCode = (actionId: string, code: string) => {
    const action = actions.find((item) => item.id === actionId);
    if (!action) {
      return;
    }

    const currentCode = action.code.trimEnd();
    updateAction(actionId, {
      code: currentCode ? `${currentCode}\n${code}` : code,
    });
  };

  return (
    <div className="d-flex flex-column gap-3">
      {/* 헤더 */}
      <div className="d-flex align-items-center justify-content-between">
        <div>
          <div className="d-flex align-items-center gap-2">
            <h6 className="mb-0 fw-bold">JS Actions</h6>

            <span className="badge text-bg-secondary rounded-pill">
              {actions.length}
            </span>
          </div>

          <small className="text-body-secondary">
            컴포넌트 이벤트에 JavaScript 동작을 연결합니다.
          </small>
        </div>

        <button
          type="button"
          className="btn btn-primary btn-sm d-flex align-items-center gap-1"
          onClick={addAction}
        >
          <span className="fw-bold">+</span>
          Action 추가
        </button>
      </div>

      {/* Action 목록 */}
      {actions.map((action, index) => (
        <div key={action.id} className="card shadow-sm">
          {/* Action Header */}
          <div className="card-header bg-body d-flex align-items-center justify-content-between gap-2">
            <div className="d-flex align-items-center gap-2">
              <span className="badge text-bg-dark">#{index + 1}</span>

              <select
                className="form-select form-select-sm"
                style={{ width: 160 }}
                value={action.event}
                onChange={(event) =>
                  updateAction(action.id, {
                    event: event.target.value as ComponentJsEvent,
                  })
                }
              >
                {EVENT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {action.enabled !== false ? (
                <span className="badge text-bg-success">Enabled</span>
              ) : (
                <span className="badge text-bg-secondary">Disabled</span>
              )}
            </div>

            <button
              type="button"
              className="btn btn-outline-danger btn-sm"
              onClick={() => removeAction(action.id)}
            >
              삭제
            </button>
          </div>

          <div className="card-body d-flex flex-column gap-4">
            {/* 이벤트 옵션 */}
            <div>
              <div className="fw-semibold small mb-2">이벤트 옵션</div>

              <div className="d-flex flex-wrap gap-3">
                <div className="form-check form-switch">
                  <input
                    id={`enabled-${action.id}`}
                    className="form-check-input"
                    type="checkbox"
                    checked={action.enabled !== false}
                    onChange={(event) =>
                      updateAction(action.id, {
                        enabled: event.target.checked,
                      })
                    }
                  />

                  <label
                    className="form-check-label"
                    htmlFor={`enabled-${action.id}`}
                  >
                    실행
                  </label>
                </div>

                <div className="form-check form-switch">
                  <input
                    id={`stop-${action.id}`}
                    className="form-check-input"
                    type="checkbox"
                    checked={action.stopPropagation === true}
                    onChange={(event) =>
                      updateAction(action.id, {
                        stopPropagation: event.target.checked,
                      })
                    }
                  />

                  <label
                    className="form-check-label"
                    htmlFor={`stop-${action.id}`}
                  >
                    이벤트전파방지
                  </label>
                </div>

                <div className="form-check form-switch">
                  <input
                    id={`prevent-${action.id}`}
                    className="form-check-input"
                    type="checkbox"
                    checked={action.preventDefault === true}
                    onChange={(event) =>
                      updateAction(action.id, {
                        preventDefault: event.target.checked,
                      })
                    }
                  />

                  <label
                    className="form-check-label"
                    htmlFor={`prevent-${action.id}`}
                  >
                    기본 동작 방지
                  </label>
                </div>
              </div>
            </div>

            <hr className="my-0" />

            {/* 대상 */}
            <div>
              <label className="form-label fw-semibold small">
                대상 컴포넌트
              </label>

              <select
                value={targetComponentId}
                onChange={(event) => setTargetComponentId(event.target.value)}
                className="form-select form-select-sm"
              >
                <option value="">대상 컴포넌트 선택</option>

                {componentOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>

              {targetComponentId && (
                <div className="form-text">
                  선택된 ID: <code>{targetComponentId}</code>
                </div>
              )}
            </div>

            {/* 빠른 동작 */}
            <div>
              <div className="fw-semibold small mb-2">빠른 동작</div>

              <div className="d-flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn btn-outline-success btn-sm"
                  disabled={!targetComponentId}
                  onClick={() =>
                    appendCode(
                      action.id,
                      `builder.show(${JSON.stringify(targetComponentId)});`,
                    )
                  }
                >
                  Show
                </button>

                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  disabled={!targetComponentId}
                  onClick={() =>
                    appendCode(
                      action.id,
                      `builder.hide(${JSON.stringify(targetComponentId)});`,
                    )
                  }
                >
                  Hide
                </button>

                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm"
                  disabled={!targetComponentId}
                  onClick={() =>
                    appendCode(
                      action.id,
                      `builder.toggle(${JSON.stringify(targetComponentId)});`,
                    )
                  }
                >
                  Toggle
                </button>

                <button
                  type="button"
                  className="btn btn-outline-info btn-sm"
                  disabled={!targetComponentId}
                  onClick={() =>
                    appendCode(
                      action.id,
                      `builder.scrollTo(${JSON.stringify(targetComponentId)});`,
                    )
                  }
                >
                  Scroll To
                </button>

                <button
                  type="button"
                  className="btn btn-outline-dark btn-sm"
                  disabled={!targetComponentId}
                  onClick={() =>
                    appendCode(
                      action.id,
                      `builder.addClass(${JSON.stringify(
                        targetComponentId,
                      )}, "active");`,
                    )
                  }
                >
                  + Class
                </button>

                <button
                  type="button"
                  className="btn btn-outline-dark btn-sm"
                  disabled={!targetComponentId}
                  onClick={() =>
                    appendCode(
                      action.id,
                      `builder.removeClass(${JSON.stringify(
                        targetComponentId,
                      )}, "active");`,
                    )
                  }
                >
                  − Class
                </button>
              </div>
            </div>

            {/* Text */}
            <div>
              <label className="form-label fw-semibold small">
                텍스트 변경
              </label>

              <div className="input-group input-group-sm">
                <input
                  type="text"
                  value={textValue}
                  placeholder="변경할 텍스트"
                  onChange={(event) => setTextValue(event.target.value)}
                  className="form-control"
                />

                <button
                  type="button"
                  className="btn btn-outline-primary"
                  disabled={!targetComponentId || !textValue}
                  onClick={() =>
                    appendCode(
                      action.id,
                      `builder.setText(${JSON.stringify(
                        targetComponentId,
                      )}, ${JSON.stringify(textValue)});`,
                    )
                  }
                >
                  Set Text
                </button>
              </div>
            </div>

            {/* Style */}
            <div>
              <label className="form-label fw-semibold small">CSS Style</label>

              <div className="input-group input-group-sm">
                <input
                  type="text"
                  value={styleProperty}
                  placeholder="예: background-color"
                  className="form-control"
                  onChange={(event) => setStyleProperty(event.target.value)}
                />

                <input
                  type="text"
                  value={styleValue}
                  placeholder="예: red"
                  className="form-control"
                  onChange={(event) => setStyleValue(event.target.value)}
                />

                <button
                  type="button"
                  className="btn btn-outline-primary"
                  disabled={!targetComponentId || !styleProperty}
                  onClick={() =>
                    appendCode(
                      action.id,
                      `builder.setStyle(${JSON.stringify(
                        targetComponentId,
                      )}, ${JSON.stringify(styleProperty)}, ${JSON.stringify(
                        styleValue,
                      )});`,
                    )
                  }
                >
                  Set Style
                </button>
              </div>
            </div>

            {/* Attribute */}
            <div>
              <label className="form-label fw-semibold small">Attribute</label>

              <div className="input-group input-group-sm">
                <input
                  type="text"
                  value={attributeName}
                  placeholder="예: aria-label"
                  className="form-control"
                  onChange={(event) => setAttributeName(event.target.value)}
                />

                <input
                  type="text"
                  value={attributeValue}
                  placeholder="값"
                  className="form-control"
                  onChange={(event) => setAttributeValue(event.target.value)}
                />

                <button
                  type="button"
                  className="btn btn-outline-primary"
                  disabled={!targetComponentId || !attributeName}
                  onClick={() =>
                    appendCode(
                      action.id,
                      `builder.setAttribute(${JSON.stringify(
                        targetComponentId,
                      )}, ${JSON.stringify(attributeName)}, ${JSON.stringify(
                        attributeValue,
                      )});`,
                    )
                  }
                >
                  Set
                </button>

                <button
                  type="button"
                  className="btn btn-outline-danger"
                  disabled={!targetComponentId || !attributeName}
                  onClick={() =>
                    appendCode(
                      action.id,
                      `builder.removeAttribute(${JSON.stringify(
                        targetComponentId,
                      )}, ${JSON.stringify(attributeName)});`,
                    )
                  }
                >
                  Remove
                </button>
              </div>
            </div>

            <hr className="my-0" />

            {/* JS Code */}
            <div>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <label className="form-label fw-semibold small mb-0">
                  JavaScript Code
                </label>

                <span className="badge text-bg-light border text-body-secondary">
                  event · element · component · builder
                </span>
              </div>

              <CodeEditor
                data={action.code}
                setData={(value) =>
                  updateAction(action.id, {
                    code: value,
                  })
                }
                placeholder={`// 예:
builder.toggle("component-id");
element.style.opacity = "0.5";`}
                language="javascript"
              />

              <div className="form-text">
                현재 이벤트에서는 <code>event</code>, <code>element</code>,{" "}
                <code>component</code>, <code>builder</code>를 사용할 수
                있습니다.
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
