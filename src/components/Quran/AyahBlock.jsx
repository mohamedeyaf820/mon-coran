import React from 'react';
import { toAr } from '../../data/surahs';
import { t } from '../../i18n';
import AyahActions from '../AyahActions';
import SmartAyahRenderer from './SmartAyahRenderer';
import WordByWordDisplay from './WordByWordDisplay';

/**
 * AyahBlock component – renders a single verse with metadata and actions.
 */
const AyahBlock = React.memo(function AyahBlock({
    ayah, isPlaying, isActive, trans, showTajwid, showTranslation,
    showWordByWord, showTransliteration, showWordTranslation,
    surahNum, calibration, riwaya, lang, onToggleActive, ayahId,
    progress, fontSize,
}) {
    return (
        <div
            id={ayahId}
            role="listitem"
            aria-label={`${t('quran.ayah', lang)} ${ayah.numberInSurah}`}
            aria-current={isPlaying ? 'true' : undefined}
            className={`ayah-block${isPlaying ? ' playing' : ''}${isActive ? ' active' : ''}${showWordByWord ? ' wbw-mode' : ''}`}
            onClick={onToggleActive}
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onToggleActive();
                }
            }}
        >
            <div className="ayah-text-ar">
                {/* WordByWordDisplay handles Hafs only (fetches per-word translations).
                    For Warsh QCF4 (ayah.warshWords), SmartAyahRenderer handles
                    both the QCF4 rendering AND the karaoke highlighting internally. */}
                {showWordByWord && !(ayah.warshWords?.length > 0) ? (
                    <WordByWordDisplay
                        surah={surahNum}
                        ayah={ayah.numberInSurah}
                        text={ayah.text}
                        isPlaying={isPlaying}
                        progress={progress}
                        showTransliteration={showTransliteration}
                        showWordTranslation={showWordTranslation}
                        fontSize={fontSize}
                    />
                ) : (
                    <SmartAyahRenderer
                        ayah={ayah}
                        showTajwid={showTajwid}
                        isPlaying={isPlaying}
                        surahNum={surahNum}
                        calibration={calibration}
                        riwaya={riwaya}
                    />
                )}
                <span className="ayah-number">
                    ﴿{lang === 'ar' ? toAr(ayah.numberInSurah) : ayah.numberInSurah}﴾
                </span>
            </div>
            {showTranslation && trans && !showWordByWord && (
                <div className="ayah-translation">{trans.text}</div>
            )}
            {ayah.juz && (
                <span className="ayah-juz-badge">{t('sidebar.juz', lang)} {ayah.juz}</span>
            )}
            {isActive && (
                <AyahActions surah={surahNum} ayah={ayah.numberInSurah} ayahData={ayah} />
            )}
        </div>
    );
});

export default AyahBlock;
