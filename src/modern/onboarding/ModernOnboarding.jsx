import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpenText, Check, Gauge, X } from "lucide-react";
import { getSettings, saveSettings } from "../../services/storageService";
import { completeOnboarding } from "./onboardingModel";

const profiles = [
  { id: "medina", label: "Medine", hint: "Composition Uthmani familiere" },
  { id: "maghrebi", label: "Maghrebin", hint: "Lecture aeree adaptee a Warsh" },
  { id: "clear", label: "Lecture claire", hint: "Contraste et caracteres plus grands" },
];

export function ModernOnboarding({ onClose, onThemeChange }) {
  const [step, setStep] = useState(0);
  const [settings, setSettings] = useState(() => getSettings());
  const dialogRef = useRef(null);
  const update = (patch) => {
    const next = { ...settings, ...patch };
    if (patch.riwaya) next.fontFamily = patch.riwaya === "warsh" ? "qpc-warsh" : "qpc-hafs";
    saveSettings(next);
    setSettings(next);
    window.dispatchEvent(new CustomEvent("modern-preferences-change", { detail: next }));
    if (patch.theme) onThemeChange(patch.theme);
  };
  const finish = () => { completeOnboarding(localStorage); onClose(); };
  useEffect(() => {
    dialogRef.current?.focus();
    const keyboard = (event) => { if (event.key === "Escape") finish(); };
    document.addEventListener("keydown", keyboard);
    return () => document.removeEventListener("keydown", keyboard);
  });

  return <div className="modern-onboarding-overlay"><section aria-label="Bienvenue dans Mon Coran" aria-modal="true" className="modern-onboarding" ref={dialogRef} role="dialog" tabIndex="-1">
    <header><div className="modern-onboarding__brand"><BookOpenText size={22} /><span>Mon Coran</span></div><button aria-label="Passer l'onboarding" onClick={finish} type="button"><X size={20} /></button></header>
    <div className="modern-onboarding__progress" aria-label={`Etape ${step + 1} sur 3`}>{[0, 1, 2].map((index) => <span className={index <= step ? "is-active" : ""} key={index} />)}</div>
    {step === 0 && <div className="modern-onboarding__content"><p className="modern-eyebrow">Votre lecture</p><h1>Retrouvez vos reperes</h1><p>Choisissez la tradition et la composition qui vous sont les plus naturelles.</p><div className="modern-onboarding__segmented"><button className={settings.riwaya === "hafs" ? "is-active" : ""} onClick={() => update({ riwaya: "hafs" })} type="button">Hafs</button><button className={settings.riwaya === "warsh" ? "is-active" : ""} onClick={() => update({ riwaya: "warsh" })} type="button">Warsh</button></div><div className="modern-onboarding__choices">{profiles.map((profile) => <button className={settings.mushafProfile === profile.id ? "is-active" : ""} key={profile.id} onClick={() => update({ mushafProfile: profile.id })} type="button"><strong>{profile.label}</strong><small>{profile.hint}</small>{settings.mushafProfile === profile.id && <Check size={17} />}</button>)}</div><p className="modern-onboarding__arabic" dir="rtl" lang="ar">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</p></div>}
    {step === 1 && <div className="modern-onboarding__content"><p className="modern-eyebrow">Votre confort</p><h1>Une page qui respire</h1><p>Ces choix restent modifiables et sont conserves dans toutes les vues.</p><label className="modern-onboarding__toggle"><span><strong>Afficher la traduction</strong><small>Francais sous le texte arabe</small></span><input checked={settings.showTranslation} onChange={(event) => update({ showTranslation: event.target.checked })} type="checkbox" /></label><label className="modern-onboarding__range">Taille du texte arabe <output>{settings.quranFontSize}px</output><input max="64" min="22" onChange={(event) => update({ quranFontSize: Number(event.target.value) })} type="range" value={settings.quranFontSize} /></label><div className="modern-onboarding__segmented"><button className={settings.theme !== "dark" ? "is-active" : ""} onClick={() => update({ theme: "light" })} type="button">Clair</button><button className={settings.theme === "dark" ? "is-active" : ""} onClick={() => update({ theme: "dark" })} type="button">Sombre</button></div></div>}
    {step === 2 && <div className="modern-onboarding__content"><p className="modern-eyebrow">Votre rythme</p><h1>Avancez sans perdre le fil</h1><p>Definissez un objectif doux. Vous pourrez commencer a n'importe quel verset et marquer precisement la fin de votre session.</p><label className="modern-onboarding__range">Objectif quotidien <output>{settings.wirdGoalAmount} pages</output><input max="20" min="1" onChange={(event) => update({ wirdGoalAmount: Number(event.target.value) })} type="range" value={settings.wirdGoalAmount} /></label><div className="modern-onboarding__tip"><Gauge size={22} /><span><strong>Dans le lecteur</strong><small>Plus &gt; Commencer ici, puis Lu jusqu'ici met a jour votre progression.</small></span></div></div>}
    <footer><button className="modern-onboarding__skip" onClick={finish} type="button">Passer</button><div>{step > 0 && <button aria-label="Etape precedente" onClick={() => setStep((value) => value - 1)} type="button"><ArrowLeft size={18} /></button>}{step < 2 ? <button className="modern-onboarding__primary" onClick={() => setStep((value) => value + 1)} type="button">Continuer <ArrowRight size={18} /></button> : <button className="modern-onboarding__primary" onClick={finish} type="button">Commencer <Check size={18} /></button>}</div></footer>
  </section></div>;
}
