import React, { useEffect, useId, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Sheet } from "../ui/sheet";
import { CircleHelp } from "lucide-react";
import { TAJWID_VISUAL_GROUPS, TAJWID_RULE_GROUPS, QURAN_COM_TAJWID_SOURCE } from "../../data/tajwidPalette";
import { WARSH_TAJWID_RULE_IDS } from "../../data/warshTajwidSigns";
import { WARSH_ARCHIVE_RULE_IDS } from "../../data/warshArchiveManifest";
import { getWarshTajwidSourceStatus } from "../../services/warshTajweedService";
import { subscribeWarshArchive, getWarshArchiveSnapshot } from "../../utils/warshArchiveRules";
import { TAJWID_GUIDE_COPY } from "../../i18n/tajwidGuide";
import "../../styles/tajwid-guide.css";

// The colour groups this riwaya can actually paint. Hafs uses the source's own
// annotation; Warsh paints only the rules its edition prints, so its guide
// lists those groups instead of claiming the whole palette.
const WARSH_VISUAL_GROUPS = TAJWID_VISUAL_GROUPS.filter((group) =>
  [...WARSH_TAJWID_RULE_IDS, ...WARSH_ARCHIVE_RULE_IDS].some((ruleId) => TAJWID_RULE_GROUPS[ruleId] === group.id),
);

function TajweedLegend({ lang = "fr", riwaya = "hafs", compactTrigger = false }) {
  const copy = TAJWID_GUIDE_COPY[lang] || TAJWID_GUIDE_COPY.fr;
  const [open, setOpen] = useState(false);
  const [compact, setCompact] = useState(false);
  const titleId = useId();
  useSyncExternalStore(subscribeWarshArchive, getWarshArchiveSnapshot, getWarshArchiveSnapshot);
  const sourceStatus = getWarshTajwidSourceStatus();
  const archiveAvailable = sourceStatus.status === "warsh-user-archive";
  useEffect(() => {
    const query = window.matchMedia("(max-width: 640px)");
    const update = () => { setCompact(query.matches); setOpen(false); };
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  const groups = riwaya === "warsh" ? WARSH_VISUAL_GROUPS.filter(group => archiveAvailable || WARSH_TAJWID_RULE_IDS.some(id => TAJWID_RULE_GROUPS[id] === group.id)) : TAJWID_VISUAL_GROUPS;
  const content = (
    <div className="tajwid-guide__content" data-tajwid-guide-dialog="true" dir={lang === "ar" ? "rtl" : "ltr"} lang={lang}>
      <p>{riwaya === "warsh" ? (archiveAvailable ? copy.warshArchive : copy.warsh) : copy.helper}</p>
      <dl className="tajwid-guide__rules">
        {groups.map((group) => {
          const index = TAJWID_VISUAL_GROUPS.indexOf(group);
          return (
            <div key={group.id} data-visual-group={group.id}>
              <dt><span className="tajwid-guide__dot" style={{ backgroundColor: `var(${group.colorToken})` }} aria-hidden="true" />{copy.groups[index][0]}</dt>
              <dd>{copy.groups[index][1]}</dd>
            </div>
          );
        })}
      </dl>
      <p className="tajwid-guide__source" data-tajwid-colour-source="quran.com">
        {copy.sourcePrefix}{" "}
        <a href={QURAN_COM_TAJWID_SOURCE.siteUrl} target="_blank" rel="noopener noreferrer">{copy.sourceName}</a>
        {copy.sourceSuffix}
      </p>
    </div>
  );
  const trigger = (
    <Button variant="ghost" size={compactTrigger ? "icon" : "default"} className="tajwid-guide__trigger" aria-label={copy.title} title={copy.title} aria-haspopup="dialog" aria-expanded={open} data-testid="tajweed-legend">
      {compactTrigger ? <CircleHelp size={18} aria-hidden="true" /> : copy.title}
    </Button>
  );
  return (
    <div className="tajwid-guide" data-riwaya={riwaya} data-source-status={riwaya === "warsh" ? sourceStatus.status : "quran.com"}>
      {compact ? <>
        {React.cloneElement(trigger, { onClick: () => setOpen(true) })}
        {open ? createPortal(<Sheet open onClose={() => setOpen(false)} title={copy.title} side="bottom" size="lg" className="tajwid-guide__sheet" overlayClassName="tajwid-guide__sheet-overlay">{content}</Sheet>, document.body) : null}
      </> : (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>{trigger}</PopoverTrigger>
          <PopoverContent className="tajwid-guide__popover" aria-labelledby={titleId}>
            <div className="tajwid-guide__heading"><h2 id={titleId}>{copy.title}</h2><Button variant="ghost" onClick={() => setOpen(false)}>{copy.close}</Button></div>
            {content}
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
export default React.memo(TajweedLegend);
