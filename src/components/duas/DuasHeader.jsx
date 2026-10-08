import React from "react";
import { ArrowLeft, ArrowRight, Home } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { t } from "../../i18n";
import DuasLink from "./DuasLink";

/**
 * Hero of every invocations page: title, one line of context, a way back
 * (home from the hub, the parent page from the others) and the page tools.
 * The title takes focus when the page changes so a keyboard or screen reader
 * user lands on the new page, not on the link they just used.
 */
export default function DuasHeader({ lang, title, subtitle, back, headingRef, children }) {
  const { set } = useApp();
  const BackIcon = lang === "ar" ? ArrowRight : ArrowLeft;

  return (
    <section className="duas-hero">
      <div className="duas-hero-head">
        <div className="duas-hero-content">
          <h1 className="duas-title" ref={headingRef} tabIndex={-1}>
            {title}
          </h1>
          {subtitle && <p className="duas-subtitle">{subtitle}</p>}
        </div>

        {back ? (
          <DuasLink to={back.to} className="duas-back-btn">
            <BackIcon size={16} aria-hidden="true" />
            {back.label}
          </DuasLink>
        ) : (
          <button
            className="duas-back-btn"
            onClick={() => set({ showDuas: false, showHome: true })}
            type="button"
          >
            <Home size={16} aria-hidden="true" />
            {t("duas.back", lang)}
          </button>
        )}
      </div>

      {children && <div className="duas-tools">{children}</div>}
    </section>
  );
}
