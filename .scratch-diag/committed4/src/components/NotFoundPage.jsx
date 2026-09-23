import React from "react";
import { ArrowLeft, SearchX } from "lucide-react";
import { useAppActions, useAppLocale } from "../context/AppContext";
import { t } from "../i18n";
import "../styles/domains/not-found-page.css";

export default function NotFoundPage() {
  const { lang } = useAppLocale();
  const { set } = useAppActions();

  const goHome = () => {
    window.history.pushState(null, "", "/");
    set({
      legalPage: null,
      routeNotFound: false,
      showDuas: false,
      showHome: true,
    });
  };

  return (
    <article className="not-found-page">
      <div className="not-found-page__icon" aria-hidden="true">
        <SearchX size={24} />
      </div>
      <p className="not-found-page__eyebrow">{t("notFound.eyebrow", lang)}</p>
      <h1>{t("notFound.title", lang)}</h1>
      <p>{t("notFound.body", lang)}</p>
      <button type="button" onClick={goHome}>
        <ArrowLeft size={16} aria-hidden="true" />
        {t("notFound.action", lang)}
      </button>
    </article>
  );
}
