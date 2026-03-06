import React from 'react';

/**
 * TajwidText component.
 * Tajweed coloring intentionally disabled to avoid incorrect rule rendering.
 */
const TajwidText = React.memo(function TajwidText({ text }) {
    if (!text) return null;
    return <span>{text}</span>;
});

export default TajwidText;

