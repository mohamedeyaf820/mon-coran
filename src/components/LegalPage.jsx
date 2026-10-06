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
import { fetchWithTimeout } from "../services/fetchWithTimeout.js";
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
// One glyph per "at a glance" tile, in the order the copy lists them.
const HIGHLIGHT_ICONS = {
  about: [BookOpenText, Sparkles, CircleUserRound],
  privacy: [ShieldCheck, Database, FileCheck2],
  legal: [CircleUserRound, Scale, Database],
  sources: [Database, RefreshCw, FileCheck2],
};
// Register order: the text of the Quran first, then what accompanies it.
const CATEGORY_ORDER = ["text", "api", "translation", "transliteration", "tafsir", "duas", "audio", "font", "image", "annotation"];

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
      highlights: [
        ["Hafs et Warsh", "Deux riwayas, chacune avec son texte et ses récitations."],
        ["Lire, écouter, étudier", "Mushaf ou flux continu, récitations verset par verset, tajwid, traductions et tafsir."],
        ["Sans compte", "Favoris, notes et réglages restent sur votre appareil."],
      ],
      sections: [
        ["Notre intention", "Rassembler dans une interface calme les fonctions essentielles à une lecture régulière : textes Hafs et Warsh, traductions, récitations, Tajwid, favoris et notes."],
        ["Dans l’application", "Lecture en page Mushaf ou en flux continu, deux riwayas (Hafs et Warsh), traductions, tafsir, récitations verset par verset avec téléchargement hors connexion, tajwid en couleurs, recherche, favoris, notes, listes de lecture, outils de mémorisation, horaires de prière avec adhan et invocations tirées de Hisn al-Muslim."],
        ["Nos principes", "Respect du texte, clarté des sources, confidentialité locale, accessibilité et amélioration continue. Les fonctions pédagogiques complètent la lecture ; elles ne remplacent pas un enseignant qualifié."],
        ["Hors ligne", "MushafPlus s’installe comme application web et continue de fonctionner hors ligne une fois les textes et récitations mis en cache sur l’appareil."],
        ["Responsable du projet", `${siteConfig.projectOwner} dirige le projet ${siteConfig.brandName}. Le code, l’historique des changements et les signalements sont accessibles depuis le dépôt public.`],
        ["Corrections et version", "Version {version}, mise à jour le {date}. Toute erreur signalée est vérifiée, documentée puis intégrée dans une version ultérieure."],
      ],
    },
    privacy: {
      title: "Vos données de lecture restent d’abord sur votre appareil",
      intro: "MushafPlus fonctionne sans compte et sans profil public. Les données personnelles de lecture sont stockées localement dans votre navigateur.",
      trust: ["Sans compte", "Aucun traceur"],
      highlights: [
        ["Sans compte ni traceur", "Aucune mesure d’audience, aucune publicité."],
        ["Données sur votre appareil", "Réglages, favoris et notes restent dans votre navigateur."],
        ["Vous gardez la main", "Export, protection par phrase secrète, suppression complète."],
      ],
      dataMap: {
        title: "Ce qui est enregistré, et où",
        intro: "Tout ce que MushafPlus conserve se trouve sur cet appareil. Rien n’est copié sur un serveur du projet.",
        columns: ["Donnée", "Emplacement", "Ce que vous pouvez faire"],
        rows: [
          ["Réglages et position de lecture", "localStorage", "Exporter, protéger, tout supprimer"],
          ["Journal d’erreurs et mesures de performance", "localStorage", "Tout supprimer"],
          ["Favoris, notes et listes d’écoute", "IndexedDB", "Exporter en JSON, tout supprimer"],
          ["Textes et traductions déjà lus", "IndexedDB (cache)", "Vider le cache"],
          ["Récitations téléchargées", "Cache Storage", "Supprimer les téléchargements"],
          ["Position pour les horaires de prière", "Réglages (arrondie à environ 10 m)", "Tout supprimer"],
        ],
        manage: "Gérer mes données",
      },
      sections: [
        ["Ce qui est conservé", "Préférences, dernière position, favoris et notes sont enregistrés dans localStorage ou IndexedDB. Les récitations téléchargées sont conservées dans le stockage du navigateur. Un journal local des erreurs et des mesures de performance reste lui aussi sur l’appareil et n’est jamais envoyé. Une protection locale par phrase secrète peut être activée."],
        ["Aucun compte, aucun traceur", "MushafPlus n’utilise aucun service de mesure d’audience, régie publicitaire ou traceur tiers, et n’envoie aucune statistique d’usage vers un serveur."],
        ["Services externes", "Le texte, les traductions, les tafsirs, les récitations et les horaires de prière proviennent de services tiers nommés dans Sources (Quran.com, AlQuran Cloud, QuranEnc, EveryAyah, Quranpedia, MP3Quran, Aladhan…). Ils reçoivent les informations réseau indispensables à une requête web, notamment l’adresse IP. Pour les horaires de prière, les coordonnées choisies (votre position ou une ville), arrondies à environ 10 m, sont envoyées au service Aladhan. Un signalement d’erreur n’est transmis à GitHub que lorsque vous le publiez vous-même."],
        ["Autorisations", "Le microphone n’est demandé qu’au lancement volontaire de la recherche vocale, et aucun enregistrement vocal n’est conservé. La position n’est demandée que lorsque vous la demandez dans l’onglet Prière des réglages. Les notifications ne s’activent que sur votre demande."],
        ["Vos données, vos contrôles", "Dans les réglages, onglet Données, vous pouvez exporter favoris, notes, listes et réglages au format JSON, ou effacer définitivement toutes les données locales. Aucune synchronisation cloud automatique n’est effectuée."],
        ["Durée de conservation", "Les données restent sur l’appareil jusqu’à ce que vous les supprimiez ou vidiez le stockage du navigateur. Le cache hors ligne se renouvelle à chaque mise à jour."],
      ],
    },
    legal: {
      title: "Informations de publication et cadre d’utilisation",
      intro: "Cette page identifie clairement le projet, son hébergement et les limites d’un service éducatif qui agrège des contenus tiers.",
      trust: ["Projet indépendant", "Usage personnel"],
      highlights: [
        ["Projet indépendant", "Code et signalements publics sur GitHub."],
        ["Usage personnel", "Gratuit, pour la lecture et l’étude."],
        ["Contenus tiers", "Chaque texte, traduction et récitation reste soumis à ses droits."],
      ],
      sections: [
        ["Éditeur et contact", `${siteConfig.brandName} est un projet indépendant porté par ${siteConfig.projectOwner}. Les demandes, corrections et signalements sont reçus publiquement via GitHub Issues.`],
        ["Hébergement et disponibilité", `L’adresse canonique configurée est ${new URL(siteConfig.siteUrl).hostname}. L’application est déployée sur Vercel ; des versions d’aperçu destinées au développement sont aussi publiées sur Netlify. Les hébergeurs traitent les journaux techniques nécessaires à la sécurité et à la disponibilité du service.`],
        ["Conditions d’utilisation", "L’application est mise à disposition gratuitement pour un usage personnel de lecture et d’étude. Vous vous engagez à respecter les droits des fournisseurs de contenus et à ne réutiliser aucun texte, traduction ou récitation en violation de leur licence."],
        ["Responsabilité", "L’application fournit des outils de lecture et d’étude. Elle ne remplace pas une édition certifiée du Mushaf, l’accompagnement d’un enseignant qualifié ni un avis religieux, médical ou juridique."],
        ["Propriété intellectuelle", "Les textes, traductions, polices, photographies et récitations tiers restent soumis aux droits de leurs auteurs et fournisseurs. MushafPlus ne revendique aucun droit sur ces contenus. Le code source est consultable sur GitHub ; le dépôt ne déclare pas de licence, consultez-le avant toute réutilisation."],
        ["Garantie et évolution", "Le service est fourni « en l’état », à partir de sources tierces pouvant évoluer. Cette page peut être mise à jour ; sa version suit celle de l’application."],
      ],
    },
    sources: {
      title: "Des sources nommées, consultables et attribuées",
      intro: "Chaque famille de contenu est reliée à son fournisseur. Une source de secours compatible peut être utilisée si le service principal est indisponible.",
      trust: ["Texte & traduction", "Récitations"],
      highlights: [
        ["Chaque fournisseur est nommé", "Texte, traductions, récitations, polices et tafsir sont attribués."],
        ["Sources de secours", "Un miroir compatible prend le relais si le service principal est indisponible."],
        ["Conditions affichées", "Les droits et conditions connus figurent pour chaque source."],
      ],
      sections: [
        ["Textes et structure", "Quran Foundation / Quran.com et AlQuran Cloud fournissent selon les écrans les versets, traductions et métadonnées. Tanzil sert de référence documentée pour le contrôle du texte. Le texte Warsh vient de jeux de données publics sur GitHub, épinglés à une version précise et vérifiés avant usage. Le tafsir français Al-Mukhtasar (Centre Tafsir pour les études coraniques) est chargé depuis QuranEnc.com : la sourate lue y est demandée, puis conservée sur l’appareil ; les autres tafsirs viennent de Quran.com."],
        ["Traductions", "En lecture Hafs, le français est celui de la Montada Islamic Foundation et l’anglais celui de Saheeh International (via Quran.com). En lecture Warsh, le français est celui de la Montada (2017) et l’anglais celui de Pickthall (1930). L’espagnol (Cortes), l’allemand (Abu Rida), le turc (Diyanet) et l’ourdou (Junagarhi) viennent d’AlQuran Cloud. Chaque traduction est rattachée à son édition et présentée comme un sens approximatif, non comme une exégèse."],
        ["Récitations", "EveryAyah, le CDN audio de Quran.com et QuranPedia (Warsh) fournissent les récitations verset par verset, selon le récitateur et la riwaya ; MP3Quran fournit quelques récitations de sourates entières. QuranicAudio sert de miroir de secours."],
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
    toc: "Sur cette page",
    glance: "En bref",
    updated: "Mise à jour le",
    version: "Version",
    help: "Une erreur ou une information manque ? Aidez-nous à améliorer le projet.",
    openSource: "Ouvrir la source",
    facts: {
      title: "Identité du service",
      publisher: "Éditeur",
      contact: "Contact",
      hosting: "Hébergement",
      address: "Adresse",
      release: "Version",
      hostingValue: "Vercel (production), Netlify (aperçus)",
    },
    categories: {
      text: "Texte coranique",
      api: "Services de données",
      translation: "Traductions",
      transliteration: "Translittération",
      tafsir: "Tafsir",
      audio: "Récitations",
      font: "Polices",
      image: "Images et portraits",
      annotation: "Annotations de tajwid",
      duas: "Invocations",
    },
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
    toc: "On this page",
    glance: "At a glance",
    updated: "Updated",
    version: "Version",
    help: "Found an error or missing information? Help improve the project.",
    openSource: "Open the source",
    facts: {
      title: "Service identity",
      publisher: "Publisher",
      contact: "Contact",
      hosting: "Hosting",
      address: "Address",
      release: "Version",
      hostingValue: "Vercel (production), Netlify (previews)",
    },
    categories: {
      text: "Quran text",
      api: "Data services",
      translation: "Translations",
      transliteration: "Transliteration",
      tafsir: "Tafsir",
      audio: "Recitations",
      font: "Fonts",
      image: "Images and portraits",
      annotation: "Tajweed annotations",
      duas: "Supplications",
    },
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
    toc: "في هذه الصفحة",
    glance: "باختصار",
    updated: "آخر تحديث",
    version: "الإصدار",
    help: "وجدت خطأً أو نقصاً؟ ساعدنا على تحسين المشروع.",
    openSource: "فتح المصدر",
    facts: {
      title: "هوية الخدمة",
      publisher: "الناشر",
      contact: "التواصل",
      hosting: "الاستضافة",
      address: "العنوان",
      release: "الإصدار",
      hostingValue: "Vercel (الإنتاج)، Netlify (المعاينات)",
    },
    categories: {
      text: "النص القرآني",
      api: "خدمات البيانات",
      translation: "الترجمات",
      transliteration: "النقل الحرفي",
      tafsir: "التفسير",
      audio: "التلاوات",
      font: "الخطوط",
      image: "الصور",
      annotation: "علامات التجويد",
      duas: "الأدعية",
    },
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

// Version and date are filled in at render, so no translated copy can go stale.
const fillRelease = (text, lang) => String(text).replace("{version}", siteConfig.version).replace("{date}", formatReleaseDate(lang));

function formatReleaseDate(lang) {
  const date = new Date(siteConfig.lastUpdated);
  if (Number.isNaN(date.getTime())) return siteConfig.lastUpdated;
  try {
    return date.toLocaleDateString(lang, { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return siteConfig.lastUpdated;
  }
}

// What the privacy page promises, laid out as a table: which data, where it
// lives, what the reader can do with it. A stale cached dataset without it
// simply shows the prose sections.
function DataMap({ map, onManage }) {
  if (!Array.isArray(map?.rows) || !map.rows.length) return null;
  return (
    <section className="legal-page__datamap" aria-labelledby="legal-datamap-title">
      <div className="legal-page__block-heading">
        <h2 id="legal-datamap-title">{map.title}</h2>
        <p>{map.intro}</p>
      </div>
      <div className="legal-page__table-wrap">
        <table>
          <thead>
            <tr>{map.columns.map((column) => <th key={column} scope="col">{column}</th>)}</tr>
          </thead>
          <tbody>
            {map.rows.map(([what, where, control]) => (
              <tr key={what}>
                <th scope="row">{what}</th>
                <td data-label={map.columns[1]}><code>{where}</code></td>
                <td data-label={map.columns[2]}>{control}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {map.manage ? (
        <button type="button" className="legal-page__cta" onClick={onManage}>
          <ShieldCheck size={16} aria-hidden="true" />
          {map.manage}
        </button>
      ) : null}
    </section>
  );
}

function Facts({ labels, lang }) {
  const host = new URL(siteConfig.siteUrl).hostname;
  const rows = [
    [labels.publisher, siteConfig.projectOwner],
    [labels.contact, <a key="contact" href={siteConfig.contactUrl} target="_blank" rel="noopener noreferrer">GitHub Issues</a>],
    [labels.hosting, labels.hostingValue],
    [labels.address, <bdi key="host" dir="ltr">{host}</bdi>],
    [labels.release, <bdi key="release" dir="ltr">v{siteConfig.version} · {formatReleaseDate(lang)}</bdi>],
  ];
  return (
    <section className="legal-page__facts" aria-labelledby="legal-facts-title">
      <h2 id="legal-facts-title">{labels.title}</h2>
      <dl>
        {rows.map(([term, value]) => (
          <div key={term}><dt>{term}</dt><dd>{value}</dd></div>
        ))}
      </dl>
    </section>
  );
}

// The third-party register, grouped by what the content is for. The data lives
// in contentAttributions.js; only the grouping and labels are presentation.
function SourceRegister({ content, shell }) {
  const groups = CATEGORY_ORDER
    .map((category) => ({ category, items: CONTENT_ATTRIBUTIONS.filter((item) => item.category === category) }))
    .filter((group) => group.items.length);
  return (
    <section className="legal-page__attributions" aria-labelledby="attributions-title">
      <div className="legal-page__block-heading">
        <p><Database size={15} aria-hidden="true" /> {content.register}</p>
        <h2 id="attributions-title">{content.registerIntro}</h2>
      </div>
      {groups.map(({ category, items }) => (
        <div key={category} className="legal-page__source-group">
          <h3>{shell.categories[category] || category} <span>{items.length}</span></h3>
          <ul>
            {items.map((item) => (
              <li key={item.id} className="legal-page__attribution-item">
                <div>
                  <h4>{item.name}</h4>
                  <p>{item.usage}</p>
                  <small>{item.rights}</small>
                </div>
                <a href={item.url} target="_blank" rel="noopener noreferrer" aria-label={`${shell.openSource} — ${item.name}`}>
                  <ExternalLink size={16} aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
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
    // 8 s bounds the same-origin editorial copy fetch so a stalled response
    // lands in the retryable "error" state instead of a permanent "loading".
    fetchWithTimeout("/data/editorial-copy.json", {}, 8000)
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
    if (main) main.scrollTo({ top: 0, behavior: "instant" });
    else window.scrollTo({ top: 0, behavior: "instant" });
  };

  const navigate = (nextPage) => {
    set({ legalPage: nextPage, showHome: false, showDuas: false });
    scrollMainTop();
  };

  const goHome = () => {
    set({ legalPage: null, showHome: true, showDuas: false });
    scrollMainTop();
  };

  const jumpTo = (event, id) => {
    event.preventDefault();
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    document.getElementById(id)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };

  const manageData = () => set({ settingsActiveTab: "privacy", settingsOpen: true });

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
            <div className="legal-page__eyebrow-row">
              <div className="legal-page__hero-mark" aria-hidden="true">
                <span><ActiveIcon size={18} /></span>
              </div>
              <p className="legal-page__eyebrow">{locale.eyebrow}</p>
            </div>
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
              <span><FileCheck2 size={14} aria-hidden="true" /> <bdi dir="ltr">v{siteConfig.version}</bdi> · {shell.updated} {formatReleaseDate(lang)}</span>
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

      {Array.isArray(content.highlights) && content.highlights.length ? (
        <section className="legal-page__glance" aria-label={shell.glance}>
          <ul>
            {content.highlights.map(([title, body], index) => {
              const GlanceIcon = HIGHLIGHT_ICONS[activePage]?.[index] || Sparkles;
              return (
                <li key={title}>
                  <span aria-hidden="true"><GlanceIcon size={18} /></span>
                  <div><strong>{title}</strong><p>{body}</p></div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <div className="legal-page__layout">
        <aside className="legal-page__toc">
          <nav aria-label={shell.toc}>
            <p>{shell.toc}</p>
            <ol>
              {content.sections.map(([title], index) => (
                <li key={title}>
                  <a href={`#${activePage}-${index + 1}`} onClick={(event) => jumpTo(event, `${activePage}-${index + 1}`)}>
                    <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                    {title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </aside>

        <div className="legal-page__body">
          {activePage === "privacy" ? <DataMap map={content.dataMap} onManage={manageData} /> : null}
          {activePage === "legal" ? <Facts labels={shell.facts} lang={lang} /> : null}

          {content.sections.map(([title, body], index) => (
            <section key={title} id={`${activePage}-${index + 1}`} className="legal-page__section" aria-labelledby={`${activePage}-${index + 1}-title`}>
              <header className="legal-page__section-head">
                <span className="legal-page__section-index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                <h2 id={`${activePage}-${index + 1}-title`}>{title}</h2>
              </header>
              <p>{fillRelease(body, lang)}</p>
            </section>
          ))}

          {activePage === "sources" ? <SourceRegister content={content} shell={shell} /> : null}
        </div>
      </div>

      <footer className="legal-page__actions">
        <div>
          <Sparkles size={17} aria-hidden="true" />
          <p id="legal-actions-title">{shell.help}</p>
        </div>
        <nav aria-labelledby="legal-actions-title">
          <a href={siteConfig.repositoryUrl} target="_blank" rel="noopener noreferrer"><Github size={16} aria-hidden="true" />{locale.actions.project}</a>
          <a href={siteConfig.contactUrl} target="_blank" rel="noopener noreferrer"><Send size={16} aria-hidden="true" />{shell.contact}</a>
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
            <FileCheck2 size={16} aria-hidden="true" />
            {locale.actions.correction}
          </a>
          <button type="button" onClick={goHome}><Globe2 size={16} aria-hidden="true" />{locale.actions.home}</button>
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
