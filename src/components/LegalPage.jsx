import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpenText,
  CircleUserRound,
  Database,
  ExternalLink,
  FileCheck2,
  Github,
  Globe2,
  ListOrdered,
  Search,
  Scale,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useAppActions, useAppLocale } from "../context/AppContext";
import SURAHS from "../data/surahs";
import siteConfig from "../../site.config.json";
import { CONTENT_ATTRIBUTIONS } from "../data/contentAttributions";
import "../styles/domains/legal-page.css";

const PAGE_KEYS = ["surahs", "about", "privacy", "legal", "sources"];
const PAGE_ICONS = {
  surahs: ListOrdered,
  about: CircleUserRound,
  privacy: ShieldCheck,
  legal: Scale,
  sources: Database,
};

const COPY = {
  fr: {
    eyebrow: "Bibliothèque & transparence",
    back: "Retour à l’accueil",
    open: "Ouvrir",
    tabs: {
      surahs: "Liste des sourates",
      about: "À propos",
      privacy: "Confidentialité",
      legal: "Mentions légales",
      sources: "Sources",
    },
    surahs: {
      title: "Les 114 sourates, réunies en un seul répertoire",
      intro: "Recherchez une sourate par son numéro ou son nom, puis ouvrez directement sa lecture en Hafs ou en Warsh.",
      search: "Rechercher une sourate…",
      all: "Toutes",
      meccan: "Mecquoises",
      medinan: "Médinoises",
      count: "sourates",
      ayahs: "versets",
      empty: "Aucune sourate ne correspond à cette recherche.",
    },
    about: {
      title: "Un compagnon de lecture sobre, utile et vérifiable",
      intro: "MushafPlus est une application coranique indépendante consacrée à la lecture, à l’écoute, à l’étude et à la mémorisation, sans compte obligatoire.",
      sections: [
        ["Notre intention", "Rassembler dans une interface calme les outils nécessaires à une lecture régulière : textes Hafs et Warsh, traductions, récitations, Tajwid, favoris, notes et objectifs personnels."],
        ["Nos principes", "Respect du texte, clarté des sources, confidentialité locale, accessibilité et amélioration continue. Les fonctions pédagogiques complètent la lecture ; elles ne remplacent pas un enseignant qualifié."],
        ["Responsable du projet", `${siteConfig.projectOwner} dirige le projet ${siteConfig.brandName}. Le code, l’historique des changements et les signalements sont accessibles depuis le dépôt public.`],
        ["Corrections et version", `Version ${siteConfig.version}, mise à jour le ${siteConfig.lastUpdated}. Toute erreur signalée est vérifiée, documentée puis intégrée dans une version ultérieure.`],
      ],
    },
    privacy: {
      title: "Vos données de lecture restent d’abord sur votre appareil",
      intro: "MushafPlus fonctionne sans compte et sans profil public. Les données personnelles de lecture sont stockées localement dans votre navigateur.",
      sections: [
        ["Ce qui est conservé", "Préférences, dernière position, favoris, notes, historique, mémorisation et objectifs sont enregistrés dans localStorage ou IndexedDB. Une protection locale par phrase secrète peut être activée."],
        ["Services externes", "Le texte, les traductions et les récitations peuvent provenir d’API ou de CDN tiers. Ces fournisseurs reçoivent les informations réseau indispensables à une requête web, notamment l’adresse IP. Les horaires de prière sont calculés localement."],
        ["Autorisations", "La position n’est demandée qu’après activation des horaires de prière. Le microphone n’est demandé qu’au lancement de la recherche vocale. MushafPlus ne conserve ni position précise ni enregistrement vocal."],
        ["Votre contrôle", "Vous pouvez exporter ou supprimer vos données depuis les outils de l’application ou le stockage du navigateur. Aucune synchronisation cloud automatique n’est effectuée par MushafPlus."],
      ],
    },
    legal: {
      title: "Informations de publication et cadre d’utilisation",
      intro: "Cette page identifie clairement le projet, son hébergement et les limites d’un service éducatif qui agrège des contenus tiers.",
      sections: [
        ["Éditeur et contact", `${siteConfig.brandName} est un projet indépendant porté par ${siteConfig.projectOwner}. Les demandes, corrections et signalements sont reçus publiquement via GitHub Issues.`],
        ["Hébergement", `Le site officiel est ${new URL(siteConfig.siteUrl).hostname} et est hébergé par Netlify. L’hébergeur applique ses propres conditions et journaux techniques.`],
        ["Responsabilité", "L’application fournit des outils de lecture et d’étude. Elle ne remplace pas une édition certifiée du Mushaf, l’accompagnement d’un enseignant qualifié ni un avis religieux, médical ou juridique."],
        ["Propriété intellectuelle", "Les textes, traductions, polices, photographies et récitations tiers restent soumis aux droits de leurs auteurs et fournisseurs. MushafPlus ne revendique aucun droit sur ces contenus."],
      ],
    },
    sources: {
      title: "Des sources nommées, consultables et attribuées",
      intro: "Chaque famille de contenu est reliée à son fournisseur. Une source de secours compatible peut être utilisée si le service principal est indisponible.",
      sections: [
        ["Textes et structure", "Quran Foundation / Quran.com et AlQuran Cloud fournissent selon les écrans les versets, mots, traductions et métadonnées. Tanzil sert de référence documentée pour le contrôle du texte."],
        ["Récitations", "EveryAyah, MP3Quran, QuranicAudio, Quran.com Audio et Islamic Network sont utilisés selon le récitateur, la riwaya et le mode audio disponible."],
        ["Warsh", "Le texte Unicode Warsh et les catalogues audio sont traités séparément de Hafs. Les profils indiquent la riwaya et la provenance afin d’éviter un mélange de récitations."],
        ["Polices et portraits", "Les polices coraniques et portraits restent attribués à leurs fournisseurs. Un avatar neutre est affiché lorsque la photographie n’est pas disponible ou vérifiée."],
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
  /* Non-French editorial copy is loaded from /data/editorial-copy.json so this
     rarely opened screen does not inflate the application JavaScript budget.
  en: {
    eyebrow: "Library & transparency",
    back: "Back to home",
    open: "Open",
    tabs: { surahs: "Surah list", about: "About", privacy: "Privacy", legal: "Legal notice", sources: "Sources" },
    surahs: { title: "All 114 surahs in one directory", intro: "Search by number or name, then open a surah directly in the reader.", search: "Search for a surah…", all: "All", meccan: "Meccan", medinan: "Medinan", count: "surahs", ayahs: "verses", empty: "No surah matches this search." },
    about: { title: "A calm, useful and verifiable reading companion", intro: "MushafPlus is an independent Quran app for reading, listening, study and memorization, with no required account.", sections: [["Purpose", "Bring Hafs and Warsh texts, translations, recitations, Tajweed, bookmarks, notes and personal goals into a calm reading environment."], ["Principles", "Text integrity, clear attribution, local privacy, accessibility and continuous improvement guide the project."], ["Project lead", `${siteConfig.projectOwner} leads ${siteConfig.brandName}. Code, changes and reports are available in the public repository.`], ["Corrections and version", `Version ${siteConfig.version}, updated ${siteConfig.lastUpdated}. Reports are reviewed, documented and shipped in a later release.`]] },
    privacy: { title: "Your reading data stays on your device first", intro: "MushafPlus works without an account or public profile. Personal reading data is stored in your browser.", sections: [["Stored locally", "Preferences, last position, bookmarks, notes, history, memorization and goals use localStorage or IndexedDB."], ["External services", "Text, translations and audio may be requested from third-party APIs or CDNs, which receive the network data needed to answer the request. Prayer times are computed locally."], ["Permissions", "Location is requested only for prayer times; microphone access only starts with voice search. MushafPlus stores neither precise location nor recordings."], ["Your control", "You can export or delete local data. MushafPlus performs no automatic cloud synchronization."]] },
    legal: { title: "Publishing and usage information", intro: "Clear information about the project, its hosting and the limits of an educational service using third-party content.", sections: [["Publisher and contact", `${siteConfig.brandName} is an independent project led by ${siteConfig.projectOwner}. Requests and corrections are handled through GitHub Issues.`], ["Hosting", `The official site is ${new URL(siteConfig.siteUrl).hostname}, hosted by Netlify under its own terms and technical logging practices.`], ["Responsibility", "The app does not replace a certified Mushaf edition, a qualified teacher, or religious, medical or legal advice."], ["Intellectual property", "Third-party texts, translations, fonts, photographs and recitations remain subject to their owners’ rights."]] },
    sources: { title: "Named, accessible and attributed sources", intro: "Each content family is linked to its provider, with a compatible fallback when needed.", sections: [["Text and structure", "Quran Foundation / Quran.com, AlQuran Cloud and Tanzil support text, words, translations, metadata and integrity checks."], ["Recitations", "EveryAyah, MP3Quran, QuranicAudio, Quran.com Audio and Islamic Network are used according to reciter and availability."], ["Warsh", "Warsh text and audio catalogues are kept separate from Hafs and explicitly labelled."], ["Fonts and portraits", "Quran fonts and portraits remain attributed; a neutral avatar is used when a photo is unavailable or unverified."]], register: "Third-party content register", registerIntro: "Application usage, known terms and a direct link to each source." },
    actions: { project: "View project on GitHub", correction: "Report a correction", home: "Back to home" },
  },
  ar: {
    eyebrow: "المكتبة والشفافية",
    back: "العودة إلى الرئيسية",
    open: "فتح",
    tabs: { surahs: "قائمة السور", about: "حول التطبيق", privacy: "الخصوصية", legal: "الإشعار القانوني", sources: "المصادر" },
    surahs: { title: "السور المائة والأربع عشرة في فهرس واحد", intro: "ابحث برقم السورة أو اسمها ثم افتحها مباشرة في صفحة القراءة.", search: "ابحث عن سورة…", all: "الكل", meccan: "مكية", medinan: "مدنية", count: "سورة", ayahs: "آيات", empty: "لا توجد سورة مطابقة لهذا البحث." },
    about: { title: "رفيق قراءة هادئ ونافع وموثّق", intro: "MushafPlus تطبيق قرآني مستقل للقراءة والاستماع والدراسة والحفظ من دون اشتراط حساب.", sections: [["الغاية", "جمع نصي حفص وورش والترجمات والتلاوات وأحكام التجويد والعلامات والملاحظات في بيئة قراءة هادئة."], ["المبادئ", "سلامة النص ووضوح المصادر والخصوصية المحلية وإتاحة الاستخدام والتحسين المستمر."], ["مسؤول المشروع", `يدير ${siteConfig.projectOwner} مشروع ${siteConfig.brandName}، والكود والتغييرات والبلاغات منشورة في المستودع العام.`], ["التصحيحات والإصدار", `الإصدار ${siteConfig.version}، آخر تحديث ${siteConfig.lastUpdated}. تُراجع البلاغات وتوثق قبل نشرها.`]] },
    privacy: { title: "تبقى بيانات قراءتك على جهازك أولاً", intro: "يعمل MushafPlus بلا حساب أو ملف عام، وتُحفظ بيانات القراءة الشخصية في المتصفح.", sections: [["التخزين المحلي", "تُحفظ التفضيلات وآخر موضع والعلامات والملاحظات وسجل القراءة والحفظ محلياً."], ["الخدمات الخارجية", "قد يُطلب النص والترجمات والصوت من واجهات أو شبكات خارجية تستقبل بيانات الاتصال اللازمة، أما مواقيت الصلاة فتحسب محلياً."], ["الأذونات", "لا يُطلب الموقع إلا للمواقيت ولا يُطلب الميكروفون إلا عند تشغيل البحث الصوتي، ولا يحتفظ التطبيق بتسجيل صوتي."], ["تحكمك", "يمكنك تصدير البيانات المحلية أو حذفها، ولا ينفذ التطبيق مزامنة سحابية تلقائية."]] },
    legal: { title: "معلومات النشر وإطار الاستخدام", intro: "بيان واضح للمشروع والاستضافة وحدود الخدمة التعليمية التي تستخدم محتوى من جهات أخرى.", sections: [["النشر والتواصل", `${siteConfig.brandName} مشروع مستقل يديره ${siteConfig.projectOwner}، وتُستقبل البلاغات عبر GitHub Issues.`], ["الاستضافة", `الموقع الرسمي ${new URL(siteConfig.siteUrl).hostname} مستضاف لدى Netlify وفق شروطها وسجلاتها التقنية.`], ["المسؤولية", "لا يحل التطبيق محل مصحف معتمد أو معلّم مؤهل أو فتوى أو استشارة طبية أو قانونية."], ["الحقوق", "تبقى النصوص والترجمات والخطوط والصور والتلاوات الخارجية خاضعة لحقوق أصحابها."]] },
    sources: { title: "مصادر مسماة ومتاحة ومنسوبة", intro: "ترتبط كل فئة محتوى بمصدرها وقد يستخدم بديل متوافق عند تعذر المصدر الأساسي.", sections: [["النص والبنية", "تدعم Quran Foundation وAlQuran Cloud وTanzil النص والكلمات والترجمات والبيانات والتحقق."], ["التلاوات", "تستخدم EveryAyah وMP3Quran وQuranicAudio وQuran.com Audio وIslamic Network بحسب القارئ."], ["ورش", "يُفصل نص ورش وصوته عن حفص مع إظهار الرواية والمصدر."], ["الخطوط والصور", "تبقى الخطوط والصور منسوبة إلى مزوديها ويستخدم رمز محايد عند غياب صورة موثقة."]], register: "سجل المحتوى الخارجي", registerIntro: "الاستخدام والشروط المعروفة والرابط المباشر لكل مصدر." },
    actions: { project: "المشروع على GitHub", correction: "الإبلاغ عن تصحيح", home: "العودة إلى الرئيسية" },
  },
  */
};

const normalize = (value) => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export default function LegalPage({ page = "privacy" }) {
  const { lang } = useAppLocale();
  const { set } = useAppActions();
  const [translatedCopy, setTranslatedCopy] = useState(null);
  const locale = lang === "fr" ? COPY.fr : translatedCopy || COPY.fr;
  const activePage = PAGE_KEYS.includes(page) ? page : "privacy";
  const content = locale[activePage];
  const ActiveIcon = PAGE_ICONS[activePage];
  const [query, setQuery] = useState("");
  const [revelation, setRevelation] = useState("all");

  useEffect(() => {
    if (lang === "fr") {
      setTranslatedCopy(null);
      return undefined;
    }
    let cancelled = false;
    fetch("/data/editorial-copy.json")
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        if (!cancelled && data?.[lang]) setTranslatedCopy(data[lang]);
      })
      .catch(() => null);
    return () => { cancelled = true; };
  }, [lang]);

  const filteredSurahs = useMemo(() => {
    if (activePage !== "surahs") return [];
    const needle = normalize(query);
    return SURAHS.filter((surah) => {
      const matchesType = revelation === "all" || surah.type.toLowerCase() === revelation;
      const haystack = normalize(`${surah.n} ${surah.ar} ${surah.en} ${surah.fr}`);
      return matchesType && (!needle || haystack.includes(needle));
    });
  }, [activePage, query, revelation]);

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

  const openSurah = (event, number) => {
    event.preventDefault();
    set({
      legalPage: null,
      showHome: false,
      showDuas: false,
      displayMode: "surah",
      currentSurah: number,
      currentAyah: 1,
    });
    scrollMainTop();
  };

  return (
    <article className="legal-page" data-page={activePage}>
      <div className="legal-page__halo" aria-hidden="true" />
      <header className="legal-page__hero">
        <button type="button" className="legal-page__back" onClick={goHome}>
          <ArrowLeft size={16} aria-hidden="true" />
          {locale.back}
        </button>
        <div className="legal-page__hero-mark" aria-hidden="true">
          <span><ActiveIcon size={25} /></span>
          <i />
        </div>
        <p className="legal-page__eyebrow">{locale.eyebrow}</p>
        <h1>{content.title}</h1>
        <p className="legal-page__intro">{content.intro}</p>
        <div className="legal-page__trust" aria-label={locale.eyebrow}>
          <span><BookOpenText size={14} /> 114 {locale.surahs.count}</span>
          <span><ShieldCheck size={14} /> {lang === "ar" ? "بيانات محلية" : lang === "en" ? "Local-first data" : "Données locales"}</span>
          <span><FileCheck2 size={14} /> v{siteConfig.version}</span>
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

      {activePage === "surahs" ? (
        <section className="surah-directory" aria-labelledby="surah-directory-title">
          <div className="surah-directory__toolbar">
            <div>
              <p>{filteredSurahs.length} / 114</p>
              <h2 id="surah-directory-title">{locale.tabs.surahs}</h2>
            </div>
            <label className="surah-directory__search">
              <Search size={17} aria-hidden="true" />
              <span className="sr-only">{content.search}</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={content.search} type="search" />
            </label>
            <div className="surah-directory__filters" role="group" aria-label={content.count}>
              {[
                ["all", content.all],
                ["meccan", content.meccan],
                ["medinan", content.medinan],
              ].map(([value, label]) => (
                <button key={value} type="button" className={revelation === value ? "is-active" : ""} aria-pressed={revelation === value} onClick={() => setRevelation(value)}>{label}</button>
              ))}
            </div>
          </div>

          {filteredSurahs.length ? (
            <ol className="surah-directory__grid">
              {filteredSurahs.map((surah) => (
                <li key={surah.n}>
                  <a href={`/surah/${surah.n}`} onClick={(event) => openSurah(event, surah.n)}>
                    <span className="surah-directory__number">{String(surah.n).padStart(3, "0")}</span>
                    <span className="surah-directory__names">
                      <strong>{lang === "en" ? surah.en : surah.fr}</strong>
                      <small>{surah.en}</small>
                    </span>
                    <span className="surah-directory__arabic" lang="ar" dir="rtl">{surah.ar}</span>
                    <span className="surah-directory__meta">{surah.type === "Meccan" ? content.meccan : content.medinan} · {surah.ayahs} {content.ayahs}</span>
                    <span className="surah-directory__open">{locale.open}<ArrowRight size={14} aria-hidden="true" /></span>
                  </a>
                </li>
              ))}
            </ol>
          ) : (
            <div className="surah-directory__empty"><Search size={22} aria-hidden="true" /><p>{content.empty}</p></div>
          )}
        </section>
      ) : (
        <div className="legal-page__grid">
          {content.sections.map(([title, body], index) => (
            <section key={title} className="legal-page__card">
              <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              <h2>{title}</h2>
              <p>{body}</p>
            </section>
          ))}
        </div>
      )}

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
          <a href={siteConfig.repositoryUrl} target="_blank" rel="noreferrer"><Github size={16} />{locale.actions.project}</a>
          <a href={siteConfig.contactUrl} target="_blank" rel="noreferrer"><FileCheck2 size={16} />{locale.actions.correction}</a>
          <button type="button" onClick={goHome}><Globe2 size={16} />{locale.actions.home}</button>
        </nav>
      </footer>
    </article>
  );
}
