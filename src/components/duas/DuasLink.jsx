import React from "react";
import { useApp } from "../../context/AppContext";
import { duasHref } from "./duasRoute";

/**
 * Internal link between the invocation pages. A real <a href> (navigation
 * navigates), intercepted for a plain click so the app keeps its state and
 * the browser history gets one entry; a modified click opens the address.
 */
export default function DuasLink({ to, className, children, onNavigate, ...rest }) {
  const { set } = useApp();

  const handleClick = (event) => {
    rest.onClick?.(event);
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    event.preventDefault();
    set({ duasRoute: to });
    onNavigate?.();
  };

  return (
    <a {...rest} href={duasHref(to)} className={className} onClick={handleClick}>
      {children}
    </a>
  );
}
