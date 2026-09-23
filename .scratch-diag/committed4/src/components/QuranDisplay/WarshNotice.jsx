import React from "react";
import { AlertTriangle, ExternalLink } from "lucide-react";

export default function WarshNotice({
  badgeLabel,
  body,
  frameClassName,
  linkLabel,
  linkClassName,
  onLinkClick,
}) {
  const shellClass =
    (frameClassName || "") +
    " mb-[0.6rem] flex flex-wrap items-center justify-between gap-[0.5rem] border-[rgba(184,134,11,0.2)] bg-[rgba(184,134,11,0.06)] px-[1.1rem] py-[1rem] font-[var(--font-ui)] text-[0.73rem] leading-[1.5] text-[var(--text-secondary)]";
  const badgeClass =
    "inline-flex w-fit items-center gap-[0.4rem] rounded-full border border-[rgba(184,134,11,0.26)] bg-[rgba(184,134,11,0.12)] px-[0.62rem] py-[0.16rem] text-[0.62rem] font-bold text-[var(--gold)]";

  return (
    <div className={shellClass}>
      <div className="flex min-w-[200px] flex-1 flex-col gap-[0.3rem]">
        <div className={badgeClass}>
          <AlertTriangle size={10} />
          <span>{badgeLabel}</span>
        </div>
        {body ? <p className="m-0 text-[0.71rem] opacity-[0.82]">{body}</p> : null}
      </div>
      {linkLabel && onLinkClick ? (
        <button type="button" onClick={onLinkClick} className={linkClassName}>
          <ExternalLink size={10} />
          {linkLabel}
        </button>
      ) : null}
    </div>
  );
}
