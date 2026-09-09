import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { getRulesForRiwaya, parseTajwid, stabilizeTajwidSegments } from '../../data/tajwidRules';
import { useAppLocale } from '../../context/AppContext';
import { applyFontSigns, getReadableWaqfGlyph, isNonVerseQuranSign } from '../../utils/quranUtils';
import { playWordAudio, getWordAudioUrl } from '../../utils/wordAudio';
import {
    applyTajweedHighlights,
    clearTajweedHoverRange,
    clearTajweedPlayingRange,
    getTextRangeRects,
    rectsContainPoint,
    setTajweedHoverRange,
    setTajweedPlayingRange,
    supportsTajweedHighlights,
    unionRects,
} from '../../utils/tajweedHighlights';
import useKaraokeWordIndex from '../../hooks/useKaraokeWordIndex';

const AYAH_MARKER_TOKEN_RE = /^[\u06DD\u06DE\u06E9\uFD3F\uFD3E\d\u0660-\u0669\u06F0-\u06F9]+$/u;
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
    madda_obligatory_monfasel: 'madd-separated',
    madda_obligatory_mottasel: 'madd-connected',
    madda_permissible: 'madd-separated',
    madda_normal: 'madd-normal',
    madd_lazim: 'madd',
    madd_muttasil: 'madd-connected',
    madd_munfasil: 'madd-separated',
    ham_wasl: 'silent',
    laam_shamsiyah: 'lam-shamsiyya',
    slnt: 'silent',
    silent: 'silent',
};

