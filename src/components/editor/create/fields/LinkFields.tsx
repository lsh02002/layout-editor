import type { LinkType } from "../../../../types/types";

import ComponentNameField from "./ComponentNameField";

type Props = {
  componentName: string;
  title: string;
  linkType: LinkType;
  value: string;
  newWindow: boolean;
  onComponentNameChange: (value: string) => void;
  onTitleChange: (value: string) => void;
  onLinkTypeChange: (value: LinkType) => void;
  onValueChange: (value: string) => void;
  onNewWindowChange: (value: boolean) => void;
};

function LinkFields({
  componentName,
  title,
  linkType,
  value,
  newWindow,
  onComponentNameChange,
  onTitleChange,
  onLinkTypeChange,
  onValueChange,
  onNewWindowChange,
}: Props) {
  return (
    <>
      <ComponentNameField
        value={componentName}
        onChange={onComponentNameChange}
      />

      <div className="mb-3">
        <label className="form-label">표시할 텍스트</label>

        <input
          type="text"
          className="form-control"
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          placeholder="링크"
        />
      </div>

      <div className="mb-3">
        <label className="form-label">링크 종류</label>

        <select
          className="form-select"
          value={linkType}
          onChange={(event) => {
            const nextType = event.target.value as LinkType;
            onLinkTypeChange(nextType);
            onValueChange("");

            if (nextType !== "url") {
              onNewWindowChange(false);
            }
          }}
        >
          <option value="url">URL</option>
          <option value="tel">전화</option>
          <option value="email">이메일</option>
        </select>
      </div>

      <div className="mb-3">
        <label className="form-label">
          {linkType === "tel"
            ? "전화번호"
            : linkType === "email"
              ? "이메일 주소"
              : "URL"}
        </label>

        <input
          type={
            linkType === "email" ? "email" : linkType === "tel" ? "tel" : "text"
          }
          className="form-control"
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          placeholder={
            linkType === "tel"
              ? "010-1234-5678"
              : linkType === "email"
                ? "example@email.com"
                : "https://example.com"
          }
        />
      </div>

      {linkType === "url" && (
        <div className="form-check mb-3">
          <input
            id="new-link-new-window"
            type="checkbox"
            className="form-check-input"
            checked={newWindow}
            onChange={(event) => onNewWindowChange(event.target.checked)}
          />

          <label htmlFor="new-link-new-window" className="form-check-label">
            새 창에서 열기
          </label>
        </div>
      )}
    </>
  );
}

export default LinkFields;
