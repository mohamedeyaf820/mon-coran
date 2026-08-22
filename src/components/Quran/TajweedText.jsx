import React, { useMemo } from 'react';
import { getRulesForRiwaya, parseTajwid, stabilizeTajwidSegments } from '../../data/tajwidRules';
import { useAppLocale } from '../../context/AppContext';
import { getReadableWaqfGlyph } from '../../utils/quranUtils';
import { playWordAudio, getWordAudioUrl } from '../../utils/wordAudio';

const AYAH_MARKER_TOKEN_RE = /^[\u06dd\u06de\u06e9\ufd3f\ufd3e\d\u0660-\u0669\u06f0-\u06f9]+$/u;
function isMarkerToken(str) {
    if (!str) return false;
    const compact = String(str).replace(/\s+/g, '');
    return AYAH_MARKER_TOKEN_RE.test(compact);
}

const QURAN_COM_CLASS_MAP = {
    ghunnah: 'ghunna',
    ghunna: 'ghunna',
    ikhafa: 'ikhfa',
    ikhfa: 'ikhfa',
    ikhfa_shafawi: 'ikhfa',
    idgham_ghunnah: 'idgham',
    idgham_without_ghunnah: 'silent',
    idgham_wo_ghunnah: 'silent',
    idgham_shafawi: 'idgham',
    idgham_mutamathilayn: 'idgham',
    idgham: 'idgham',
    iqlab: 'iqlab',
    qalqalah: 'qalqala',
    qalaqah: 'qalqala',
    madda_necessary: 'madd',
    madda_obligatory: 'madd-connected',
    madda_permissible: 'madd-separated',
    madda_normal: 'madd-normal',
    madd_lazim: 'madd',
    madd_muttasil: 'madd-connected',
    madd_munfasil: 'madd-separated',
    ham_wasl: 'silent',
    laam_shamsiyah: 'lam-shamsiyya',
    silent: 'silent',
};

function ruleFromClassName(className = '') {
    const classes = String(className).split(/\s+/).filter(Boolean);
    for (const item of classes) {
        const normalized = item
            .replace(/^tajweed[-_]?/i, '')
            .replace(/-/g, '_')
            .toLowerCase();
        if (QURAN_COM_CLASS_MAP[normalized]) return QURAN_COM_CLASS_MAP[normalized];
    }
    return null;
}

function parseQuranComTajweedHtml(html) {
    if (!html || !/<[a-z][\s\S]*>/i.test(html)) return null;

    if (typeof DOMParser === 'undefined') {
        return null;
    }

    const doc = new DOMParser().parseFromString(String(html), 'text/html');
    const segments = [];

    const isVerseEndNode = (node) => {
        if (node.nodeType !== Node.ELEMENT_NODE) return false;
        const className = String(node.getAttribute('class') || '').toLowerCase();
        const dataName = String(node.getAttribute('data-type') || '').toLowerCase();
        return (
            className.includes('end') ||
            className.includes('ayah') ||
            className.includes('verse') ||
            dataName.includes('end') ||
            dataName.includes('ayah') ||
            dataName.includes('verse')
        );
    };

    const walk = (node, inheritedRule = null) => {
        if (node.nodeType === Node.TEXT_NODE) {
            const t = node.textContent?.replace(/[<>]/g, '');
            if (t) segments.push({ text: t, ruleId: inheritedRule });
            return;
        }

        if (node.nodeType !== Node.ELEMENT_NODE) return;
        if (isVerseEndNode(node)) return;

        const localRule = ruleFromClassName(node.getAttribute('class')) || inheritedRule;
        node.childNodes.forEach((child) => walk(child, localRule));
    };

    doc.body.childNodes.forEach((node) => walk(node, null));
    return stabilizeTajwidSegments(
        segments.filter((segment) => segment.text)
    );
}

