import React from "react";
import AyahActions from "../AyahActions";

export default function AyahActionsModal({
  activeAyah,
  onClose,
  surah,
  ayahData,
}) {
  if (!activeAyah) return null;

  return (
    <div className="ayah-actions-modal-overlay" onClick={onClose}>
      <div
        className="ayah-actions-modal-content animate-reveal-up"
        onClick={(event) => event.stopPropagation()}
      >
        <button className="ayah-actions-modal-close" onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>
        <AyahActions
          surah={surah}
          ayah={ayahData?.numberInSurah || activeAyah}
          ayahData={ayahData}
        />
      </div>
    </div>
  );
}
