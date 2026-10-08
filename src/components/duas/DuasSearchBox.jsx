import React from "react";
import { Search } from "lucide-react";
import { hubText } from "../../utils/duasHubText";

export default function DuasSearchBox({ lang, value, onChange, inputRef }) {
  return (
    <label className="duas-search-wrap">
      <Search size={16} aria-hidden="true" />
      <input
        ref={inputRef}
        type="text"
        className="duas-search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={hubText("searchPlaceholder", lang)}
        aria-label={hubText("searchLabel", lang)}
        enterKeyHint="search"
        autoComplete="off"
      />
    </label>
  );
}
