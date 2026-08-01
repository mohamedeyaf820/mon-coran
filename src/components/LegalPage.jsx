import React from "react";
import { ArrowLeft, CircleUserRound, Database, ExternalLink, Scale, ShieldCheck } from "lucide-react";
import { useAppActions, useAppLocale } from "../context/AppContext";
import siteConfig from "../../site.config.json";
import { CONTENT_ATTRIBUTIONS } from "../data/contentAttributions";
import "../styles/domains/legal-page.css";

const COPY = {
  fr: {
    eyebrow: "Transparence",
    back: "Retour à l’accueil",
    tabs: { about: "À propos", privacy: "Confidentialité", legal: "Mentions légales", sources: "Sources" },
    privacy: {
      title: "Vos lectures restent d’abord sur votre appareil",
      intro:
        "MushafPlus fonctionne sans compte. Les préférences, la progression et les collections personnelles sont conservées localement dans votre navigateur.",
      sections: [
        ["Données locales", "Les réglages et la dernière position utilisent le stockage local. Les favoris, notes et données de mémorisation utilisent la base locale du navigateur. Une phrase secrète peut protéger les contenus sensibles lorsqu’elle est activée."],
        ["Services externes", "Le texte coranique, les traductions, les horaires et l’audio peuvent être demandés à des API ou CDN tiers. Comme pour toute requête web, ces services peuvent recevoir l’adresse IP et les informations techniques nécessaires à la connexion."],
        ["Localisation", "La géolocalisation n’est demandée qu’après activation explicite des horaires de prière. La position sert au calcul et n’est pas enregistrée par MushafPlus."],
        ["Recherche vocale", "Le microphone n’est demandé qu’après un appui sur le bouton de dictée. MushafPlus ne conserve aucun enregistrement ; selon le navigateur, la reconnaissance peut être traitée par son service vocal."],
        ["Contrôle", "Vous pouvez effacer les données de l’application depuis les réglages ou les outils de stockage du navigateur. MushafPlus n’effectue pas de synchronisation cloud en arrière-plan."],
      ],
    },
    about: {
      title: "À propos de MushafPlus",
      intro: "Une application indépendante conçue pour rendre la lecture, l’écoute et l’étude du Coran simples, accessibles et transparentes.",
    },
    legal: {
      title: "Informations de publication",
      intro:
        "MushafPlus est une application indépendante de lecture et d’étude. Elle est publiée sur le web depuis le dépôt public indiqué ci-dessous.",
      sections: [
        ["Édition et contact", "Projet MushafPlus — les demandes, corrections et signalements sont reçus via le dépôt GitHub du projet."],
        ["Hébergement", "La version publique auditée utilise le domaine mon-coran.netlify.app. L’hébergeur peut appliquer ses propres journaux techniques et conditions de service."],
        ["Responsabilité", "L’application fournit des outils éducatifs. Elle ne remplace pas une édition vérifiée du Mushaf, l’avis d’un enseignant qualifié ni un conseil religieux ou juridique."],
        ["Code et contenus", "Aucune licence générale de redistribution du code n’est déclarée dans ce dépôt. Les textes, polices, images et récitations tiers restent soumis aux droits et conditions de leurs fournisseurs."],
      ],
    },
    sources: {
      title: "Sources et attributions",
      intro:
        "Les contenus distants sont chargés selon la riwaya, le lecteur et la fonctionnalité demandée. Une source indisponible peut être remplacée par une source de secours compatible.",
      sections: [
        ["Texte et structure", "Quran.com API et AlQuran Cloud pour les versets, traductions, mots et métadonnées coraniques."],
        ["Récitations", "Quran.com Audio, EveryAyah, MP3Quran, QuranicAudio et CDN Islamic Network selon le récitateur sélectionné."],
        ["Typographie et visuels", "Polices coraniques et ressources provenant notamment de Quran.com, Quran Foundation et Quran Word by Word. Les portraits distants restent attribués à leur fournisseur."],
        ["Vérification", "Les métadonnées et adresses des fournisseurs peuvent évoluer. Le dépôt contient la liste technique détaillée et les audits d’intégrité utilisés pour cette version."],
      ],
    },
  },
  en: {
    eyebrow: "Transparency",
    back: "Back to home",
    tabs: { about: "About", privacy: "Privacy", legal: "Legal notice", sources: "Sources" },
    privacy: {
      title: "Your reading data stays on your device first",
      intro: "MushafPlus works without an account. Preferences, progress and personal collections are stored locally in your browser.",
      sections: [
        ["Local data", "Settings and the latest reading position use local storage. Bookmarks, notes and memorization data use the browser database. An optional passphrase can protect sensitive content."],
        ["External services", "Quran text, translations, prayer data and audio may be requested from third-party APIs or CDNs. Those services receive the network information required to answer a web request."],
        ["Location", "Geolocation is requested only after prayer times are explicitly enabled. It is used for calculation and is not stored by MushafPlus."],
        ["Voice search", "Microphone access is requested only after the dictate button is pressed. MushafPlus stores no recording; depending on the browser, recognition may be processed by its speech service."],
        ["Your control", "You can clear application data from settings or browser storage tools. MushafPlus does not run background cloud synchronization."],
      ],
    },
    about: {
      title: "About MushafPlus",
      intro: "An independent application designed to make Quran reading, listening and study simple, accessible and transparent.",
    },
    legal: {
      title: "Publishing information",
      intro: "MushafPlus is an independent reading and study application published from the public repository linked below.",
      sections: [
        ["Publisher and contact", "MushafPlus project — requests, corrections and reports are handled through the project GitHub repository."],
        ["Hosting", "The audited public version uses mon-coran.netlify.app. The hosting provider may apply its own technical logs and service terms."],
        ["Responsibility", "The app provides educational tools. It does not replace a verified Mushaf edition, a qualified teacher or religious or legal advice."],
        ["Code and content", "No general code redistribution license is declared in this repository. Third-party text, fonts, images and recordings remain subject to their providers’ rights and terms."],
      ],
    },
    sources: {
      title: "Sources and attribution",
      intro: "Remote content is loaded according to the selected riwaya, reciter and feature. A compatible fallback may be used when a source is unavailable.",
      sections: [
        ["Text and structure", "Quran.com API and AlQuran Cloud provide verses, translations, words and Quran metadata."],
        ["Recitations", "Quran.com Audio, EveryAyah, MP3Quran, QuranicAudio and Islamic Network CDN are used depending on the selected reciter."],
        ["Typography and imagery", "Quran fonts and resources come notably from Quran.com, Quran Foundation and Quran Word by Word. Remote portraits remain attributed to their provider."],
        ["Verification", "Provider metadata and addresses may change. The repository contains the detailed technical list and integrity audits used for this release."],
      ],
    },
  },
  ar: {
    eyebrow: "الشفافية",
    back: "العودة إلى الرئيسية",
    tabs: { about: "حول التطبيق", privacy: "الخصوصية", legal: "الإشعار القانوني", sources: "المصادر" },
    privacy: {
      title: "تبقى بيانات قراءتك على جهازك أولاً",
      intro: "يعمل MushafPlus من دون حساب. تُحفظ التفضيلات والتقدم والمجموعات الشخصية محلياً في متصفحك.",
      sections: [
        ["البيانات المحلية", "تُحفظ الإعدادات وآخر موضع قراءة محلياً، بينما تستخدم العلامات والملاحظات وبيانات الحفظ قاعدة بيانات المتصفح. ويمكن حماية المحتوى الحساس بعبارة سرية اختيارية."],
        ["الخدمات الخارجية", "قد يُطلب نص القرآن والترجمات والمواقيت والصوت من واجهات أو شبكات توزيع خارجية، وتتلقى هذه الخدمات معلومات الاتصال اللازمة للرد على الطلب."],
        ["الموقع", "لا يُطلب الموقع إلا بعد تفعيل مواقيت الصلاة صراحة. يُستخدم للحساب ولا يخزنه MushafPlus."],
        ["البحث الصوتي", "لا يُطلب الوصول إلى الميكروفون إلا بعد الضغط على زر الإملاء. لا يحتفظ MushafPlus بأي تسجيل، وقد يعالج المتصفح التعرف بواسطة خدمته الصوتية."],
        ["التحكم", "يمكنك حذف بيانات التطبيق من الإعدادات أو أدوات المتصفح. لا ينفذ MushafPlus مزامنة سحابية في الخلفية."],
      ],
    },
    about: {
      title: "حول MushafPlus",
      intro: "تطبيق مستقل صُمم لجعل قراءة القرآن والاستماع إليه ودراسته بسيطة ومتاحة وشفافة.",
    },
    legal: {
      title: "معلومات النشر",
      intro: "MushafPlus تطبيق مستقل للقراءة والدراسة، منشور من المستودع العام المشار إليه أدناه.",
      sections: [
        ["النشر والتواصل", "مشروع MushafPlus — تُستقبل الطلبات والتصحيحات والبلاغات عبر مستودع GitHub الخاص بالمشروع."],
        ["الاستضافة", "تستخدم النسخة العامة المدققة النطاق mon-coran.netlify.app، وقد يطبق مزود الاستضافة سجلاته التقنية وشروط خدمته."],
        ["المسؤولية", "يوفر التطبيق أدوات تعليمية ولا يستبدل نسخة مصحف محققة أو معلماً مؤهلاً أو استشارة دينية أو قانونية."],
        ["الكود والمحتوى", "لا يعلن المستودع ترخيصاً عاماً لإعادة توزيع الكود. وتبقى النصوص والخطوط والصور والتلاوات الخارجية خاضعة لحقوق وشروط مزوديها."],
      ],
    },
    sources: {
      title: "المصادر ونسب المحتوى",
      intro: "يُحمّل المحتوى الخارجي وفق الرواية والقارئ والميزة المطلوبة، وقد يُستخدم مصدر بديل متوافق عند تعذر المصدر الأساسي.",
      sections: [
        ["النص والبنية", "توفر Quran.com API وAlQuran Cloud الآيات والترجمات والكلمات والبيانات الوصفية."],
        ["التلاوات", "تُستخدم Quran.com Audio وEveryAyah وMP3Quran وQuranicAudio وIslamic Network حسب القارئ المختار."],
        ["الخطوط والصور", "تأتي الخطوط والموارد القرآنية خصوصاً من Quran.com وQuran Foundation وQuran Word by Word، وتبقى الصور الخارجية منسوبة إلى مزودها."],
        ["التحقق", "قد تتغير بيانات المزودين وعناوينهم. يحتوي المستودع على القائمة التقنية المفصلة وتدقيقات السلامة المستخدمة لهذه النسخة."],
      ],
    },
  },
};

