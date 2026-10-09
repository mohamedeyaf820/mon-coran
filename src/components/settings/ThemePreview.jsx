import "../../styles/settings-theme-previews.css";

export default function ThemePreview({ themeId }) {
  return (
    <span
      className="settings-theme-preview"
      data-theme-preview={themeId}
      aria-hidden="true"
    >
      <span className="settings-theme-preview__chrome">
        <i />
        <i />
        <i />
      </span>
      <span className="settings-theme-preview__page">
        <span className="settings-theme-preview__ornament">&#x06DE;</span>
        <span className="settings-theme-preview__arabic" dir="rtl">
          {"\u0628\u0650\u0633\u0652\u0645\u0650 \u0627\u0644\u0644\u0651\u064e\u0647\u0650"}
        </span>
        <span className="settings-theme-preview__line settings-theme-preview__line--long" />
        <span className="settings-theme-preview__line settings-theme-preview__line--short" />
      </span>
    </span>
  );
}
