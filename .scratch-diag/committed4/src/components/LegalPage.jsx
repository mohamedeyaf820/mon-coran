import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  BookOpenText,
  CircleUserRound,
  Database,
  ExternalLink,
  FileCheck2,
  Github,
  Globe2,
  Loader2,
  RefreshCw,
  Scale,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useAppActions, useAppLocale } from "../context/AppContext";
import { Modal } from "./ui/modal";
import siteConfig from "../../site.config.json";
import { CONTENT_ATTRIBUTIONS } from "../data/contentAttributions";
import "../styles/domains/legal-page.css";

const PAGE_KEYS = ["about", "privacy", "legal", "sources"];
const PAGE_ICONS = {
  about: CircleUserRound,
  privacy: ShieldCheck,
  legal: Scale,
  sources: Database,
};
const TRUST_ICONS = [BookOpenText, ShieldCheck];

const REPORT_COPY = {
  fr: {
    title: "Signaler une correction",
    intro: "Décrivez précisément le problème. Un ticket prérempli s’ouvrira sur le dépôt officiel afin que le signalement puisse être suivi et corrigé.",
    category: "Type de problème",
    categories: ["Texte coranique", "Traduction", "Audio", "Affichage", "Accessibilité", "Autre"],
    location: "Page ou référence concernée",
    locationPlaceholder: "Ex. Sourate 3, verset 7 — mode Mushaf",
    details: "Description",
    detailsPlaceholder: "Décrivez ce qui est incorrect et le résultat attendu…",
    privacy: "Aucune donnée n’est envoyée automatiquement. Vous pourrez relire le rapport avant de le publier sur GitHub.",
    cancel: "Annuler",
    submit: "Continuer sur GitHub",
  },
  en: {
    title: "Report a correction",
    intro: "Describe the issue precisely. A pre-filled ticket will open in the official repository so it can be tracked and corrected.",
    category: "Issue type",
    categories: ["Quran text", "Translation", "Audio", "Display", "Accessibility", "Other"],
    location: "Affected page or reference",
    locationPlaceholder: "E.g. Surah 3, verse 7 — Mushaf mode",
    details: "Description",
    detailsPlaceholder: "Describe what is wrong and what you expected…",
    privacy: "Nothing is sent automatically. You can review the report before publishing it on GitHub.",
    cancel: "Cancel",
    submit: "Continue on GitHub",
  },
  ar: {
    title: "الإبلاغ عن تصحيح",
    intro: "صِف المشكلة بدقة. سيُفتح بلاغ مُعبأ مسبقاً في المستودع الرسمي لمتابعته وتصحيحه.",
    category: "نوع المشكلة",
    categories: ["النص القرآني", "الترجمة", "الصوت", "العرض", "إتاحة الاستخدام", "أخرى"],
    location: "الصفحة أو المرجع",
    locationPlaceholder: "مثال: سورة 3، الآية 7 — وضع المصحف",
    details: "الوصف",
    detailsPlaceholder: "اشرح الخطأ والنتيجة الصحيحة المتوقعة…",
    privacy: "لا تُرسل أي بيانات تلقائياً. يمكنك مراجعة البلاغ قبل نشره على GitHub.",
    cancel: "إلغاء",
    submit: "المتابعة على GitHub",
  },
};

