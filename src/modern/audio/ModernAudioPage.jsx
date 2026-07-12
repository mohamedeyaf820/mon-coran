import { useMemo, useState } from "react";
import { Check, Clock3, Headphones, Play, Search } from "lucide-react";
import { getReciterVisual } from "../../data/reciters";
import { getSurah } from "../../data/surahs";
import { formatAudioTime } from "./audioModel";
import { useModernAudio } from "./ModernAudioProvider";

function ReciterAvatar({ visual }) {
  const [failed, setFailed] = useState(false);
  if (visual.photo && !failed) {
    return <img alt="" onError={() => setFailed(true)} src={visual.photo} />;
  }
  return <span style={{ background: visual.avatar.color }}>{visual.avatar.initials}</span>;
}

export function ModernAudioPage() {
  const audio = useModernAudio();
  const [query, setQuery] = useState("");
  const reciters = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("fr");
    return audio.reciters.filter((reciter) =>
      !normalized || [reciter.name, reciter.nameFr, reciter.nameEn].some((value) => String(value || "").toLocaleLowerCase("fr").includes(normalized)),
    );
  }, [audio.reciters, query]);

  return (
    <main className="modern-audio-page" id="modern-main">
      <header className="modern-audio-page__heading">
        <div><p className="modern-eyebrow">Ecouter le Coran</p><h1>Une recitation qui reste avec vous.</h1></div>
        <p>Choisissez une voix, reprenez votre écoute et gardez la file visible sans quitter le texte.</p>
      </header>

      {audio.savedResume && !audio.current && (
        <section className="modern-audio-resume" aria-labelledby="audio-resume-title">
          <Clock3 size={22} />
          <div><p className="modern-eyebrow">Derniere ecoute</p><h2 id="audio-resume-title">{getSurah(audio.savedResume.surah)?.en} · verset {audio.savedResume.ayah}</h2><p>Reprendre à {formatAudioTime(audio.savedResume.currentTime)}</p></div>
          <button onClick={audio.resumeSaved} type="button"><Play size={18} fill="currentColor" /> Reprendre</button>
        </section>
      )}

      <section className="modern-audio-library" aria-labelledby="reciters-title">
        <div className="modern-section-heading modern-section-heading--search">
          <div><p className="modern-eyebrow">Voix disponibles · {audio.riwaya.toUpperCase()}</p><h2 id="reciters-title">Recitateurs</h2></div>
          <label className="modern-home__search"><Search size={18} /><input aria-label="Rechercher un recitateur" onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher une voix" type="search" value={query} /></label>
        </div>
        <div className="modern-reciter-list">
          {reciters.slice(0, 24).map((reciter) => {
            const visual = getReciterVisual(reciter);
            const selected = reciter.id === audio.reciterId;
            return (
              <button aria-pressed={selected} className={selected ? "is-selected" : ""} key={reciter.id} onClick={() => audio.changeReciter(reciter.id)} type="button">
                <ReciterAvatar visual={visual} />
                <span><strong>{reciter.nameFr || reciter.nameEn}</strong><small>{reciter.style === "mujawwad" ? "Mujawwad" : "Murattal"}</small></span>
                {selected && <Check size={18} />}
              </button>
            );
          })}
        </div>
      </section>

      <section className="modern-audio-queue" aria-labelledby="queue-title">
        <div><p className="modern-eyebrow">Lecture en cours</p><h2 id="queue-title">File d'attente</h2></div>
        {audio.queue.length ? (
          <ol>{audio.queue.map((item, index) => <li className={index === audio.index ? "is-current" : ""} key={`${item.surah}:${item.ayah}`}><span>{index + 1}</span><span><strong>{getSurah(item.surah)?.en}</strong><small>Verset {item.ayah}</small></span>{index === audio.index && <Headphones size={17} />}</li>)}</ol>
        ) : (
          <div className="modern-audio-queue__empty"><Headphones size={25} /><p>La file apparaitra ici lorsque vous lancerez un verset.</p><a href="/surah/1">Ouvrir une sourate</a></div>
        )}
      </section>
    </main>
  );
}
