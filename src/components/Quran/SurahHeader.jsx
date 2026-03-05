import React from 'react';
import { getSurah, toAr } from '../../data/surahs';
import { t } from '../../i18n';

/**
 * SurahHeader component – renders the decorative header for each surah.
 */
const SurahHeader = React.memo(function SurahHeader({ surahNum, lang }) {
    const s = getSurah(surahNum);
    if (!s) return null;

    const surahLabel = lang === 'ar' ? toAr(surahNum) : surahNum;

    return (
        <div className="surah-header">
            <div className="surah-header-frame">
                <div className="surah-header-inner">
                    {/* Surah number chip */}
                    <span className="surah-header-num-chip">{surahLabel}</span>
                    {/* Arabic name */}
                    <span className="surah-header-name">{s.ar}</span>
                    {/* Metadata row */}
                    <span className="surah-header-info">
                        {lang === 'fr' ? s.fr : lang === 'en' ? s.en : s.en}
                        &nbsp;·&nbsp;
                        {s.ayahs}&nbsp;{t('quran.ayahs', lang)}
                        &nbsp;·&nbsp;
                        {s.type === 'Meccan'
                            ? t('quran.meccan', lang)
                            : t('quran.medinan', lang)
                        }
                    </span>
                </div>
            </div>
        </div>
    );
});

export default SurahHeader;