const COPY = {
  fr: {
    eyebrow: "Bibliothèque & transparence",
    back: "Retour à l’accueil",
    open: "Ouvrir",
    tabs: {
      about: "À propos",
      privacy: "Confidentialité",
      legal: "Mentions légales",
      sources: "Sources",
    },
    about: {
      title: "Un compagnon de lecture sobre, utile et vérifiable",
      intro: "MushafPlus est une application coranique indépendante consacrée à la lecture, à l’écoute et à l’étude du Coran, sans compte obligatoire.",
      trust: ["Hafs & Warsh", "Récitations & tajwid"],
      sections: [
        ["Notre intention", "Rassembler dans une interface calme les fonctions essentielles à une lecture régulière : textes Hafs et Warsh, traductions, récitations, Tajwid, favoris et notes."],
        ["Dans l’application", "Lecture en page Mushaf ou en flux continu, deux riwayas, traductions, récitations verset par verset, recherche, favoris, notes, listes de lecture et outils de mémorisation."],
        ["Nos principes", "Respect du texte, clarté des sources, confidentialité locale, accessibilité et amélioration continue. Les fonctions pédagogiques complètent la lecture ; elles ne remplacent pas un enseignant qualifié."],
        ["Hors ligne", "MushafPlus s’installe comme application web et continue de fonctionner hors ligne une fois les textes et récitations mis en cache sur l’appareil."],
        ["Responsable du projet", `${siteConfig.projectOwner} dirige le projet ${siteConfig.brandName}. Le code, l’historique des changements et les signalements sont accessibles depuis le dépôt public.`],
        ["Corrections et version", `Version ${siteConfig.version}, mise à jour le ${siteConfig.lastUpdated}. Toute erreur signalée est vérifiée, documentée puis intégrée dans une version ultérieure.`],
      ],
    },
    privacy: {
      title: "Vos données de lecture restent d’abord sur votre appareil",
      intro: "MushafPlus fonctionne sans compte et sans profil public. Les données personnelles de lecture sont stockées localement dans votre navigateur.",
      trust: ["Sans compte", "Aucun traceur"],
      sections: [
        ["Ce qui est conservé", "Préférences, dernière position, favoris et notes sont enregistrés dans localStorage ou IndexedDB. Une protection locale par phrase secrète peut être activée."],
        ["Aucun compte, aucun traceur", "MushafPlus n’utilise aucun service de mesure d’audience, régie publicitaire ou traceur tiers, et n’envoie aucune statistique d’usage vers un serveur."],
        ["Services externes", "Le texte, les traductions et les récitations peuvent provenir d’API ou de CDN tiers. Ces fournisseurs reçoivent les informations réseau indispensables à une requête web, notamment l’adresse IP."],
        ["Autorisations", "Le microphone n’est demandé qu’au lancement volontaire de la recherche vocale. MushafPlus ne conserve aucun enregistrement vocal."],
        ["Vos données, vos contrôles", "Vous pouvez exporter favoris, notes, listes et réglages au format JSON, ou effacer définitivement toutes les données locales depuis l’application. Aucune synchronisation cloud automatique n’est effectuée."],
        ["Durée de conservation", "Les données restent sur l’appareil jusqu’à ce que vous les supprimiez ou vidiez le stockage du navigateur. Le cache hors ligne se renouvelle à chaque mise à jour."],
      ],
    },
    legal: {
      title: "Informations de publication et cadre d’utilisation",
      intro: "Cette page identifie clairement le projet, son hébergement et les limites d’un service éducatif qui agrège des contenus tiers.",
      trust: ["Projet indépendant", "Usage personnel"],
      sections: [
        ["Éditeur et contact", `${siteConfig.brandName} est un projet indépendant porté par ${siteConfig.projectOwner}. Les demandes, corrections et signalements sont reçus publiquement via GitHub Issues.`],
        ["Hébergement et disponibilité", `L’adresse canonique configurée est ${new URL(siteConfig.siteUrl).hostname}. Les versions de production et d’aperçu sont distribuées sur une infrastructure Vercel ; l’hébergeur traite les journaux techniques nécessaires à la sécurité et à la disponibilité du service.`],
        ["Conditions d’utilisation", "L’application est mise à disposition gratuitement pour un usage personnel de lecture et d’étude. Vous vous engagez à respecter les droits des fournisseurs de contenus et à ne réutiliser aucun texte, traduction ou récitation en violation de leur licence."],
        ["Responsabilité", "L’application fournit des outils de lecture et d’étude. Elle ne remplace pas une édition certifiée du Mushaf, l’accompagnement d’un enseignant qualifié ni un avis religieux, médical ou juridique."],
        ["Propriété intellectuelle", "Les textes, traductions, polices, photographies et récitations tiers restent soumis aux droits de leurs auteurs et fournisseurs. MushafPlus ne revendique aucun droit sur ces contenus."],
        ["Garantie et évolution", "Le service est fourni « en l’état », à partir de sources tierces pouvant évoluer. Cette page peut être mise à jour ; sa version suit celle de l’application."],
      ],
    },
    sources: {
      title: "Des sources nommées, consultables et attribuées",
      intro: "Chaque famille de contenu est reliée à son fournisseur. Une source de secours compatible peut être utilisée si le service principal est indisponible.",
      trust: ["Texte & traduction", "Récitations"],
      sections: [
        ["Textes et structure", "Quran Foundation / Quran.com et AlQuran Cloud fournissent selon les écrans les versets, traductions et métadonnées. Tanzil sert de référence documentée pour le contrôle du texte."],
        ["Traductions", "Les traductions française (Montada 2017) et anglaise (Pickthall 1930) sont rattachées à leur édition et présentées comme des sens approximatifs, non comme une exégèse."],
        ["Récitations", "EveryAyah, le CDN audio de Quran.com et QuranPedia (Warsh) fournissent les récitations verset par verset, selon le récitateur et la riwaya. QuranicAudio sert de miroir de secours."],
        ["Warsh", "Le texte Unicode Warsh et les catalogues audio sont traités séparément de Hafs. Les profils indiquent la riwaya et la provenance afin d’éviter un mélange de récitations."],
        ["Polices et portraits", "Les polices coraniques et portraits restent attribués à leurs fournisseurs. Un avatar neutre est affiché lorsque la photographie n’est pas disponible ou vérifiée."],
        ["Vérification et signalement", "Chaque source est testée et documentée, et une bascule automatique vers un miroir compatible opère en cas d’indisponibilité. Une erreur d’attribution peut être signalée, vérifiée puis corrigée."],
      ],
      register: "Registre des contenus tiers",
      registerIntro: "Usage dans l’application, conditions connues et accès direct à la source.",
    },
    actions: {
      project: "Voir le projet sur GitHub",
      correction: "Signaler une correction",
      home: "Revenir à l’accueil",
    },
  },
};

