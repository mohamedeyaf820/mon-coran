import React from "react";

export default function WarshNotice({
  kind,
  badgeLabel,
  body,
  frameClassName,
  linkLabel,
  linkClassName,
  onLinkClick,
}) {
  const shellClass =
    (frameClassName || "") +
    (kind === "ok"
      ? " mb-[0.6rem] flex flex-wrap items-center justify-between gap-[0.5rem] border-[rgba(27,94,58,0.2)] bg-[rgba(27,94,58,0.08)] px-[1.1rem] py-[1rem] font-[var(--font-ui)] text-[0.73rem] leading-[1.5] text-[var(--text-secondary)]"
      : " mb-[0.6rem] flex flex-wrap items-center justify-between gap-[0.5rem] border-[rgba(184,134,11,0.2)] bg-[rgba(184,134,11,0.06)] px-[1.1rem] py-[1rem] font-[var(--font-ui)] text-[0.73rem] leading-[1.5] text-[var(--text-secondary)]");
  const badgeClass =
    kind === "ok"
      ? "inline-flex w-fit items-center gap-[0.4rem] rounded-full border border-[rgba(27,94,58,0.22)] bg-[rgba(27,94,58,0.11)] px-[0.62rem] py-[0.16rem] text-[0.62rem] font-bold text-[var(--primary)]"
      : "inline-flex w-fit items-center gap-[0.4rem] rounded-full border border-[rgba(184,134,11,0.26)] bg-[rgba(184,134,11,0.12)] px-[0.62rem] py-[0.16rem] text-[0.62rem] font-bold text-[var(--gold)]";

  return (
    <div className={shellClass}>
      <div className="flex min-w-[200px] flex-1 flex-col gap-[0.3rem]">
        <div className={badgeClass}>
          <i
            className={`fas ${kind === "ok" ? "fa-check-circle" : "fa-exclamation-triangle"}`}
          ></i>
          <span>{badgeLabel}</span>
        </div>
        {body ? <p className="m-0 text-[0.71rem] opacity-[0.82]">{body}</p> : null}
      </div>
      {linkLabel && onLinkClick ? (
        <button type="button" onClick={onLinkClick} className={linkClassName}>
          <i className="fas fa-external-link-alt"></i>
          {linkLabel}
        </button>
      ) : null}
    </div>
  );
}
