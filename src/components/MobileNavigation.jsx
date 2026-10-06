import React, { useRef, useState } from "react";
import { BookOpen, CalendarDays, HandHeart, Headphones, Home, Menu, MoreHorizontal, Search, Settings } from "lucide-react";
import { shallowEqual, useAppActions, useAppLocale, useAppSelector } from "../context/AppContext";
import { t } from "../i18n";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

const destinations = [
  { id: "home", Icon: Home, label: "nav.home" },
  { id: "read", Icon: BookOpen, label: "footer.navRead" },
  { id: "audio", Icon: Headphones, label: "footer.navListen" },
  { id: "prayers", Icon: CalendarDays, label: "nav.prayers" },
];

export default function MobileNavigation({ hidden = false }) {
  const { set, dispatch } = useAppActions();
  const { lang } = useAppLocale();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuTriggerRef = useRef(null);
  const pendingActionRef = useRef(null);
  const view = useAppSelector(state => ({
    showHome: state.showHome,
    showPrayers: state.showPrayers,
    showDuas: state.showDuas,
    legalPage: state.legalPage,
    routeNotFound: state.routeNotFound,
    homeSection: state.homeSection,
    riwaya: state.riwaya,
  }), shallowEqual);
  const active = view.routeNotFound || view.legalPage || view.showDuas ? null
    : view.showPrayers ? "prayers"
      : view.showHome ? view.homeSection === "audio" ? "audio" : "home" : "read";

  const navigate = id => {
    setMenuOpen(false);
    if (id === active) return;
    set({
      legalPage: null,
      routeNotFound: false,
      showDuas: false,
      sidebarOpen: false,
      showHome: id === "home" || id === "audio",
      showPrayers: id === "prayers",
      ...(id === "home" || id === "audio" ? { homeSection: id === "audio" ? "audio" : "surah" } : {}),
    });
    // Reading coordinates and the native audio element survive navigation.
    if (id !== "read") document.getElementById("main-content")?.scrollTo({ top: 0 });
  };

  // Two groups, split by a hairline: finding things, then personal spaces and
  // preferences. Settings closes the list where the thumb rests.
  const toolGroups = [
    [
      { id: "search", Icon: Search, label: "nav.search", action: () => dispatch({ type: "TOGGLE_SEARCH" }) },
      { id: "directory", Icon: Menu, label: "nav.surahList", action: () => set({ sidebarOpen: true }) },
      { id: "library", Icon: BookOpen, label: "library.title", action: () => set({ libraryOpen: true, libraryTab: "favorites" }) },
    ],
    [
      { id: "duas", Icon: HandHeart, label: "nav.duas", action: () => set({ legalPage: null, routeNotFound: false, showDuas: true, showHome: false, showPrayers: false }) },
      { id: "settings", Icon: Settings, label: "nav.settings", action: () => dispatch({ type: "TOGGLE_SETTINGS" }) },
    ],
  ];

  return (
    <nav className="mobile-navigation" aria-hidden={hidden || undefined} inert={hidden ? "" : undefined} aria-label={t("nav.quickNav", lang)} dir={lang === "ar" ? "rtl" : "ltr"}>
      {destinations.map(({ id, Icon, label }) => (
        <button key={id} type="button" className="mobile-navigation__item" data-destination={id}
          aria-current={active === id ? "page" : undefined} onClick={() => navigate(id)}>
          <span className="mobile-navigation__icon" aria-hidden="true"><Icon size={20} /></span>
          <span className="mobile-navigation__label">{t(label, lang)}</span>
        </button>
      ))}
      <Popover open={menuOpen} onOpenChange={setMenuOpen}>
        <PopoverTrigger asChild>
          <button ref={menuTriggerRef} type="button" className="mobile-navigation__item" data-destination="more" aria-label={t("header.more", lang)}>
            <span className="mobile-navigation__icon" aria-hidden="true"><MoreHorizontal size={20} /></span>
            <span className="mobile-navigation__label">{t("nav.more", lang)}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent side="top" align="end" className="mobile-navigation-menu" aria-label={t("nav.menu", lang)} dir={lang === "ar" ? "rtl" : "ltr"} onCloseAutoFocus={event => {
          event.preventDefault();
          menuTriggerRef.current?.focus({ preventScroll: true });
          const action = pendingActionRef.current;
          pendingActionRef.current = null;
          action?.();
        }}>
          <div className="mobile-navigation-menu__riwaya" role="group" aria-label={t("header.riwayaToggle", lang)}>
            {['hafs', 'warsh'].map(riwaya => (
              <button key={riwaya} type="button" data-riwaya-choice={riwaya} aria-pressed={view.riwaya === riwaya}
                onClick={() => {
                  pendingActionRef.current = () => dispatch({ type: 'SET_RIWAYA', payload: riwaya });
                  setMenuOpen(false);
                }}>{t(`quran.${riwaya}`, lang)}</button>
            ))}
          </div>
          {toolGroups.map((group, index) => (
            <React.Fragment key={index}>
              <div className="mobile-navigation-menu__divider" role="separator" />
              {group.map(({ id, Icon, label, action }) => (
                <button key={id} type="button" className="mobile-navigation-menu__item" data-tool={id} onClick={() => {
                  pendingActionRef.current = action;
                  setMenuOpen(false);
                }}>
                  <Icon size={20} aria-hidden="true" /><span>{t(label, lang)}</span>
                </button>
              ))}
            </React.Fragment>
          ))}
        </PopoverContent>
      </Popover>
    </nav>
  );
}