// Non-French body copy is fetched from /data/editorial-copy.json so this
// rarely opened screen stays out of the JavaScript budget. That dataset is
// precached by the service worker (public/sw.js) and is the only place the
// English and Arabic text is maintained.
//
// These chrome strings must render even when that fetch is pending or has
// failed, so they stay bundled in all three languages. Never fall back to
// another language for the body copy: a failed request shows an error and a
// retry, and reading the French original stays an explicit user choice.
const CHROME_COPY = {
  fr: {
    back: "Retour à l’accueil",
    eyebrow: "Bibliothèque & transparence",
    loadingTitle: "Chargement de cette page",
    loadingHint: "Le texte se charge une seule fois puis reste disponible hors ligne.",
    errorTitle: "Texte indisponible",
    errorHint: "Le texte de cette page n’a pas pu être chargé. Vérifiez la connexion, puis réessayez.",
    retry: "Réessayer",
    original: "Lire la version française d’origine",
    originalHint: "Cette page est affichée dans sa langue d’origine, faute de traduction chargée.",
    contact: "Nous contacter",
  },
  en: {
    back: "Back to home",
    eyebrow: "Library & transparency",
    loadingTitle: "Loading this page",
    loadingHint: "The text loads once and then stays available offline.",
    errorTitle: "Text unavailable",
    errorHint: "This page's text could not be loaded. Check your connection, then try again.",
    retry: "Try again",
    original: "Read the original French version",
    originalHint: "This page is shown in its original language because the translation could not be loaded.",
    contact: "Contact us",
  },
  ar: {
    back: "العودة إلى الرئيسية",
    eyebrow: "المكتبة والشفافية",
    loadingTitle: "جارٍ تحميل هذه الصفحة",
    loadingHint: "يُحمَّل النص مرة واحدة ثم يبقى متاحاً دون اتصال.",
    errorTitle: "النص غير متاح",
    errorHint: "تعذّر تحميل نص هذه الصفحة. تحقق من الاتصال ثم أعد المحاولة.",
    retry: "إعادة المحاولة",
    original: "قراءة النسخة الفرنسية الأصلية",
    originalHint: "تُعرض هذه الصفحة بلغتها الأصلية لأن الترجمة لم تُحمَّل.",
    contact: "تواصل معنا",
  },
};