const WAQF_RULES = {
    '\u06D6': {
        name: {
            fr: "Sallā (صلى)",
            en: "Sallā (صلى)",
            ar: "صلى"
        },
        desc: {
            fr: "L'arrêt est autorisé, mais la liaison est préférable.",
            en: "Stopping is permissible, but continuing is preferred.",
            ar: "الوصل أولى مع جواز الوقف."
        }
    },
    '\u06D7': {
        name: {
            fr: "Qalā (قلى)",
            en: "Qalā (قلى)",
            ar: "قلى"
        },
        desc: {
            fr: "L'arrêt est préférable, bien que la liaison soit autorisée.",
            en: "Stopping is preferred, though continuing is allowed.",
            ar: "الوقف أولى مع جواز الوصل."
        }
    },
    '\u06D8': {
        name: {
            fr: "Mīm (مـ)",
            en: "Mīm (مـ)",
            ar: "مـ"
        },
        desc: {
            fr: "Arrêt obligatoire pour préserver le sens du verset.",
            en: "Mandatory stop to preserve the meaning.",
            ar: "وقف لازم لتجنب تغيير المعنى."
        }
    },
    '\u06D9': {
        name: {
            fr: "Lā (لا)",
            en: "Lā (لا)",
            ar: "لا"
        },
        desc: {
            fr: "Interdiction de s'arrêter, sauf en cas de nécessité absolue.",
            en: "Do not stop here unless you run out of breath.",
            ar: "لا تقف هنا إلا عند الضرورة القصوى."
        }
    },
    '\u06DA': {
        name: {
            fr: "Jīm (ج)",
            en: "Jīm (ج)",
            ar: "ج"
        },
        desc: {
            fr: "Arrêt autorisé (optionnel). L'arrêt et la liaison sont équivalents.",
            en: "Permissible stop. You may stop or continue.",
            ar: "وقف جائز يستوي فيه الوقف والوصل."
        }
    },
    '\u06DB': {
        name: {
            fr: "Mu'ānaqah (ۛ ۛ)",
            en: "Mu'ānaqah (ۛ ۛ)",
            ar: "تعانق الوقف"
        },
        desc: {
            fr: "Arrêt d'embrassement : on peut s'arrêter à l'un des deux marqueurs, mais pas aux deux.",
            en: "Linked stop: you can stop at either of the two places, but not both.",
            ar: "يجوز الوقف على أحد الموضعين وليس كلاهما."
        }
    },
    '\u06DC': {
        name: {
            fr: "Saktah (سكتة)",
            en: "Saktah (سكتة)",
            ar: "سكتة"
        },
        desc: {
            fr: "Pause légère sans reprendre sa respiration.",
            en: "Subtle pause. A brief pause without taking a breath.",
            ar: "سكتة لطيفة دون تنفس."
        }
    },
    '۞': {
        name: {
            fr: "Rab' al-Hizb (۞)",
            en: "Rab' al-Hizb (۞)",
            ar: "ربع الحزب"
        },
        desc: {
            fr: "Marque le quart de Hizb : une des 240 divisions du Coran.",
            en: "Marks the quarter Hizb: one of 240 divisions of the Quran.",
            ar: "يشير إلى بداية ربع الحزب من أجزاء القرآن الكريم."
        }
    }
};



const WaqfSign = React.memo(function WaqfSign({ char, lang }) {
    const rule = WAQF_RULES[char];
    const displayGlyph = getReadableWaqfGlyph(char);
    const codePoint = char.codePointAt(0)?.toString(16).toUpperCase();
    if (!rule) {
        return (
            <span className="waqf-marker" data-waqf={codePoint} aria-label={char}>
                {displayGlyph}
            </span>
        );
    }

    const activeLang = lang === 'ar' || lang === 'en' || lang === 'fr' ? lang : 'fr';
    const name = rule.name[activeLang] || rule.name['en'] || rule.name['fr'];
    const desc = rule.desc[activeLang] || rule.desc['en'] || rule.desc['fr'];

    return (
        <span
            className="waqf-marker cursor-help"
            data-waqf={codePoint}
            data-tajwid-name={name}
            data-tajwid-desc={desc}
            data-tajwid-color="#c5a04b"
            role="help"
            aria-label={`Règle de Waqf: ${name}`}
        >
            {displayGlyph}
        </span>
    );
});

