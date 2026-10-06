import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { getRulesForRiwaya, TAJWID_RULE_DESCRIPTIONS } from '../../data/tajwidRules';
import { useAppLocale } from '../../context/AppContext';
import { t as i18nT } from '../../i18n';
import { playWordAudio, getWordAudioUrl } from '../../utils/wordAudio';
import {
    clearTajweedHoverRange,
    clearTajweedPlayingRange,
    getTextRangeRects,
    rectsContainPoint,
    setTajweedHoverRange,
    setTajweedPlayingRange,
    supportsTajweedHighlights,
    unionRects,
} from '../../utils/tajweedHighlights';
import { CLIP_PAINT_SUPPORTED, clearTajweedWordPaint, paintTajweedWord } from '../../utils/tajweedWordPaint';
import { normalizeTajwidAnnotation, withTajwidPresentationSuffix, getWholeWordTajwidRule } from '../../utils/tajwidAnnotation';
import { splitTajwidIntoWords } from '../../utils/tajwidWords';
import useKaraokeWordIndex from '../../hooks/useKaraokeWordIndex';

const AYAH_MARKER_TOKEN_RE = /^[\u06DD\u06DE\u06E9\uFC00-\uFD1C\uFD3F\uFD3E\d\u0660-\u0669\u06F0-\u06F9]+$/u;
function isMarkerToken(str) {
    if (!str) return false;
    const compact = String(str).replace(/\s+/g, '');
    return AYAH_MARKER_TOKEN_RE.test(compact);
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

export function getWaqfHelp(text, lang) {
    const language = lang === 'ar' || lang === 'en' ? lang : 'fr';
    const signs = [...new Set(String(text || '').match(/[\u06D6-\u06DC]/gu) || [])];
    return signs.map((sign) => {
        const rule = WAQF_RULES[sign];
        return rule ? `${rule.name[language]} : ${rule.desc[language]}` : '';
    }).filter(Boolean).join(' · ') || undefined;
}



function getVerseLabel(lang, ayahNumber) {
    if (!ayahNumber) return undefined;
    const word = i18nT('quran.verseLabel', lang);
    return `${word} ${ayahNumber}`;
}

function getRuleLabel(ruleId, lang, fallbackRule) {
    const activeLang = lang === 'ar' || lang === 'en' || lang === 'fr' ? lang : 'fr';
    const rule = TAJWID_RULE_DESCRIPTIONS[ruleId];
    const fallbackNameKey = activeLang === 'ar' ? 'nameAr' : activeLang === 'en' ? 'nameEn' : 'nameFr';
    const name = fallbackRule?.[fallbackNameKey] || rule?.name?.[activeLang]
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

// User colour overrides: the rule bands and the word colours resolve var()
// against the originating element, so scoping the variables on the tajweed
// root is enough for every path.
function useTajweedColorVars(tajweedColors) {
    return useMemo(() => {
        if (!tajweedColors) return undefined;
        const style = {};
        for (const [ruleId, color] of Object.entries(tajweedColors)) {
            if (color) style[`--tajwid-${ruleId}`] = color;
        }
        return style;
    }, [tajweedColors]);
}

// Waqf signs inside a word are combining marks. Keep them in the same text
// node as their base letter; wrapping one in WaqfSign detaches its glyph.

/* ────────────────────────────────────────────────────────────────────────
 * Highlight path (default): one text node per word, rule colours painted as a
 * gradient clipped to that word's own text. See src/utils/tajweedWordPaint.js.
 *
 * Splitting a word into one <span> per rule breaks Arabic shaping: WebKit
 * shapes each inline run separately (letters lose their joined forms) and every
 * engine loses the cursive attachment of the kashida carrying a dagger alif.
 * Sub-word ::highlight() ranges break it too — Chromium re-shapes the painted
 * sub-run, which prints the alif of لَا as a detached stroke. The word is
 * therefore shaped once and coloured afterwards, band by band.
 *
 * The precise ranges stay in `rules`: they drive the tooltip hit-testing and
 * anchor, which never touch the ink.
 * ──────────────────────────────────────────────────────────────────────── */

const TAJWEED_HIGHLIGHTS_SUPPORTED = supportsTajweedHighlights();

function buildHighlightWords(segments) {
    const { words } = splitTajwidIntoWords(segments);
    return words.map(word => ({ ...word, isMarker: isMarkerToken(word.text), parts: [{ type: 'text', text: word.text, rules: word.ranges }] }));
}

function TajweedWordFallback({ words, lang, riwaya, surahNum, ayahNumber, tajweedColors, ruleMetadata, wordAudioIsAligned }) {
    const rootRef = useRef(null);
    const colorVars = useTajweedColorVars(tajweedColors);

    // Engines that clip a gradient to text reliably paint the rule bands here
    // too. WebKit makes the fill transparent but clips the gradient to a few
    // glyph fragments, so on that engine each word keeps one shaped text node
    // and stays plain unless one verified rule covers its entire text.
    useLayoutEffect(() => {
        if (!CLIP_PAINT_SUPPORTED) return undefined;
        const root = rootRef.current;
        if (!root) return undefined;

        const painted = [];
        root.querySelectorAll('[data-tajwid-word]').forEach((wordEl) => {
            const word = words[Number(wordEl.getAttribute('data-tajwid-word'))];
            const rules = word?.parts?.flatMap((part) => part.rules || []);
            if (!rules?.length) return;
            painted.push([wordEl, rules]);
            paintTajweedWord(wordEl, rules);
        });

        // Repainting once the Quran face has loaded is handled, batched, by
        // paintTajweedWord itself.
        return () => {
            for (const [wordEl] of painted) clearTajweedWordPaint(wordEl);
        };
    }, [words]);

    return (
        <span
            className="quran-tajwid-text"
            dir="rtl"
            lang="ar"
            data-tajwid-render="word-fallback"
            ref={rootRef}
            style={colorVars}
        >
            {words.map((word, wordIndex) => {
                const ranges = word.parts.flatMap((part) => part.rules || []);
                const firstRule = ranges[0];
                const wholeWordRule = getWholeWordTajwidRule(word.text, ranges);
                const ruleLabel = firstRule
                    ? getRuleLabel(firstRule.ruleId, lang, ruleMetadata.get(firstRule.ruleId))
                    : null;
                const ruleColor = firstRule
                    ? resolveRuleColor(firstRule.ruleId, tajweedColors)
                    : undefined;
                const audioUrl = !word.isMarker && surahNum && ayahNumber
                    ? getWordAudioUrl(surahNum, ayahNumber, wordIndex + 1)
                    : null;
                const play = wordAudioIsAligned && riwaya === 'hafs' && !word.isMarker
                    ? (event) => {
                        event.stopPropagation();
                        playWordAudio(audioUrl || { surah: surahNum, ayah: ayahNumber, position: wordIndex + 1 });
                    }
                    : undefined;

                return (
                    <React.Fragment key={wordIndex}>
                        {word.prefix || null}
                        <span
                            className={word.isMarker ? "native-ayah-marker" : play ? "quran-word-item cursor-pointer" : "quran-word-item"}
                            data-tajwid-word={wordIndex}
                            data-tajwid={firstRule?.ruleId}
                            data-tajwid-name={ruleLabel?.name}
                            data-tajwid-desc={ruleLabel?.desc}
                            data-tajwid-color={ruleColor}
                            title={getWaqfHelp(word.text, lang)}
                            style={!CLIP_PAINT_SUPPORTED && wholeWordRule && !word.isMarker ? { color: resolveRuleColor(wholeWordRule, tajweedColors) } : undefined}
                            onClick={play}
                            onKeyDown={play ? (event) => {
                                if (event.key === "Enter" || event.key === " ") {
                                    event.preventDefault();
                                    play(event);
                                }
                            } : undefined}
                            role={play ? "button" : undefined}
                            tabIndex={play ? 0 : undefined}
                            aria-label={word.isMarker ? getVerseLabel(lang, ayahNumber) : undefined}
                        >
                            {word.text}
                        </span>
                        {word.separator || null}
                    </React.Fragment>
                );
            })}
        </span>
    );
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
    wordAudioIsAligned,
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
    const colorVars = useTajweedColorVars(tajweedColors);

    useLayoutEffect(() => {
        const root = rootRef.current;
        if (!root) return undefined;

        const painted = [];
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
                if (!node || part.rules.length === 0) continue;
                const nodeText = node.data;
                const partText = part.text;
                if (nodeText !== partText) continue;
                painted.push([wordEl, part.rules]);
                paintTajweedWord(wordEl, part.rules);
                const list = entries.get(wordIndex) || [];
                for (const rule of part.rules) list.push({ node, ...rule });
                entries.set(wordIndex, list);
            }
        });

        hitEntriesRef.current = entries;

        // The bands are percentages of the word's own box, so they survive a
        // font-size change, but not a change of face; paintTajweedWord repaints
        // the batch, once, when the Quran face has loaded.
        return () => {
            for (const [wordEl] of painted) clearTajweedWordPaint(wordEl);
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
        // Some engines round Arabic glyph ranges differently from the word
        // box. Keep the guide usable when the pointer is visibly over a word
        // that contains one or more coloured rules.
        const wordRect = wordEl.getBoundingClientRect();
        if (rectsContainPoint([wordRect], x, y)) return list[0] || null;
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
                    const canPlayWord = wordAudioIsAligned && riwaya === 'hafs' && !word.isMarker;
                    const audioUrl = canPlayWord && surahNum && ayahNumber
                        ? getWordAudioUrl(surahNum, ayahNumber, wordIndex + 1)
                        : null;
                    const firstRule = word.parts
                        .flatMap((part) => part.rules || [])[0];
                    const firstRuleLabel = firstRule
                        ? getRuleLabel(firstRule.ruleId, lang, ruleMetadata.get(firstRule.ruleId))
                        : null;

                    return (
                        <React.Fragment key={wordIndex}>
                            {word.prefix || null}
                            <span
                                className={word.isMarker ? "native-ayah-marker" : canPlayWord ? "quran-word-item cursor-pointer" : "quran-word-item"}
                                data-tajwid-word={wordIndex}
                                data-tajwid-name={firstRuleLabel?.name}
                                data-tajwid-desc={firstRuleLabel?.desc}
                                data-tajwid-color={firstRule ? resolveRuleColor(firstRule.ruleId, tajweedColors) : undefined}
                                title={getWaqfHelp(word.text, lang)}
                                onClick={canPlayWord
                                    ? (event) => handleWordClick(event, wordIndex, audioUrl)
                                    : undefined}
                                onKeyDown={canPlayWord
                                    ? (event) => {
                                        if (event.key === "Enter" || event.key === " ") {
                                            event.preventDefault();
                                            handleWordClick(event, wordIndex, audioUrl);
                                        }
                                    }
                                    : undefined}
                                role={canPlayWord ? "button" : undefined}
                                tabIndex={canPlayWord ? 0 : undefined}
                                aria-label={word.isMarker ? getVerseLabel(lang, ayahNumber) : undefined}
                                style={{ display: "inline" }}
                            >
                                {word.text}
                            </span>
                            {word.separator || null}
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



/**
 * TajweedText — renders Arabic text with Tajweed colour-coding.
 * Plus custom 'Waqf' (Stop Signs) redesign for Expert UI/UX (Sakīna).
 */
const TajweedText = React.memo(function TajweedText({
    text,
    originalText,
    tajwidSource,
    wordAudioIsAligned = true,
    enabled = true,
    riwaya = 'hafs',
    tajweedColors,   // optional object { ruleId → cssColor } override
    surahNum,
    ayahNumber,
    karaoke = null,  // { isFirstAyah, calibration } while the ayah is recited
}) {
    const { lang } = useAppLocale();
    const annotation = useMemo(
        () => tajwidSource
            ? withTajwidPresentationSuffix(tajwidSource, originalText)
            : normalizeTajwidAnnotation(originalText, text, { riwaya }),
        [originalText, text, riwaya, tajwidSource],
    );
    const segments = useMemo(
        () => (enabled ? annotation.segments : [{ text: annotation.text, ruleId: null }]),
        [enabled, annotation],
    );
    const ruleMetadata = useMemo(
        () => new Map(getRulesForRiwaya(riwaya).map((rule) => [rule.id, rule])),
        [riwaya],
    );
    const highlightWords = useMemo(
        () => (segments && segments.length > 0 ? buildHighlightWords(segments) : null),
        [segments],
    );

    if (!annotation.text) return null;

    // Plain text keeps every combining mark attached to its base letter.
    if (!enabled || !highlightWords?.length) {
        return <span title={getWaqfHelp(annotation.text, lang)}>{annotation.text}</span>;
    }

    if (TAJWEED_HIGHLIGHTS_SUPPORTED && highlightWords) {
        return (
            <span data-tajwid-status={annotation.status} data-tajwid-diagnostic={annotation.diagnostic?.code}><TajweedHighlightWords
                words={highlightWords}
                wordAudioIsAligned={wordAudioIsAligned}
                plainText={segments.map((segment) => segment.text).join('')}
                lang={lang}
                riwaya={riwaya}
                surahNum={surahNum}
                ayahNumber={ayahNumber}
                tajweedColors={tajweedColors}
                ruleMetadata={ruleMetadata}
                karaoke={karaoke}
            /></span>
        );
    }

    // Older engines cannot paint sub-ranges without splitting the cursive run;
    // keep each word as one shaped text node rather than producing broken glyphs.
    return <span data-tajwid-status={annotation.status} data-tajwid-diagnostic={annotation.diagnostic?.code}><TajweedWordFallback words={highlightWords} wordAudioIsAligned={wordAudioIsAligned} lang={lang} riwaya={riwaya} surahNum={surahNum} ayahNumber={ayahNumber} tajweedColors={tajweedColors} ruleMetadata={ruleMetadata} /></span>;
});

export default TajweedText;
