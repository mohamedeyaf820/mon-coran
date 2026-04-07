import React from "react";

export default function ModeNavigation({
  className,
  buttonClassName,
  previousLabel,
  nextLabel,
  previousDisabled,
  nextDisabled,
  onPrevious,
  onNext,
  centerContent = null,
  lang,
}) {
  return (
    <div className={className}>
      <button
        className={buttonClassName}
        onClick={onPrevious}
        disabled={previousDisabled}
      >
        <i className={`fas fa-arrow-${lang === "ar" ? "right" : "left"}`}></i>
        {previousLabel}
      </button>
      {centerContent}
      <button
        className={buttonClassName}
        onClick={onNext}
        disabled={nextDisabled}
      >
        {nextLabel}
        <i className={`fas fa-arrow-${lang === "ar" ? "left" : "right"}`}></i>
      </button>
    </div>
  );
}