const TAJWEED_RULES_DESC = {
    ghunna: {
        name: { fr: "Ghunnah (غنة)", en: "Ghunnah", ar: "غنة" },
        desc: { 
            fr: "Nasalisation produite par la cavité nasale pendant 2 temps.", 
            en: "Nasalization produced from the nose, lasting for 2 beats.", 
            ar: "صوت يخرج من الخيشوم بمقدار حركتين." 
        }
    },
    ikhfa: {
        name: { fr: "Ikhfā' (إخفاء)", en: "Ikhfā'", ar: "إخفاء" },
        desc: { 
            fr: "Dissimulation de la lettre Nūn ou Tanwīn devant les lettres de l'Ikhfā'.", 
            en: "Hiding the sound of Nūn or Tanwīn when followed by an Ikhfā' letter.", 
            ar: "نطق الحرف بصفة بين الإظهار والإدغام مع الغنة." 
        }
    },
    idgham: {
        name: { fr: "Idghām (إدغام)", en: "Idghām", ar: "إدغام" },
        desc: { 
            fr: "Assimilation ou fusion de la lettre Nūn ou Tanwīn avec la lettre suivante.", 
            en: "Merging the sound of Nūn or Tanwīn into the following letter.", 
            ar: "إدخل حرف ساكن في حرف متحرك بحيث يصيران حرفاً واحداً مشدداً." 
        }
    },
    iqlab: {
        name: { fr: "Iqlāb (إقلاب)", en: "Iqlāb", ar: "إقلاب" },
        desc: { 
            fr: "Conversion du Nūn ou Tanwīn en un Mīm léger avec Ghunnah.", 
            en: "Converting the sound of Nūn or Tanwīn into a light Mīm with Ghunnah.", 
            ar: "قلب النون الساكنة أو التنوين ميماً مخفاة مع الغنة." 
        }
    },
    qalqala: {
        name: { fr: "Qalqalah (قلقلة)", en: "Qalqalah", ar: "قلقلة" },
        desc: { 
            fr: "Rebondissement ou écho de la consonne lorsqu'elle est calme (Sākīnah).", 
            en: "Echoing or bouncing sound of the consonant when silent (Sākīnah).", 
            ar: "اضطراب الحرف في مخرجه عند النطق به ساكناً." 
        }
    },
    "madd-connected": {
        name: { fr: "Madd Muttasil (مد متصل)", en: "Madd Muttasil", ar: "مد متصل" },
        desc: { 
            fr: "Allongement obligatoire lié : la lettre de Madd et le Hamzah sont dans le même mot (4 à 5 temps).", 
            en: "Required connected elongation: madd letter and Hamzah are in the same word (4-5 beats).", 
            ar: "أن يأتي حرف المد والهمزة في كلمة واحدة بمقدار ٤-٥ حركات." 
        }
    },
    "madd-separated": {
        name: { fr: "Madd Munfasil (مد منفصل)", en: "Madd Munfasil", ar: "مد منفصل" },
        desc: { 
            fr: "Allongement permis séparé : la lettre de Madd est à la fin du mot et le Hamzah au début du suivant (2 à 5 temps).", 
            en: "Permissible separated elongation: madd letter is at the end of the word and Hamzah at the start of the next (2-5 beats).", 
            ar: "أن يكون حرف المد في آخر كلمة والهمزة في أول الكلمة التالية." 
        }
    },
    madd: {
        name: { fr: "Madd Lāzim (مد لازم)", en: "Madd Lāzim", ar: "مد لازم" },
        desc: { 
            fr: "Allongement nécessaire ou obligatoire (6 temps).", 
            en: "Necessary/obligatory elongation (6 beats).", 
            ar: "أن يأتي بعد حرف المد حرف ساكن سكوناً أصلياً بمقدار ٦ حركات." 
        }
    },
    "madd-normal": {
        name: { fr: "Madd Tabī'ī (مد طبيعي)", en: "Madd Tabī'ī", ar: "مد طبيعي" },
        desc: { 
            fr: "Allongement naturel ou normal (2 temps).", 
            en: "Natural or normal elongation (2 beats).", 
            ar: "المد الطبيعي الذي لا تقوم ذات الحرف إلا به بمقدار حركتين." 
        }
    },
    silent: {
        name: { fr: "Lettre Muette (حرف صامت)", en: "Silent Letter", ar: "حرف مهمل" },
        desc: { 
            fr: "Lettre écrite mais non prononcée (ex: Hamzat al-Wasl ou Alif muet).", 
            en: "Written but unpronounced letter (e.g., Hamzat al-Wasl or silent Alif).", 
            ar: "حرف يكتب ولا ينطق في القراءة." 
        }
    },
    "lam-shamsiyya": {
        name: { fr: "Lām Shamsiyyah (لام شمسية)", en: "Lām Shamsiyyah", ar: "لام شمسية" },
        desc: { 
            fr: "Lām solaire assimilé dans la lettre suivante (non prononcé).", 
            en: "Solar Lām merged into the following letter (unpronounced).", 
            ar: "اللام التي تكتب ولا تلفظ ويشدد الحرف بعدها." 
        }
    }
};

