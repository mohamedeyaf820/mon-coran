import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * TajweedTooltip
 * Ultra-performant singleton floating tooltip for Tajweed rules & Waqf signs.
 * - Debounced hover to avoid layout thrashing
 * - 0 synchronous computed style reflows
 * - Persistent event listeners (attached once on mount)
 * - Mobile friendly touch-toggle support
 */
export default function TajweedTooltip() {
  const [tooltipState, setTooltipState] = useState(null);
  const showTimerRef = useRef(null);
  const hideTimerRef = useRef(null);
  const activeElementRef = useRef(null);
  // Tajweed rules coloured with the Highlight API have no element of their
  // own: TajweedText describes them through `tajwid:*` document events.
  const activeVirtualRef = useRef(null);

  useEffect(() => {
    const clearTimers = () => {
      if (showTimerRef.current) {
        clearTimeout(showTimerRef.current);
        showTimerRef.current = null;
      }
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    };

    const placeTooltip = (rect, data) => {
      if (!rect) return;
      const tooltipWidth = Math.min(300, window.innerWidth - 32);
      const tooltipHeight = 85;

      let left = rect.left + rect.width / 2;
      const minLeft = 16 + tooltipWidth / 2;
      const maxLeft = window.innerWidth - 16 - tooltipWidth / 2;
      left = Math.max(minLeft, Math.min(maxLeft, left));

      let top = rect.top - 10;
      let placement = "top";
      if (top - tooltipHeight < 12) {
        top = rect.bottom + 10;
        placement = "bottom";
      }

      setTooltipState({
        name: data.name,
        desc: data.desc,
        color: data.color || "#09b000",
        x: Math.round(left),
        y: Math.round(top),
        placement,
      });
    };

    const updatePosition = (element, data) => {
      if (!element) return;
      placeTooltip(element.getBoundingClientRect(), data);
    };

    const handleVirtualHover = (event) => {
      const detail = event.detail;
      if (!detail?.name) return;
      clearTimers();
      activeElementRef.current = null;
      activeVirtualRef.current = detail;
      showTimerRef.current = setTimeout(() => {
        placeTooltip(detail.getRect?.(), detail);
      }, 40);
    };

    const handleVirtualShow = (event) => {
      const detail = event.detail;
      if (!detail?.name) return;
      clearTimers();
      activeElementRef.current = null;
      activeVirtualRef.current = detail;
      placeTooltip(detail.getRect?.(), detail);
    };

    const handleVirtualLeave = () => {
      if (!activeVirtualRef.current) return;
      activeVirtualRef.current = null;
      clearTimers();
      hideTimerRef.current = setTimeout(() => {
        setTooltipState(null);
      }, 100);
    };

    const handlePointerOver = (event) => {
      // Ignore simulated hover from fast scrolling on touch devices
      if (event.pointerType === "touch") return;

      const target = event.target.closest(
        ".tajwid-rule-segment, .waqf-marker, [data-tajwid-name]",
      );
      if (!target) return;

      const name = target.getAttribute("data-tajwid-name");
      const desc = target.getAttribute("data-tajwid-desc");
      if (!name) return;

      clearTimers();
      activeElementRef.current = target;
      activeVirtualRef.current = null;

      showTimerRef.current = setTimeout(() => {
        const color =
          target.getAttribute("data-tajwid-color") ||
          target.style.color ||
          "#1e8e4e";

        target.classList.add("is-tajwid-hovered");
        updatePosition(target, { name, desc, color });
      }, 40);
    };

    const handlePointerOut = (event) => {
      const target = event.target.closest(
        ".tajwid-rule-segment, .waqf-marker, [data-tajwid-name]",
      );
      if (!target) return;

      target.classList.remove("is-tajwid-hovered");
      clearTimers();
      hideTimerRef.current = setTimeout(() => {
        setTooltipState(null);
        activeElementRef.current = null;
      }, 100);
    };

    const handleClick = (event) => {
      // Highlight-rendered words decide themselves (see TajweedText).
      if (event.target.closest?.("[data-tajwid-word]")) return;
      const target = event.target.closest(
        ".tajwid-rule-segment, .waqf-marker, [data-tajwid-name]",
      );
      if (!target) {
        setTooltipState(null);
        activeElementRef.current = null;
        return;
      }

      const name = target.getAttribute("data-tajwid-name");
      const desc = target.getAttribute("data-tajwid-desc");
      if (!name) return;

      clearTimers();
      const color =
        target.getAttribute("data-tajwid-color") ||
        target.style.color ||
        "#1e8e4e";

      activeElementRef.current = target;
      activeVirtualRef.current = null;
      target.classList.add("is-tajwid-hovered");
      updatePosition(target, { name, desc, color });
    };

    let scrollFrame = null;
    const releaseAnchor = () => {
      activeElementRef.current?.classList.remove("is-tajwid-hovered");
      activeElementRef.current = null;
      activeVirtualRef.current = null;
      setTooltipState(null);
    };
    const handleScroll = () => {
      if (!activeVirtualRef.current && !activeElementRef.current) return;
      if (scrollFrame !== null) return;
      scrollFrame = window.requestAnimationFrame(() => {
        scrollFrame = null;
        const detail = activeVirtualRef.current;
        const target = detail ? null : activeElementRef.current;
        if (!detail && !target) return;
        const rect = detail ? detail.getRect?.() : target.getBoundingClientRect();
        if (!rect) return;
        // The reader has scrolled the anchored word away: chasing it across the
        // surah only costs layout and ends in a tooltip about a hidden word.
        if (rect.bottom < 0 || rect.top > window.innerHeight) {
          clearTimers();
          releaseAnchor();
          return;
        }
        if (detail) {
          placeTooltip(rect, detail);
          return;
        }
        const name = target.getAttribute("data-tajwid-name");
        const desc = target.getAttribute("data-tajwid-desc");
        const color =
          target.getAttribute("data-tajwid-color") ||
          target.style.color ||
          "#1e8e4e";
        placeTooltip(rect, { name, desc, color });
      });
    };

    document.addEventListener("pointerover", handlePointerOver, { passive: true });
    document.addEventListener("pointerout", handlePointerOut, { passive: true });
    document.addEventListener("click", handleClick, { passive: true });
    document.addEventListener("tajwid:hover", handleVirtualHover);
    document.addEventListener("tajwid:show", handleVirtualShow);
    document.addEventListener("tajwid:leave", handleVirtualLeave);
    window.addEventListener("scroll", handleScroll, { passive: true, capture: true });

    return () => {
      clearTimers();
      if (scrollFrame !== null) window.cancelAnimationFrame(scrollFrame);
      scrollFrame = null;
      document.removeEventListener("pointerover", handlePointerOver);
      document.removeEventListener("pointerout", handlePointerOut);
      document.removeEventListener("click", handleClick);
      document.removeEventListener("tajwid:hover", handleVirtualHover);
      document.removeEventListener("tajwid:show", handleVirtualShow);
      document.removeEventListener("tajwid:leave", handleVirtualLeave);
      window.removeEventListener("scroll", handleScroll, { capture: true });
    };
  }, []);

  if (!tooltipState || typeof document === "undefined") return null;

  return createPortal(
    <aside
      className={`tajweed-rich-tooltip tajweed-rich-tooltip--${tooltipState.placement} pointer-events-none`}
      style={{
        "--tajweed-tip-color": tooltipState.color,
        left: `${tooltipState.x}px`,
        top: `${tooltipState.y}px`,
      }}
      role="tooltip"
      aria-live="polite"
    >
      <div className="tajweed-rich-tooltip__card">
        <header className="tajweed-rich-tooltip__header">
          <span
            className="tajweed-rich-tooltip__dot"
            style={{ backgroundColor: tooltipState.color }}
            aria-hidden="true"
          />
          <h4 className="tajweed-rich-tooltip__title">{tooltipState.name}</h4>
        </header>
        {tooltipState.desc ? (
          <p className="tajweed-rich-tooltip__desc">{tooltipState.desc}</p>
        ) : null}
      </div>
    </aside>,
    document.body,
  );
}

