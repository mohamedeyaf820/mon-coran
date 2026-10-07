import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "../../lib/utils";

const heightCache = new Map();
const HEIGHT_CACHE_LIMIT = 1200;
const viewportObservers = new Map();
const rootedObservers = new WeakMap();

function rememberHeight(key, height) {
  if (!key || !Number.isFinite(height) || height < 1) return;
  if (heightCache.has(key)) heightCache.delete(key);
  heightCache.set(key, Math.ceil(height));
  while (heightCache.size > HEIGHT_CACHE_LIMIT) {
    heightCache.delete(heightCache.keys().next().value);
  }
}

function getObserverRegistry(root) {
  if (!root) return viewportObservers;
  let registry = rootedObservers.get(root);
  if (!registry) {
    registry = new Map();
    rootedObservers.set(root, registry);
  }
  return registry;
}

function observeNearViewport(node, callback, rootMargin, root) {
  if (typeof IntersectionObserver === "undefined") {
    callback(true);
    return () => {};
  }

  const registry = getObserverRegistry(root);
  let shared = registry.get(rootMargin);
  if (!shared) {
    const callbacks = new WeakMap();
    const nodes = new Set();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => callbacks.get(entry.target)?.(entry.isIntersecting));
      },
      { root, rootMargin },
    );
    shared = { callbacks, nodes, observer };
    registry.set(rootMargin, shared);
  }

  shared.callbacks.set(node, callback);
  shared.nodes.add(node);
  shared.observer.observe(node);
  return () => {
    shared.observer.unobserve(node);
    shared.callbacks.delete(node);
    shared.nodes.delete(node);
    if (shared.nodes.size === 0) {
      shared.observer.disconnect();
      registry.delete(rootMargin);
    }
  };
}

/**
 * Keeps a stable, measurable anchor in the document while mounting expensive
 * descendants only near the viewport. Measured heights avoid scroll jumps when
 * an item leaves the render window and becomes a lightweight placeholder.
 */
export default function VirtualizedItem({
  as: Element = "div",
  cacheKey,
  children,
  className,
  eager = false,
  estimatedHeight = 72,
  pinned = false,
  rootRef,
  rootMargin = "900px 0px",
  style,
  ...props
}) {
  const nodeRef = useRef(null);
  const [nearViewport, setNearViewport] = useState(eager || pinned);
  // A small eager tranche stays mounted to keep first-paint controls and focus
  // targets stable while the observer settles under CPU pressure.
  const shouldRender = pinned || eager || nearViewport;
  const cachedHeight = heightCache.get(cacheKey) || estimatedHeight;

  useEffect(() => {
    if (pinned || eager) setNearViewport(true);
  }, [eager, pinned]);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return undefined;
    const observerRoot = rootRef?.current || node.closest(".app-main-shell") || null;
    return observeNearViewport(
      node,
      setNearViewport,
      rootMargin,
      observerRoot,
    );
  }, [rootMargin, rootRef]);

  // What the node occupied the last time it was measured. The reader turns
  // placeholders into real verses ahead of the viewport; one that sits above
  // it and comes out taller or shorter than its estimate would push everything
  // below it (the verse being read) up or down, and scroll anchoring is off on
  // the main shell. The difference is given back to the scroll position.
  const lastHeightRef = useRef(null);

  useLayoutEffect(() => {
    const node = nodeRef.current;
    if (!node) return undefined;
    const root = rootRef?.current || node.closest(".app-main-shell");

    if (!shouldRender) {
      lastHeightRef.current = node.getBoundingClientRect().height;
      return undefined;
    }

    const measure = () => {
      const rect = node.getBoundingClientRect();
      const previous = lastHeightRef.current;
      lastHeightRef.current = rect.height;
      rememberHeight(cacheKey, rect.height);
      if (!root || previous == null) return;
      const change = rect.height - previous;
      if (Math.abs(change) < 1) return;
      // Only an item that ends above the top edge of the scroller moves what
      // the reader sees; the ones in view or below grow into free space.
      if (rect.bottom <= root.getBoundingClientRect().top + 1) {
        root.scrollTop += change;
      }
    };
    measure();
    if (typeof ResizeObserver === "undefined") return undefined;

    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [cacheKey, shouldRender, rootRef]);

  return (
    <Element
      ref={nodeRef}
      className={cn("virtualized-item", !shouldRender && "virtualized-item--placeholder", className)}
      style={
        shouldRender
          ? style
          : { ...style, height: `${cachedHeight}px`, contain: "layout style paint" }
      }
      {...props}
    >
      {shouldRender ? (typeof children === "function" ? children() : children) : null}
    </Element>
  );
}
