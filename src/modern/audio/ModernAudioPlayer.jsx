import { Headphones, ListMusic, Pause, Play, SkipBack, SkipForward, Square } from "lucide-react";
import { getSurah } from "../../data/surahs";
import { formatAudioTime } from "./audioModel";
import { useModernAudio } from "./ModernAudioProvider";

export function ModernAudioPlayer() {
  const audio = useModernAudio();
  if (!audio.current && audio.status === "idle") return null;
  const surah = getSurah(audio.current?.surah);
  const progress = audio.duration ? Math.min(100, (audio.currentTime / audio.duration) * 100) : 0;
  return (
    <aside className="modern-audio-player" aria-label="Lecteur audio">
      <div className="modern-audio-player__track">
        <Headphones size={20} />
        <span><strong>{surah?.en || "Recitation"}</strong><small>{audio.current?.ayah ? `Verset ${audio.current.ayah}` : "Sourate complete"} · {audio.reciter?.nameFr}</small></span>
      </div>
      <label className="modern-audio-player__reciter"><span>Recitateur</span><select aria-label="Changer de recitateur" onChange={(event) => audio.changeReciter(event.target.value)} value={audio.reciterId}>{audio.reciters.map((reciter) => <option key={reciter.id} value={reciter.id}>{reciter.nameFr || reciter.nameEn}</option>)}</select></label>
      <div className="modern-audio-player__controls">
        <button aria-label="Verset precedent" onClick={audio.previous} type="button"><SkipBack size={19} /></button>
        <button aria-label={audio.status === "playing" ? "Mettre en pause" : "Lire"} className="is-primary" onClick={audio.toggle} type="button">
          {audio.status === "playing" ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
        </button>
        <button aria-label="Verset suivant" onClick={audio.next} type="button"><SkipForward size={19} /></button>
      </div>
      <div className="modern-audio-player__timeline">
        <input aria-label="Progression audio" max="100" min="0" onChange={(event) => audio.seekPercent(Number(event.target.value) / 100)} type="range" value={progress} />
        <span>{formatAudioTime(audio.currentTime)} / {formatAudioTime(audio.duration)}</span>
      </div>
      <div className="modern-audio-player__tools">
        <a aria-label="Ouvrir la file d'attente" href="/audio"><ListMusic size={19} /></a>
        <button aria-label="Arreter et fermer le lecteur" onClick={audio.stop} title="Arreter et fermer" type="button"><Square size={17} fill="currentColor" /></button>
      </div>
      {(audio.network === "buffering" || audio.network === "loading") && <span className="modern-audio-player__network" role="status">Chargement...</span>}
      {audio.error && <span className="modern-audio-player__error" role="alert">{audio.error}</span>}
    </aside>
  );
}