const TajweedRuleSegment = React.memo(function TajweedRuleSegment({
    text,
    ruleId,
    color,
    lang,
    fallbackRule,
}) {
    const activeLang = lang === 'ar' || lang === 'en' || lang === 'fr' ? lang : 'fr';
    const rule = TAJWEED_RULES_DESC[ruleId];
    const fallbackNameKey = activeLang === 'ar' ? 'nameAr' : activeLang === 'en' ? 'nameEn' : 'nameFr';
    const name = rule?.name?.[activeLang]
        || rule?.name?.en
        || fallbackRule?.[fallbackNameKey]
        || fallbackRule?.nameEn
        || ruleId;
    const desc = rule?.desc?.[activeLang]
        || rule?.desc?.en
        || fallbackRule?.description
        || '';

    return (
        <span
            className="tajwid-rule-segment"
            style={{ color }}
            data-tajwid={ruleId}
            data-tajwid-name={name}
            data-tajwid-desc={desc}
            data-tajwid-color={color}
            aria-label={`${name}: ${desc}`}
        >
            {text}
        </span>
    );
});

function groupSegmentsIntoWords(segments) {
    if (!Array.isArray(segments) || segments.length === 0) return [];
    const words = [];
    let currentWord = [];

    for (const seg of segments) {
        const text = seg.text || '';
        if (!text) continue;

        const parts = text.split(/(\s+)/);
        for (const part of parts) {
            if (!part) continue;
            if (/^\s+$/.test(part)) {
                if (currentWord.length > 0) {
                    words.push(currentWord);
                    currentWord = [];
                }
            } else {
                currentWord.push({ text: part, ruleId: seg.ruleId });
            }
        }
    }
    if (currentWord.length > 0) {
        words.push(currentWord);
    }
    return words;
}

/**
 * TajweedText — renders Arabic text with Tajweed colour-coding.
 * Plus custom 'Waqf' (Stop Signs) redesign for Expert UI/UX (Sakīna).
 */
