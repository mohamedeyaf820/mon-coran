import React, { useMemo } from 'react';

/**
 * WordByWordText component – renders interactive word-by-word highlights.
 */
const WordByWordText = React.memo(function WordByWordText({ text, progress, lagWords = 0 }) {
    const words = useMemo(() => {
        if (!text) return [];
        return text.split(/\s+/).filter(w => w.length > 0);
    }, [text]);

    const wordWeights = useMemo(() => {
        if (words.length === 0) return [];
        const raw = words.map((w, idx) => {
            // Logic for word weights correctly calculated in the original component
            const base = w.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u06E1]/g, '');
            let weight = Math.max(1, base.length);

            const maddCount = (w.match(/[اوي\u0670\u0649]/g) || []).length;
            weight += maddCount * 0.8;

            if (/[اوي][\u0621\u0623\u0625\u0624\u0626]/.test(w)) weight += 1.0;
            const shaddaCount = (w.match(/\u0651/g) || []).length;
            weight += shaddaCount * 0.5;

            if (/[\u064B\u064C\u064D]/.test(w)) weight += 0.4;
            if (/[\u0652\u06E1]/.test(w.slice(-2))) weight += 0.2;
            if (/الله/.test(w)) weight += 0.8;
            if (idx === 0) weight += 0.3;
            if (idx === words.length - 1) weight += 0.5;

            return weight;
        });
        const total = raw.reduce((s, v) => s + v, 0);
        let cum = 0;
        return raw.map(w => {
            cum += w / total;
            return cum;
        });
    }, [words]);

    if (words.length === 0) return <span>{text}</span>;

    let currentWordIdx = 0;
    for (let i = 0; i < wordWeights.length; i++) {
        if (progress < wordWeights[i]) { currentWordIdx = i; break; }
        currentWordIdx = i;
    }
    currentWordIdx = Math.max(0, currentWordIdx - lagWords);

    return (
        <span className="wbw-container">
            {words.map((word, i) => {
                const isRead = i < currentWordIdx;
                const isCurrent = i === currentWordIdx;
                const isUpcoming = i > currentWordIdx;

                let cls = 'wbw-word';
                if (isRead) cls += ' wbw-read';
                else if (isCurrent) cls += ' wbw-current';
                else if (isUpcoming) cls += ' wbw-upcoming';

                return (
                    <span key={i} className={cls}>
                        {word}
                        {i < words.length - 1 ? ' ' : ''}
                    </span>
                );
            })}
        </span>
    );
});

export default WordByWordText;
