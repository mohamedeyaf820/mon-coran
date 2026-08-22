import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * GlobalTajweedTooltip
 * Ultra-performant singleton floating tooltip for Tajweed rules & Waqf signs.
 * Uses event delegation on document — 0 overhead on verse rendering.
 */
export default function TajweedTooltip() {
  const [tooltipState, setTooltipState] = useState(null);
  const hideTimerRef = useRef(null);
  const activeElementRef = useRef(null);

  useEffect(() => {
    const clearHideTimer = () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    };

    const updatePosition = (element, data) => {
      if (!element) return;
      const rect = element.getBoundingClientRect();
      const tooltipWidth = Math.min(320, window.innerWidth - 32);
      const tooltipHeight = 90; // estimated

      // Horizontal center
      let left = rect.left + rect.width / 2;
      const minLeft = 16 + tooltipWidth / 2;
      const maxLeft = window.innerWidth - 16 - tooltipWidth / 2;
      left = Math.max(minLeft, Math.min(maxLeft, left));

      // Vertical position (prefer above, flip below if not enough room)
      let top = rect.top - 12;
      let placement = "top";
      if (top - tooltipHeight < 10) {
        top = rect.bottom + 12;
        placement = "bottom";
      }

      setTooltipState({
        name: data.name,
        desc: data.desc,
        color: data.color || "#27ae60",
        x: left,
        y: top,
        placement,
      });
    };

    const handlePointerOver = (event) => {
      const target = event.target.closest(".tajwid-rule-segment, .waqf-marker, [data-tajwid-name]");
      if (!target) return;

      const name = target.getAttribute("data-tajwid-name");
      const desc = target.getAttribute("data-tajwid-desc");
      if (!name) return;

      clearHideTimer();
      activeElementRef.current = target;
      target.classList.add("is-tajwid-hovered");

      const color =
        target.getAttribute("data-tajwid-color") ||
        window.getComputedStyle(target).color ||
        "#27ae60";

      updatePosition(target, { name, desc, color });
    };

    const handlePointerOut = (event) => {
      const target = event.target.closest(".tajwid-rule-segment, .waqf-marker, [data-tajwid-name]");
      if (!target) return;

      target.classList.remove("is-tajwid-hovered");
      clearHideTimer();
      hideTimerRef.current = window.setTimeout(() => {
        setTooltipState(null);
        activeElementRef.current = null;
      }, 120);
    };

    const handleScroll = () => {
      if (activeElementRef.current && tooltipState) {
        const target = activeElementRef.current;
        const name = target.getAttribute("data-tajwid-name");
        const desc = target.getAttribute("data-tajwid-desc");
        const color = target.getAttribute("data-tajwid-color") || "#27ae60";
        updatePosition(target, { name, desc, color });
      }
    };

    document.addEventListener("pointerover", handlePointerOver, { passive: true });
    document.addEventListener("pointerout", handlePointerOut, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true, capture: true });

    return () => {
      clearHideTimer();
      document.removeEventListener("pointerover", handlePointerOver);
      document.removeEventListener("pointerout", handlePointerOut);
      window.removeEventListener("scroll", handleScroll, { capture: true });
    };
  }, [tooltipState]);

  if (!tooltipState || typeof document === "undefined") return null;

  return createPortal(
    <aside
      className={`tajweed-rich-tooltip tajweed-rich-tooltip--${tooltipState.placement}`}
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
