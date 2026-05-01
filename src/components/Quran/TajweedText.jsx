import React, { useMemo } from 'react';
import { parseTajwid } from '../../data/tajwidRules';

const QURAN_COM_CLASS_MAP = {
    ghunnah: 'ghunna',
    ghunna: 'ghunna',
    ikhafa: 'ikhfa',
    ikhfa: 'ikhfa',
    idgham_ghunnah: 'idgham',
    idgham_without_ghunnah: 'idgham',
    idgham_wo_ghunnah: 'idgham',
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
            if (node.textContent) segments.push({ text: node.textContent, ruleId: inheritedRule });
            return;
        }

        if (node.nodeType !== Node.ELEMENT_NODE) return;
        if (isVerseEndNode(node)) return;

        const localRule = ruleFromClassName(node.getAttribute('class')) || inheritedRule;
        node.childNodes.forEach((child) => walk(child, localRule));
    };

    doc.body.childNodes.forEach((node) => walk(node, null));
    return segments.filter((segment) => segment.text);
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
}) {
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

    const waqfRegex = /([\u06D6-\u06DC])/g;

    if (!text) return null;

    // Simple plain text path (handling waqf even if tajwed is off)
    if (!enabled || !segments || segments.length === 0) {
        if (waqfRegex.test(text)) {
            const parts = text.split(waqfRegex);
            return (
                <span>
                    {parts.map((p, j) => 
                        waqfRegex.test(p) 
                            ? <span key={j} className="waqf-marker" title="Stop Sign">{p}</span>
                            : p
                    )}
                </span>
            );
        }
        return <span>{text}</span>;
    }

    return (
        <span>
            {segments.map((seg, i) => {
                const color = seg.ruleId
                    ? (tajweedColors && tajweedColors[seg.ruleId]) || `var(--tajwid-${seg.ruleId})`
                    : 'inherit';

                // Redesign: Waqf markers identification within segments
                if (waqfRegex.test(seg.text)) {
                    const parts = seg.text.split(waqfRegex);
                    return (
                        <span key={i} style={{ color }} data-tajwid={seg.ruleId || 'none'}>
                            {parts.map((p, j) => 
                                waqfRegex.test(p) 
                                    ? <span key={j} className="waqf-marker" title="Stop Sign">{p}</span>
                                    : p
                            )}
                        </span>
                    );
                }

                if (!seg.ruleId) {
                    return <React.Fragment key={i}>{seg.text}</React.Fragment>;
                }

                return (
                    <span
                        key={i}
                        style={{ color }}
                        data-tajwid={seg.ruleId}
                        aria-label={seg.ruleId}
                    >
                        {seg.text}
                    </span>
                );
            })}
        </span>
    );
});

export default TajweedText;
