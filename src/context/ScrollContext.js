import { createContext, createElement, useCallback, useContext, useMemo, useRef, useState } from "react";

const ScrollContext = createContext();

export const ScrollProvider = ({ children }) => {
  const userScrollUntilRef = useRef(0);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  // A deadline avoids timers and React renders on every wheel/touch event.
  const markManualScroll = useCallback(() => {
    userScrollUntilRef.current = Date.now() + 2200;
    setIsUserScrolling(true);
  }, []);
  const clearUserScrolling = useCallback(() => {
    setIsUserScrolling(false);
  }, []);
  const scrollToElement = useCallback((element, options = {}) => {
    element?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "center",
      inline: "nearest",
      ...options,
    });
  }, []);
  const value = useMemo(
    () => ({ markManualScroll, clearUserScrolling, isUserScrolling, scrollToElement, userScrollUntilRef }),
    [markManualScroll, clearUserScrolling, isUserScrolling, scrollToElement],
  );
  return createElement(ScrollContext.Provider, { value }, children);
};

export const useScrollContext = () => useContext(ScrollContext);