function ruleFromClassName(className = '') {
    const classes = String(className).split(/\s+/).filter(Boolean);
    for (const item of classes) {
        const normalized = item
            .replace(/^(?:tajweed|rule)[-_]?/i, '')
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



function getVerseLabel(lang, ayahNumber) {
    if (!ayahNumber) return undefined;
    const word = lang === 'ar' ? '\u0627\u0644\u0622\u064a\u0629' : lang === 'en' ? 'Verse' : 'Verset';
    return `${word} ${ayahNumber}`;
}

const WaqfSign = React.memo(function WaqfSign({ char, lang, riwaya }) {
    const rule = WAQF_RULES[char];
    const displayGlyph = getReadableWaqfGlyph(char);
    const codePoint = char.codePointAt(0)?.toString(16).toUpperCase();
    const className = riwaya === 'warsh' ? 'warsh-waqf-marker waqf-marker' : 'waqf-marker';
    if (!rule) {
        return (
            <span className={className} data-waqf={codePoint} aria-label={char}>
                {displayGlyph}
            </span>
        );
    }

    const activeLang = lang === 'ar' || lang === 'en' || lang === 'fr' ? lang : 'fr';
    const name = rule.name[activeLang] || rule.name['en'] || rule.name['fr'];
    const desc = rule.desc[activeLang] || rule.desc['en'] || rule.desc['fr'];

    return (
        <span
            className={`${className} cursor-help`}
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

function getRuleLabel(ruleId, lang, fallbackRule) {
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
    return { name, desc };
}

function resolveRuleColor(ruleId, tajweedColors) {
    return (tajweedColors && tajweedColors[ruleId]) || `var(--tajwid-${ruleId})`;
}

// Waqf signs are combining marks; they are rendered by WaqfSign as a readable
// standalone glyph, so they are split out of the word text in both paths.
const WAQF_SPLIT_RE = /([\u06D6-\u06DC\u06DE])/;
const WAQF_CHAR_RE = /^[\u06D6-\u06DC\u06DE]$/;

/* ────────────────────────────────────────────────────────────────────────
 * Highlight path (default): one text node per word, colours applied with the
 * CSS Custom Highlight API. Splitting a word into one <span> per rule breaks
 * Arabic shaping: WebKit shapes each inline run separately (letters lose
 * their joined forms) and every engine loses the cursive attachment of the
 * kashida carrying a dagger alif, which shows up as coloured bars floating
 * under the word. See src/utils/tajweedHighlights.js.
 * ──────────────────────────────────────────────────────────────────────── */

const TAJWEED_HIGHLIGHTS_SUPPORTED = supportsTajweedHighlights();

function finishHighlightWord(text, rules) {
    const parts = [];
    let buffer = '';
    let bufferStart = 0;

    const pushText = (endIndex) => {
        if (!buffer) return;
        const partRules = [];
        for (const rule of rules) {
            const start = Math.max(rule.start, bufferStart);
            const end = Math.min(rule.end, endIndex);
            if (end > start) {
                partRules.push({
                    start: start - bufferStart,
                    end: end - bufferStart,
                    ruleId: rule.ruleId,
                });
            }
        }
        parts.push({ type: 'text', text: buffer, rules: partRules });
        buffer = '';
    };

    for (let index = 0; index < text.length; index += 1) {
        const char = text[index];
        if (WAQF_CHAR_RE.test(char)) {
            pushText(index);
            parts.push({ type: 'waqf', char });
            bufferStart = index + 1;
        } else {
            if (!buffer) bufferStart = index;
            buffer += char;
        }
    }
    // Protective guard: for 2-letter ligature words like 'فِىٓ' or 'لَّا', ensure OpenType ligatures
    // are never clipped or broken by partial styling or misattributed silent rules.
    if (/^[\u0641\u0644\u0628][\u064B-\u065F]*[\u0649\u064A\u0622\u0623\u0625\u0627\u0671][\u0653]?$/u.test(text)) {
        for (const rule of rules) {
            if (rule.ruleId && (rule.ruleId.startsWith('madd') || rule.ruleId === 'silent')) {
                if (rule.ruleId === 'silent' && text.includes('\u0644')) {
                    rule.start = text.length; // neutralize misapplied silent rule on Lam
                } else if (rule.ruleId.startsWith('madd')) {
                    rule.start = 0;
                }
            }
        }
    }

    pushText(text.length);

    return { text, isMarker: isMarkerToken(text), parts };
}

// Groups rule segments into words and records, per word, the UTF-16 ranges
// covered by each rule (DOM Range offsets are UTF-16 code units as well).
function buildHighlightWords(segments) {
    const words = [];
    let current = null;

    const flush = () => {
        if (current && current.text) {
            words.push(finishHighlightWord(current.text, current.rules));
        }
        current = null;
    };

    for (const seg of segments) {
        const text = seg?.text || '';
        if (!text) continue;
        for (const part of text.split(/(\s+)/)) {
            if (!part) continue;
            if (/^\s+$/.test(part)) {
                flush();
                continue;
            }
            if (!current) current = { text: '', rules: [] };
            const start = current.text.length;
            current.text += part;
            if (seg.ruleId) {
                current.rules.push({ start, end: current.text.length, ruleId: seg.ruleId });
            }
        }
    }
    flush();
    return words;
}

/**
 * Follows the recitation on the highlight path: the recited word gets the
 * `tajwid-playing` highlight while the Tajweed colours stay in place.
 * Mounted only while the ayah is playing, so idle verses subscribe to nothing.
 */
function TajweedKaraoke({ rootRef, words, plainText, karaoke }) {
    const recitableWords = useMemo(
        () => words.filter((word) => !word.isMarker).map((word) => word.text),
        [words],
    );
    const currentIdx = useKaraokeWordIndex({
        text: plainText,
        isFirstAyah: karaoke.isFirstAyah,
        calibration: karaoke.calibration,
        recitableWords,
    });

    useLayoutEffect(() => {
        const root = rootRef.current;
        if (!root || currentIdx < 0) {
            clearTajweedPlayingRange();
            return undefined;
        }
        let recitable = -1;
        const target = words.findIndex((word) => {
            if (word.isMarker) return false;
            recitable += 1;
            return recitable === currentIdx;
        });
        const wordEl = target >= 0 ? root.querySelector(`[data-tajwid-word="${target}"]`) : null;
        const node = wordEl
            ? Array.from(wordEl.childNodes).find((child) => child.nodeType === Node.TEXT_NODE)
            : null;
        if (node) setTajweedPlayingRange(node, 0, node.data.length);
        else clearTajweedPlayingRange();
        return undefined;
    }, [currentIdx, rootRef, words]);

    useEffect(() => () => clearTajweedPlayingRange(), []);

    return null;
}

function dispatchTooltipEvent(type, detail) {
    if (typeof document === 'undefined') return;
    document.dispatchEvent(new CustomEvent(type, { detail }));
}

function TajweedHighlightWords({
    words,
    plainText,
    lang,
    riwaya,
    surahNum,
    ayahNumber,
    tajweedColors,
    ruleMetadata,
    karaoke,
}) {
    const rootRef = useRef(null);
    const hitEntriesRef = useRef(null);
    const hoveredRef = useRef(null);

    // User colour overrides: ::highlight() resolves var() against the
    // originating element, so scoping the variables here is enough.
    const colorVars = useMemo(() => {
        if (!tajweedColors) return undefined;
        const style = {};
        for (const [ruleId, color] of Object.entries(tajweedColors)) {
            if (color) style[`--tajwid-${ruleId}`] = color;
        }
        return style;
    }, [tajweedColors]);

    useLayoutEffect(() => {
        const root = rootRef.current;
        if (!root) return undefined;

        const cleanups = [];
        const entries = new Map();

        root.querySelectorAll('[data-tajwid-word]').forEach((wordEl) => {
            const wordIndex = Number(wordEl.getAttribute('data-tajwid-word'));
            const word = words[wordIndex];
            if (!word) return;
            const textNodes = Array.from(wordEl.childNodes).filter(
                (node) => node.nodeType === Node.TEXT_NODE,
            );
            let textIndex = 0;
            for (const part of word.parts) {
                if (part.type !== 'text') continue;
                const node = textNodes[textIndex];
                textIndex += 1;
                if (!node || node.data !== part.text || part.rules.length === 0) continue;
                cleanups.push(applyTajweedHighlights(node, part.rules));
                const list = entries.get(wordIndex) || [];
                for (const rule of part.rules) list.push({ node, ...rule });
                entries.set(wordIndex, list);
            }
        });

        hitEntriesRef.current = entries;

        return () => {
            cleanups.forEach((cleanup) => cleanup());
            hitEntriesRef.current = null;
            if (hoveredRef.current) {
                hoveredRef.current = null;
                clearTajweedHoverRange();
                dispatchTooltipEvent('tajwid:leave');
            }
        };
    }, [words]);

    const findRuleAtPoint = (target, x, y) => {
        const wordEl = target?.closest?.('[data-tajwid-word]');
        if (!wordEl || !rootRef.current?.contains(wordEl)) return null;
        const list = hitEntriesRef.current?.get(Number(wordEl.getAttribute('data-tajwid-word')));
        if (!list) return null;
        for (const entry of list) {
            const rects = getTextRangeRects(entry.node, entry.start, entry.end);
            if (rectsContainPoint(rects, x, y)) return entry;
        }
        return null;
    };

    const describeEntry = (entry) => {
        const { name, desc } = getRuleLabel(entry.ruleId, lang, ruleMetadata.get(entry.ruleId));
        return {
            name,
            desc,
            color: resolveRuleColor(entry.ruleId, tajweedColors),
            getRect: () => unionRects(getTextRangeRects(entry.node, entry.start, entry.end)),
        };
    };

    const hideEntry = () => {
        if (!hoveredRef.current) return;
        hoveredRef.current = null;
        clearTajweedHoverRange();
        dispatchTooltipEvent('tajwid:leave');
    };

    const showEntry = (entry, immediate) => {
        hoveredRef.current = entry;
        setTajweedHoverRange(entry.node, entry.start, entry.end);
        dispatchTooltipEvent(immediate ? 'tajwid:show' : 'tajwid:hover', describeEntry(entry));
    };

    const handlePointerMove = (event) => {
        if (event.pointerType === 'touch') return;
        const entry = findRuleAtPoint(event.target, event.clientX, event.clientY);
        if (entry === hoveredRef.current) return;
        if (!entry) {
            hideEntry();
            return;
        }
        showEntry(entry, false);
    };

    const handleWordClick = (event, wordIndex, audioUrl) => {
        event.stopPropagation();
        playWordAudio(audioUrl || { surah: surahNum, ayah: ayahNumber, position: wordIndex + 1 });
        const entry = findRuleAtPoint(event.target, event.clientX, event.clientY);
        if (entry) {
            showEntry(entry, true);
        } else {
            hideEntry();
        }
    };

    return (
        <span
            className="quran-tajwid-text"
            dir="rtl"
            lang="ar"
            data-tajwid-render="highlight"
            ref={rootRef}
            style={colorVars}
            onPointerMove={handlePointerMove}
            onPointerLeave={hideEntry}
        >
            {/* The words are the accessible text: no hidden copy, so that
                screen readers read the verse once and the word buttons are
                never nested in an aria-hidden subtree. The verse marker is the
                verse's own button (its parent opens the verse actions). */}
            <span data-tajwid-words="true">
                {words.map((word, wordIndex) => {
                    const audioUrl = !word.isMarker && surahNum && ayahNumber
                        ? getWordAudioUrl(surahNum, ayahNumber, wordIndex + 1)
                        : null;
                    const nextWord = words[wordIndex + 1];

                    return (
                        <React.Fragment key={wordIndex}>
                            <span
                                className={word.isMarker ? (isNonVerseQuranSign(word.text) ? "quran-annotation-marker" : "native-ayah-marker") : "quran-word-item cursor-pointer"}
                                data-tajwid-word={wordIndex}
                                onClick={!word.isMarker
                                    ? (event) => handleWordClick(event, wordIndex, audioUrl)
                                    : undefined}
                                role={isNonVerseQuranSign(word.text) ? undefined : "button"}
                                tabIndex={isNonVerseQuranSign(word.text) ? undefined : 0}
                                aria-label={!isNonVerseQuranSign(word.text) && word.isMarker ? getVerseLabel(lang, ayahNumber) : undefined}
                                style={{ display: "inline" }}
                            >
                                {word.parts.map((part, partIndex) =>
                                    part.type === 'waqf'
                                        ? <WaqfSign key={partIndex} char={part.char} lang={lang} riwaya={riwaya} />
                                        : <React.Fragment key={partIndex}>{part.text}</React.Fragment>
                                )}
                            </span>
                            {wordIndex < words.length - 1 ? (nextWord?.isMarker ? "\u202F" : " ") : null}
                        </React.Fragment>
                    );
                })}
            </span>
            {karaoke ? (
                <TajweedKaraoke rootRef={rootRef} words={words} plainText={plainText} karaoke={karaoke} />
            ) : null}
        </span>
    );
}

/* ────────────────────────────────────────────────────────────────────────
 * Fallback path (browsers without CSS.highlights, e.g. Safari < 17.2):
 * one coloured <span> per rule, with zero-width joiners at the boundaries so
 * WebKit keeps the joined letter forms across inline runs.
 * ──────────────────────────────────────────────────────────────────────── */

const TajweedRuleSegment = React.memo(function TajweedRuleSegment({
    text,
    ruleId,
    color,
    lang,
    fallbackRule,
}) {
    const { name, desc } = getRuleLabel(ruleId, lang, fallbackRule);

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

// Arabic characters that join to the following letter (dual-joining letters)
// Excludes right-joining only: ا أ إ آ د ذ ر ز و ؤ ة ى ٱ
const ARABIC_DUAL_JOINING_RE = /[\u0628\u062A\u062B\u062C\u062D\u062E\u0633\u0634\u0635\u0636\u0637\u0638\u0639\u063A\u0641\u0642\u0643\u0644\u0645\u0646\u0647\u064A\u0626\u067E\u0686\u06AF\u06CC\u06BA]/u;
// All Arabic base letters that can connect to a preceding letter
const ARABIC_ANY_JOINING_RE = /[\u0621-\u064A\u0671-\u06D3]/u;

function getLastBaseChar(str) {
    if (!str) return '';
    const clean = str.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u200C\u200D\u200E\u200F]/gu, '');
    return clean.slice(-1);
}

function getFirstBaseChar(str) {
    if (!str) return '';
    const clean = str.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u200C\u200D\u200E\u200F]/gu, '');
    return clean.charAt(0);
}

function shapeWordSegments(wordSegments) {
    if (!Array.isArray(wordSegments) || wordSegments.length <= 1) return wordSegments;

    return wordSegments.map((seg, idx) => {
        let text = seg.text;
        const isFirst = idx === 0;
        const isLast = idx === wordSegments.length - 1;

        if (!isFirst) {
            const prevLast = getLastBaseChar(wordSegments[idx - 1].text);
            const currFirst = getFirstBaseChar(text);
            if (ARABIC_DUAL_JOINING_RE.test(prevLast) && ARABIC_ANY_JOINING_RE.test(currFirst)) {
                // NEVER insert ZWJ (\u200D) between Lam and Alef!
                // Lam-Alef is an indivisible OpenType ligature, not standard cursive joining.
                // Inserting ZWJ breaks the ligature into a severed '\' and isolated Alef.
                const isLamAlef = prevLast === '\u0644' && /^[\u0622\u0623\u0625\u0627\u0671]$/u.test(currFirst);
                if (!isLamAlef && !text.startsWith('\u200D')) {
                    text = '\u200D' + text;
                }
            }
        }

        if (!isLast) {
            const currLast = getLastBaseChar(text);
            const nextFirst = getFirstBaseChar(wordSegments[idx + 1].text);
            if (ARABIC_DUAL_JOINING_RE.test(currLast) && ARABIC_ANY_JOINING_RE.test(nextFirst)) {
                const isLamAlef = currLast === '\u0644' && /^[\u0622\u0623\u0625\u0627\u0671]$/u.test(nextFirst);
                if (!isLamAlef && !text.endsWith('\u200D')) {
                    text = text + '\u200D';
                }
            }
        }

        return text === seg.text ? seg : { ...seg, text };
    });
}

function normalizeWordSegments(wordSegments) {
    if (!Array.isArray(wordSegments) || wordSegments.length <= 1) return wordSegments;
    const fullText = wordSegments.map((s) => s.text).join('');
    if (/^[\u0641\u0644\u0628][\u064B-\u065F]*[\u0649\u064A\u0622\u0623\u0625\u0627\u0671][\u0653]?$/u.test(fullText)) {
        const maddSeg = wordSegments.find((s) => s.ruleId && s.ruleId.startsWith('madd'));
        if (maddSeg) {
            return [{ text: fullText, ruleId: maddSeg.ruleId }];
        }
        if (fullText.includes('\u0644')) {
            const nonSilentSeg = wordSegments.find((s) => s.ruleId && s.ruleId !== 'silent');
            return [{ text: fullText, ruleId: nonSilentSeg ? nonSilentSeg.ruleId : null }];
        }
    }
    return wordSegments;
}

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
                    words.push(shapeWordSegments(normalizeWordSegments(currentWord)));
                    currentWord = [];
                }
            } else {
                currentWord.push({ text: part, ruleId: seg.ruleId });
            }
        }
    }
    if (currentWord.length > 0) {
        words.push(shapeWordSegments(normalizeWordSegments(currentWord)));
    }
    return words;
}