function hasCompleteLocaleCopy(localeCopy) {
  return Boolean(
    localeCopy &&
      PAGE_KEYS.every(
        (key) =>
          Array.isArray(localeCopy[key]?.sections) &&
          localeCopy[key]?.title &&
          localeCopy[key]?.intro &&
          localeCopy.tabs?.[key],
      ),
  );
}

export default function LegalPage({ page = "privacy" }) {
  const { lang } = useAppLocale();
  const { set } = useAppActions();
  const [translatedCopy, setTranslatedCopy] = useState(null);
  const [copyStatus, setCopyStatus] = useState(() =>
    lang === "fr" ? "ready" : "loading",
  );
  const [copyAttempt, setCopyAttempt] = useState(0);
  const [showOriginal, setShowOriginal] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [report, setReport] = useState({ category: "", location: "", details: "" });
  const shell = CHROME_COPY[lang] || CHROME_COPY.fr;
  const locale = lang === "fr" || showOriginal ? COPY.fr : translatedCopy;
  const reportCopy = REPORT_COPY[lang] || REPORT_COPY.fr;
  const activePage = PAGE_KEYS.includes(page) ? page : "privacy";
  const content = locale?.[activePage];
  const ActiveIcon = PAGE_ICONS[activePage];
  // Page-specific trust chips come from the copy; a stale cached dataset
  // falls back to the two generic, always-true chips.
  const defaultTrust = lang === "ar"
    ? ["114 سورة", "بيانات محلية"]
    : lang === "en"
      ? ["114 surahs", "Local-first data"]
      : ["114 sourates", "Données locales"];

  useEffect(() => {
    setShowOriginal(false);
    if (lang === "fr") {
      setTranslatedCopy(null);
      setCopyStatus("ready");
      return undefined;
    }
    let cancelled = false;
    setCopyStatus("loading");
    fetch("/data/editorial-copy.json")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (cancelled) return;
        if (hasCompleteLocaleCopy(data?.[lang])) {
          setTranslatedCopy(data[lang]);
          setCopyStatus("ready");
        } else {
          setTranslatedCopy(null);
          setCopyStatus("error");
        }
      })
      .catch(() => {
        if (!cancelled) setCopyStatus("error");
      });
    return () => { cancelled = true; };
  }, [lang, copyAttempt]);

  const retryCopy = () => setCopyAttempt((attempt) => attempt + 1);

  const scrollMainTop = () => {
    const main = document.querySelector("#main-content");
    if (main) main.scrollTo({ top: 0, behavior: "smooth" });
    else window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const navigate = (nextPage) => {
    set({ legalPage: nextPage, showHome: false, showDuas: false });
    scrollMainTop();
  };

  const goHome = () => {
    set({ legalPage: null, showHome: true, showDuas: false });
    scrollMainTop();
  };

  const openReport = () => {
    setReport((current) => ({
      category: current.category || reportCopy.categories[0],
      location: current.location || (typeof window !== "undefined" ? window.location.pathname : ""),
      details: current.details,
    }));
    setReportOpen(true);
  };

  const submitReport = (event) => {
    event.preventDefault();
    const repository = siteConfig.repositoryUrl.replace(/\/$/, "");
    const issueUrl = new URL(`${repository}/issues/new`);
    const location = report.location.trim() || (typeof window !== "undefined" ? window.location.pathname : "MushafPlus");
    const body = [
      "## Signalement",
      "",
      `- **Catégorie :** ${report.category}`,
      `- **Page / référence :** ${location}`,
      `- **Version :** ${siteConfig.version}`,
      "",
      "## Description",
      "",
      report.details.trim(),
      "",
      "---",
      "Rapport préparé depuis MushafPlus.",
    ].join("\n");
    issueUrl.searchParams.set("title", `[Correction] ${report.category} — ${location}`);
    issueUrl.searchParams.set("body", body);
    window.open(issueUrl.toString(), "_blank", "noopener,noreferrer");
    setReportOpen(false);
  };

  if (!content) {
    const isLoading = copyStatus === "loading";
    return (
      <article className="legal-page" data-page={activePage} data-copy-state={copyStatus}>
        <div className="legal-page__halo" aria-hidden="true" />
        <header className="legal-page__hero">
          <button type="button" className="legal-page__back" onClick={goHome}>
            <ArrowLeft size={16} aria-hidden="true" />
            {shell.back}
          </button>
          <div className="legal-page__hero-layout">
            <div className="legal-page__hero-heading">
              <p className="legal-page__eyebrow">{shell.eyebrow}</p>
              <h1>{isLoading ? shell.loadingTitle : shell.errorTitle}</h1>
            </div>
            <div className="legal-page__hero-summary">
              <p className="legal-page__intro" role="status" aria-busy={isLoading}>
                {isLoading ? shell.loadingHint : shell.errorHint}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {isLoading ? (
                  <span className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] px-4 text-sm font-bold text-[var(--text-muted)]">
                    <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                    {shell.loadingTitle}
                  </span>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={retryCopy}
                      className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--primary)] px-4 text-sm font-extrabold text-white"
                    >
                      <RefreshCw size={16} aria-hidden="true" />
                      {shell.retry}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowOriginal(true)}
                      className="inline-flex min-h-11 items-center rounded-xl border border-[var(--border)] px-4 text-sm font-bold text-[var(--text-secondary)]"
                    >
                      {shell.original}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>
      </article>
    );
  }

  return (
    <article className="legal-page" data-page={activePage}>
      {showOriginal && lang !== "fr" ? (
        <div
          className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-4"
          role="status"
        >
          <p className="m-0 text-sm text-[var(--text-secondary)]">{shell.originalHint}</p>
          <button
            type="button"
            onClick={() => {
              setShowOriginal(false);
              retryCopy();
            }}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] px-4 text-sm font-bold text-[var(--text-primary)]"
          >
            <RefreshCw size={16} aria-hidden="true" />
            {shell.retry}
          </button>
        </div>
      ) : null}
      <div className="legal-page__halo" aria-hidden="true" />
      <header className="legal-page__hero">
        <button type="button" className="legal-page__back" onClick={goHome}>
          <ArrowLeft size={16} aria-hidden="true" />
          {locale.back}
        </button>
        <div className="legal-page__hero-layout">
          <div className="legal-page__hero-heading">
            <div className="legal-page__hero-mark" aria-hidden="true">
              <span><ActiveIcon size={22} /></span>
              <i />
            </div>
            <p className="legal-page__eyebrow">{locale.eyebrow}</p>
            <h1>{content.title}</h1>
          </div>
          <div className="legal-page__hero-summary">
            <p className="legal-page__intro">{content.intro}</p>
            <div className="legal-page__trust" aria-label={locale.eyebrow}>
              {(content.trust?.length ? content.trust : defaultTrust).map((label, i) => {
                const TrustIcon = TRUST_ICONS[i % TRUST_ICONS.length];
                return (
                  <span key={label}><TrustIcon size={14} aria-hidden="true" /> {label}</span>
                );
              })}
              <span><FileCheck2 size={14} aria-hidden="true" /> v{siteConfig.version}</span>
            </div>
          </div>
        </div>
      </header>

      <nav className="legal-page__tabs" aria-label={locale.eyebrow}>
        {PAGE_KEYS.map((key) => {
          const Icon = PAGE_ICONS[key];
          return (
            <button key={key} type="button" className={key === activePage ? "is-active" : ""} aria-current={key === activePage ? "page" : undefined} onClick={() => navigate(key)}>
              <Icon size={16} aria-hidden="true" />
              <span>{locale.tabs[key]}</span>
            </button>
          );
        })}
      </nav>

      <div className="legal-page__grid">
        {content.sections.map(([title, body], index) => (
          <section key={title} className="legal-page__card">
            <span className="legal-page__card-index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
            <div>
              <h2>{title}</h2>
              <p>{body}</p>
            </div>
          </section>
        ))}
      </div>

      {activePage === "sources" ? (
        <section className="legal-page__attributions" aria-labelledby="attributions-title">
          <div className="legal-page__attributions-heading">
            <p><Database size={15} aria-hidden="true" /> {content.register}</p>
            <h2 id="attributions-title">{content.registerIntro}</h2>
          </div>
          <div className="legal-page__attribution-list">
            {CONTENT_ATTRIBUTIONS.map((item) => (
              <article key={item.id} className="legal-page__attribution-item">
                <span>{item.category}</span>
                <div><h3>{item.name}</h3><p>{item.usage}</p><small>{item.rights}</small></div>
                <a href={item.url} target="_blank" rel="noreferrer" aria-label={`${item.name} — source`}><ExternalLink size={16} aria-hidden="true" /></a>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <footer className="legal-page__actions">
        <div>
          <Sparkles size={17} aria-hidden="true" />
          <p>{lang === "ar" ? "هل وجدت خطأ أو نقصاً؟ ساعدنا على تحسين المشروع." : lang === "en" ? "Found an error or missing information? Help improve the project." : "Une erreur ou une information manque ? Aidez-nous à améliorer le projet."}</p>
        </div>
        <nav aria-label={locale.eyebrow}>
          <a href={siteConfig.repositoryUrl} target="_blank" rel="noopener noreferrer"><Github size={16} />{locale.actions.project}</a>
          <a href={siteConfig.contactUrl} target="_blank" rel="noopener noreferrer"><Send size={16} />{shell.contact}</a>
          <a
            className="is-primary"
            href={`${siteConfig.repositoryUrl.replace(/\/$/, "")}/issues`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(event) => {
              // The guided form prefills the issue; the link stays a real
              // GitHub destination for middle-click and assistive tech.
              event.preventDefault();
              openReport();
            }}
          >
            <FileCheck2 size={16} />
            {locale.actions.correction}
          </a>
          <button type="button" onClick={goHome}><Globe2 size={16} />{locale.actions.home}</button>
        </nav>
      </footer>

      <Modal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        title={reportCopy.title}
        size="md"
        portal
        className="legal-report-modal"
        overlayClassName="legal-report-overlay"
      >
        <form className="legal-report" onSubmit={submitReport}>
          <p className="legal-report__intro">{reportCopy.intro}</p>
          <label>
            <span>{reportCopy.category}</span>
            <select value={report.category} onChange={(event) => setReport((current) => ({ ...current, category: event.target.value }))}>
              {reportCopy.categories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
          </label>
          <label>
            <span>{reportCopy.location}</span>
            <input value={report.location} onChange={(event) => setReport((current) => ({ ...current, location: event.target.value }))} placeholder={reportCopy.locationPlaceholder} required />
          </label>
          <label>
            <span>{reportCopy.details}</span>
            <textarea value={report.details} onChange={(event) => setReport((current) => ({ ...current, details: event.target.value }))} placeholder={reportCopy.detailsPlaceholder} rows={5} required minLength={12} />
          </label>
          <p className="legal-report__privacy"><ShieldCheck size={14} aria-hidden="true" />{reportCopy.privacy}</p>
          <div className="legal-report__actions">
            <button type="button" onClick={() => setReportOpen(false)}>{reportCopy.cancel}</button>
            <button type="submit" className="is-primary"><Send size={16} aria-hidden="true" />{reportCopy.submit}</button>
          </div>
        </form>
      </Modal>
    </article>
  );
}