const TajweedText = React.memo(function TajweedText({
    text,
    enabled = true,
    riwaya = 'hafs',
    tajweedColors,   // optional object { ruleId → cssColor } override
    surahNum,
    ayahNumber,
}) {
    const { lang } = useAppLocale();
    const segments = useMemo(() => {
        if (!enabled || !text) return null;
        try {
            const htmlSegments = parseQuranComTajweedHtml(text);
            if (htmlSegments) return htmlSegments;
            return parseTajwid(text, riwaya);
        } catch {
            return null;
        }
    }, [text, riwaya, enabled]);
    const ruleMetadata = useMemo(
        () => new Map(getRulesForRiwaya(riwaya).map((rule) => [rule.id, rule])),
        [riwaya],
    );
    // No /g flag: using with .test() on a stateful regex resets lastIndex and
    // causes alternating misses. split() with a capturing group works without /g.
    const waqfRegex = /([\u06D6-\u06DC\u06DE])/;

    if (!text) return null;

    // Simple plain text path (handling waqf even if tajwed is off)
    if (!enabled || !segments || segments.length === 0) {
        if (waqfRegex.test(text)) {
            const parts = text.split(waqfRegex);
            return (
                <span>
                    {parts.map((p, j) => 
                        waqfRegex.test(p) 
                            ? <WaqfSign key={j} char={p} lang={lang} />
                            : p
                    )}
                </span>
            );
        }
        return <span>{text}</span>;
    }

    const renderSegment = (seg, key) => {
        const color = seg.ruleId
            ? (tajweedColors && tajweedColors[seg.ruleId]) || `var(--tajwid-${seg.ruleId})`
            : 'inherit';

        if (waqfRegex.test(seg.text)) {
            return seg.text.split(waqfRegex).map((part, index) =>
                waqfRegex.test(part)
                    ? <WaqfSign key={`${key}-${index}`} char={part} lang={lang} />
                    : seg.ruleId && part
                        ? <TajweedRuleSegment
                            key={`${key}-${index}`}
                            text={part}
                            ruleId={seg.ruleId}
                            color={color}
                            lang={lang}
                            fallbackRule={ruleMetadata.get(seg.ruleId)}
                        />
                        : <React.Fragment key={`${key}-${index}`}>{part}</React.Fragment>
            );
        }

        if (!seg.ruleId) {
            return <React.Fragment key={key}>{seg.text}</React.Fragment>;
        }

        return <TajweedRuleSegment
            key={key}
            text={seg.text}
            ruleId={seg.ruleId}
            color={color}
            lang={lang}
            fallbackRule={ruleMetadata.get(seg.ruleId)}
        />;
    };

    const words = groupSegmentsIntoWords(segments);

    return (
        <span className="quran-tajwid-text" dir="rtl" lang="ar">
            <span aria-hidden="true">
                {words.map((wordSegments, wordIndex) => {
                    const wordPos = wordIndex + 1;
                    const firstText = wordSegments[0]?.text || '';
                    const isMarker = isMarkerToken(firstText);
                    const audioUrl = !isMarker && surahNum && ayahNumber
                        ? getWordAudioUrl(surahNum, ayahNumber, wordPos)
                        : null;

                    const handleClick = (e) => {
                        if (!isMarker) {
                            e.stopPropagation();
                            playWordAudio(audioUrl || { surah: surahNum, ayah: ayahNumber, position: wordPos });
                        }
                    };

                    const nextWord = words[wordIndex + 1];
                    const nextIsMarker = nextWord && isMarkerToken(nextWord[0]?.text || '');

                    return (
                        <React.Fragment key={wordIndex}>
                            <span
                                className={isMarker ? "native-ayah-marker" : "quran-word-item cursor-pointer"}
                                onClick={!isMarker ? handleClick : undefined}
                                role={!isMarker ? "button" : undefined}
                                tabIndex={!isMarker ? 0 : undefined}
                                style={{ display: "inline" }}
                            >
                                {wordSegments.map((seg, sIdx) =>
                                    renderSegment(seg, `${wordIndex}-${sIdx}`)
                                )}
                            </span>
                            {wordIndex < words.length - 1 ? (nextIsMarker ? "\u202F" : " ") : null}
                        </React.Fragment>
                    );
                })}
            </span>
            <span className="sr-only">
                {segments.map((segment) => segment.text).join('')}
            </span>
        </span>
    );
});

export default TajweedText;