const ICONS = { about: CircleUserRound, privacy: ShieldCheck, legal: Scale, sources: Database };

function aboutSections(lang) {
  if (lang === "ar") {
    return [
      ["المسؤول عن المشروع", `${siteConfig.projectOwner} — مشروع ${siteConfig.brandName}.`],
      ["التواصل والتصحيحات", "تُراجع بلاغات الأخطاء في النص أو الصوت أو الترجمة عبر صفحة Issues العامة. تُوثق التصحيحات وتُنشر مع إصدار لاحق."],
      ["الإصدار", `الإصدار ${siteConfig.version} — آخر تحديث ${siteConfig.lastUpdated}.`],
      ["النطاق الرسمي", new URL(siteConfig.siteUrl).hostname],
    ];
  }
  if (lang === "en") {
    return [
      ["Project lead", `${siteConfig.projectOwner} — ${siteConfig.brandName} project.`],
      ["Contact and corrections", "Text, audio or translation issues are reviewed through the public Issues page. Accepted corrections are documented and shipped in a later release."],
      ["Version", `Version ${siteConfig.version} — last updated ${siteConfig.lastUpdated}.`],
      ["Official domain", new URL(siteConfig.siteUrl).hostname],
    ];
  }
  return [
    ["Responsable du projet", `${siteConfig.projectOwner} — projet ${siteConfig.brandName}.`],
    ["Contact et politique de correction", "Les erreurs de texte, d’audio ou de traduction sont examinées via la page publique Issues. Toute correction retenue est documentée puis publiée dans une version ultérieure."],
    ["Version", `Version ${siteConfig.version} — dernière mise à jour le ${siteConfig.lastUpdated}.`],
    ["Domaine officiel", new URL(siteConfig.siteUrl).hostname],
  ];
}

