import React from 'react';

/**
 * TajwidText component.
 *
 * Tajweed color-coding is disabled: the regex-based rules produce incorrect
 * highlights on many verses and the GPOS-dependent KFGQPC font renders
 * diacritics as black dots when text is split into coloured spans.
 * The component now renders plain un-styled text in all cases.
 * The `enabled` prop is accepted for API compatibility but ignored.
 */
const TajwidText = React.memo(function TajwidText({ text }) {
    return <span>{text}</span>;
});

export default TajwidText;

