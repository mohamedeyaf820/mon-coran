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

    const updatePosition = (element, data) => {
      if (!element) return;
      const rect = element.getBoundingClientRect();
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
        color: data.color || "#27ae60",
        x: Math.round(left),
        y: Math.round(top),
        placement,
      });
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

      showTimerRef.current = setTimeout(() => {
        const color =
          target.getAttribute("data-tajwid-color") ||
          target.style.color ||
          "#27ae60";

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
        "#27ae60";

      activeElementRef.current = target;
      target.classList.add("is-tajwid-hovered");
      updatePosition(target, { name, desc, color });
    };

    const handleScroll = () => {
      if (activeElementRef.current) {
        const target = activeElementRef.current;
        const name = target.getAttribute("data-tajwid-name");
        const desc = target.getAttribute("data-tajwid-desc");
        const color =
          target.getAttribute("data-tajwid-color") ||
          target.style.color ||
          "#27ae60";
        updatePosition(target, { name, desc, color });
      }
    };

    document.addEventListener("pointerover", handlePointerOver, { passive: true });
    document.addEventListener("pointerout", handlePointerOut, { passive: true });
    document.addEventListener("click", handleClick, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true, capture: true });

    return () => {
      clearTimers();
      document.removeEventListener("pointerover", handlePointerOver);
      document.removeEventListener("pointerout", handlePointerOut);
      document.removeEventListener("click", handleClick);
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