function TajweedSegmentWords({
    segments,
    lang,
    riwaya,
    surahNum,
    ayahNumber,
    tajweedColors,
    ruleMetadata,
}) {
    const renderSegment = (seg, key) => {
        const color = seg.ruleId ? resolveRuleColor(seg.ruleId, tajweedColors) : 'inherit';

        if (WAQF_SPLIT_RE.test(seg.text)) {
            return seg.text.split(WAQF_SPLIT_RE).map((part, index) =>
                WAQF_SPLIT_RE.test(part)
                    ? <WaqfSign key={`${key}-${index}`} char={part} lang={lang} riwaya={riwaya} />
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
        <span className="quran-tajwid-text" dir="rtl" lang="ar" data-tajwid-render="segments">
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
                                className={isMarker ? (isNonVerseQuranSign(firstText) ? "quran-annotation-marker" : "native-ayah-marker") : "quran-word-item cursor-pointer"}
                                onClick={!isMarker ? handleClick : undefined}
                                role={isNonVerseQuranSign(firstText) ? undefined : "button"}
                                tabIndex={isNonVerseQuranSign(firstText) ? undefined : 0}
                                aria-label={!isNonVerseQuranSign(firstText) && isMarker ? getVerseLabel(lang, ayahNumber) : undefined}
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
    karaoke = null,  // { isFirstAyah, calibration } while the ayah is recited
    signVariant = null, // reading face family, see getFontSignVariant()
}) {
    const { lang } = useAppLocale();
    const segments = useMemo(() => {
        if (!enabled || !text) return null;
        try {
            const parsed = parseQuranComTajweedHtml(text) || parseTajwid(text, riwaya);
            if (!parsed || !signVariant) return parsed;
            // The Tajweed text is canonical Uthmani; the QPC faces draw their
            // own forms of the ishmam and silent-letter signs.
            return parsed.map((segment) => ({
                ...segment,
                text: applyFontSigns(segment.text, signVariant),
            }));
        } catch {
            return null;
        }
    }, [text, riwaya, enabled, signVariant]);
    const ruleMetadata = useMemo(
        () => new Map(getRulesForRiwaya(riwaya).map((rule) => [rule.id, rule])),
        [riwaya],
    );
    const highlightWords = useMemo(
        () => (TAJWEED_HIGHLIGHTS_SUPPORTED && segments && segments.length > 0
            ? buildHighlightWords(segments)
            : null),
        [segments],
    );

    if (!text) return null;

    // Simple plain text path (handling waqf even if tajwed is off)
    if (!enabled || !segments || segments.length === 0) {
        if (WAQF_SPLIT_RE.test(text)) {
            const parts = text.split(WAQF_SPLIT_RE);
            return (
                <span>
                    {parts.map((p, j) => 
                        WAQF_SPLIT_RE.test(p) 
                            ? <WaqfSign key={j} char={p} lang={lang} riwaya={riwaya} />
                            : p
                    )}
                </span>
            );
        }
        return <span>{text}</span>;
    }

    if (highlightWords) {
        return (
            <TajweedHighlightWords
                words={highlightWords}
                plainText={segments.map((segment) => segment.text).join('')}
                lang={lang}
                riwaya={riwaya}
                surahNum={surahNum}
                ayahNumber={ayahNumber}
                tajweedColors={tajweedColors}
                ruleMetadata={ruleMetadata}
                karaoke={karaoke}
            />
        );
    }

    return (
        <TajweedSegmentWords
            segments={segments}
            lang={lang}
            riwaya={riwaya}
            surahNum={surahNum}
            ayahNumber={ayahNumber}
            tajweedColors={tajweedColors}
            ruleMetadata={ruleMetadata}
        />
    );
});

export default TajweedText;
