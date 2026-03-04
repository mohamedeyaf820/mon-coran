import React, { useState } from 'react';
import * as tajwidRules from '../../data/tajwidRules';

/**
 * TajweedLegend component – interactive guide to tajwid colors.
 */
const TajweedLegend = React.memo(function TajweedLegend({ lang, visible, riwaya }) {
    const [open, setOpen] = useState(false);

    if (!visible) return null;

    const labelKey = lang === 'ar' ? 'nameAr' : lang === 'fr' ? 'nameFr' : 'nameEn';
    const rules = typeof tajwidRules.getRulesForRiwaya === 'function'
        ? tajwidRules.getRulesForRiwaya(riwaya)
        : (riwaya === 'warsh' && Array.isArray(tajwidRules.WARSH_TAJWID_RULES)
            ? tajwidRules.WARSH_TAJWID_RULES
            : (Array.isArray(tajwidRules.default) ? tajwidRules.default : []));
    const isWarsh = riwaya === 'warsh';

    return (
        <>
            <div className="tajweed-legend-toggle">
                <button onClick={() => setOpen(o => !o)}>
                    <i className="fas fa-palette"></i>
                    <span>
                        {lang === 'ar'
                            ? (isWarsh ? 'ألوان تجويد ورش' : 'ألوان التجويد')
                            : lang === 'fr'
                                ? (isWarsh ? 'Couleurs Tajweed Warsh' : 'Couleurs Tajweed')
                                : (isWarsh ? 'Warsh Tajweed colours' : 'Tajweed colours')
                        }
                    </span>
                    <i className={`fas fa-chevron-${open ? 'up' : 'down'}`} style={{ fontSize: '0.55rem', opacity: 0.6 }}></i>
                </button>
            </div>
            {open && (
                <div className="tajweed-legend">
                    {rules.map(rule => (
                        <span key={rule.id} className="tajweed-legend-item">
                            <span className="tajweed-dot" style={{ background: rule.color }}></span>
                            <span>{rule[labelKey]}</span>
                        </span>
                    ))}
                </div>
            )}
        </>
    );
});

export default TajweedLegend;
