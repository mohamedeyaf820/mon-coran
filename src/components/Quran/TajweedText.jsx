import React, { useMemo } from 'react';
import { parseTajwid } from '../../data/tajwidRules';

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