export default function LegalPage({ page = "privacy" }) {
  const { lang } = useAppLocale();
  const { set } = useAppActions();
  const locale = COPY[lang] || COPY.fr;
  const activePage = Object.prototype.hasOwnProperty.call(locale.tabs, page) ? page : "privacy";
  const content = locale[activePage];
  const sections = activePage === "about"
    ? aboutSections(lang)
    : content.sections.map(([title, body]) => [
        title,
        body.replaceAll("mon-coran.netlify.app", new URL(siteConfig.siteUrl).hostname),
      ]);
  const ActiveIcon = ICONS[activePage];

  const navigate = (nextPage) => {
    set({ legalPage: nextPage, showHome: false, showDuas: false });
    document.querySelector("#main-content")?.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <article className="legal-page">
      <div className="legal-page__halo" aria-hidden="true" />
      <header className="legal-page__hero">
        <button
          type="button"
          className="legal-page__back"
          onClick={() => set({ legalPage: null, showHome: true, showDuas: false })}
        >
          <ArrowLeft size={16} aria-hidden="true" />
          {locale.back}
        </button>
        <div className="legal-page__icon" aria-hidden="true"><ActiveIcon size={26} /></div>
        <p className="legal-page__eyebrow">{locale.eyebrow}</p>
        <h1>{content.title}</h1>
        <p className="legal-page__intro">{content.intro}</p>
      </header>

      <nav className="legal-page__tabs" aria-label={locale.eyebrow}>
        {Object.entries(locale.tabs).map(([key, label]) => {
          const Icon = ICONS[key];
          return (
            <button
              key={key}
              type="button"
              className={key === activePage ? "is-active" : ""}
              aria-current={key === activePage ? "page" : undefined}
              onClick={() => navigate(key)}
            >
              <Icon size={16} aria-hidden="true" />
              {label}
            </button>
          );
        })}
      </nav>

      <div className="legal-page__grid">
        {sections.map(([title, body], index) => (
          <section key={title} className="legal-page__card">
            <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
            <h2>{title}</h2>
            <p>{body}</p>
          </section>
        ))}
      </div>

      {activePage === "sources" ? (
        <section className="legal-page__attributions" aria-labelledby="attributions-title">
          <div className="legal-page__attributions-heading">
            <p>{lang === "ar" ? "السجل المنشور" : lang === "en" ? "Published register" : "Registre publié"}</p>
            <h2 id="attributions-title">
              {lang === "ar" ? "التراخيص ونسب المصادر" : lang === "en" ? "Licences and source attribution" : "Licences et attributions exactes"}
            </h2>
          </div>
          <div className="legal-page__attribution-list">
            {CONTENT_ATTRIBUTIONS.map((item) => (
              <article key={item.id} className="legal-page__attribution-item">
                <span>{item.category}</span>
                <div>
                  <h3>{item.name}</h3>
                  <p>{item.usage}</p>
                  <small>{item.rights}</small>
                </div>
                <a href={item.url} target="_blank" rel="noreferrer" aria-label={`${item.name} — source`}>
                  <ExternalLink size={16} aria-hidden="true" />
                </a>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <div className="legal-page__links">
        <a className="legal-page__repository" href={siteConfig.repositoryUrl} target="_blank" rel="noreferrer">
          GitHub · {siteConfig.brandName}
          <ExternalLink size={15} aria-hidden="true" />
        </a>
        <a className="legal-page__repository" href={siteConfig.contactUrl} target="_blank" rel="noreferrer">
          {lang === "ar" ? "الإبلاغ عن تصحيح" : lang === "en" ? "Report a correction" : "Signaler une correction"}
          <ExternalLink size={15} aria-hidden="true" />
        </a>
      </div>
    </article>
  );
}
