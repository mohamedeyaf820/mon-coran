import React from "react";
import { ArrowLeft, SearchX } from "lucide-react";
import { useAppActions, useAppLocale } from "../context/AppContext";
import "../styles/domains/not-found-page.css";

const COPY = {
  fr: {
    eyebrow: "Erreur 404",
    title: "Cette page n’existe pas",
    body: "L’adresse demandée ne correspond à aucune sourate, page ou section publiée.",
    action: "Retour à l’accueil",
  },
  en: {
    eyebrow: "Error 404",
    title: "This page does not exist",
    body: "The requested address does not match any published surah, page or section.",
    action: "Back to home",
  },
  ar: {
    eyebrow: "خطأ 404",
    title: "هذه الصفحة غير موجودة",
    body: "العنوان المطلوب لا يطابق أي سورة أو صفحة أو قسم منشور.",
    action: "العودة إلى الرئيسية",
  },
};

export default function NotFoundPage() {
  const { lang } = useAppLocale();
  const { set } = useAppActions();
  const copy = COPY[lang] || COPY.fr;

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
      <p className="not-found-page__eyebrow">{copy.eyebrow}</p>
      <h1>{copy.title}</h1>
      <p>{copy.body}</p>
      <button type="button" onClick={goHome}>
        <ArrowLeft size={16} aria-hidden="true" />
        {copy.action}
      </button>
    </article>
  );
}
