import type { ComponentField } from "../../registry/componentRegistry";

export default function EditFieldFields({
  name,
  field,
  value,
  onChange,
}: {
  name: string;
  field: ComponentField;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  if (field.type === "text") {
    const fieldValue = field.getValue
      ? field.getValue(value)
      : typeof value === "string"
        ? value
        : "";
    return (
      <div className="mb-3">
        <label className="form-label" htmlFor={`field-${name}`}>
          {field.label}
        </label>
        <input
          id={`field-${name}`}
          type="text"
          className="form-control"
          value={fieldValue}
          placeholder={field.placeholder}
          onChange={(event) =>
            onChange(
              field.setValue
                ? field.setValue(event.target.value)
                : event.target.value,
            )
          }
        />
      </div>
    );
  }

  if (field.type === "textarea") {
    return (
      <div className="mb-3">
        <label className="form-label" htmlFor={`field-${name}`}>
          {field.label}
        </label>
        <textarea
          id={`field-${name}`}
          className="form-control"
          value={typeof value === "string" ? value : ""}
          placeholder={field.placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    );
  }

  if (field.type === "number") {
    return (
      <div className="mb-3">
        <label className="form-label" htmlFor={`field-${name}`}>
          {field.label}
        </label>
        <input
          id={`field-${name}`}
          type="number"
          className="form-control"
          value={typeof value === "number" ? value : ""}
          min={field.min}
          max={field.max}
          onChange={(event) => onChange(Number(event.target.value))}
        />
      </div>
    );
  }

  if (field.type === "select") {
    return (
      <div className="mb-3">
        <label className="form-label" htmlFor={`field-${name}`}>
          {field.label}
        </label>
        <select
          id={`field-${name}`}
          className="form-select"
          value={String(value ?? "")}
          onChange={(event) => {
            const option = field.options.find(
              (item) => String(item.value) === event.target.value,
            );
            if (option) {
              onChange(option.value);
            }
          }}
        >
          {field.options.map((option) => (
            <option key={String(option.value)} value={String(option.value)}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (field.type === "checkbox") {
    return (
      <div className="form-check mb-3">
        <input
          id={`field-${name}`}
          type="checkbox"
          className="form-check-input"
          checked={Boolean(value)}
          onChange={(event) => onChange(event.target.checked)}
        />
        <label className="form-check-label" htmlFor={`field-${name}`}>
          {field.label}
        </label>
      </div>
    );
  }

  if (field.type === "radio") {
    return (
      <>
        <label className="form-label">{field.label}</label>
        <div className="d-flex align-items-center gap-3">
          {field.options.map((option) => (
            <div className="form-check" key={String(option.value)}>
              <input
                id={`field-${name}-${option.value}`}
                type="radio"
                className="form-check-input"
                name={`field-${name}`}
                value={String(option.value)}
                checked={String(value) === String(option.value)}
                onChange={() => onChange(option.value)}
              />
              <label
                className="form-check-label"
                htmlFor={`field-${name}-${option.value}`}
              >
                {option.label}
              </label>
            </div>
          ))}
        </div>
      </>
    );
  }

  return null;
}
