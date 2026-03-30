import React from 'react';

/**
 * Bismillah component – renders the opening ornament.
 */
const Bismillah = React.memo(function Bismillah() {
    return (
        <div className="bismillah animate-in fade-in zoom-in-95 duration-700">
            <div className="bismillah-ornament bismillah-ornament--left" />
            <span className="bismillah-text">بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ</span>
            <div className="bismillah-ornament bismillah-ornament--right" />
        </div>
    );
});

export default Bismillah;
