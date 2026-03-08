import React, { useMemo } from 'react';
import { parseTajwid } from '../../data/tajwidRules';

/**
 * TajweedText — renders Arabic text with Tajweed colour-coding.
 *
 * Each segment produced by parseTajwid() that carries a ruleId is wrapped
 * in a <span> whose colour maps to the CSS variable --tajwid-{ruleId}.
 * Plain segments (ruleId === null) render without any wrapper.
 *
 * Performance: memoised on (text, riwaya, enabled) so repeated re-renders
 * from parent state changes are cheap.
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
            return parseTajwid(text, riwaya);
        } catch {
            return null;
        }
    }, [text, riwaya, enabled]);

    if (!text) return null;

    // Tajweed disabled or parse failed → plain text
    if (!enabled || !segments || segments.length === 0) {
        return <span>{text}</span>;
    }

    // Single plain segment → no extra DOM node
    if (segments.length === 1 && !segments[0].ruleId) {
        return <span>{text}</span>;
    }

    return (
        <span>
            {segments.map((seg, i) => {
                if (!seg.ruleId) {
                    return <React.Fragment key={i}>{seg.text}</React.Fragment>;
                }
                // Use CSS variable so themes can override individual colours
                const color = (tajweedColors && tajweedColors[seg.ruleId])
                    || `var(--tajwid-${seg.ruleId})`;
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
