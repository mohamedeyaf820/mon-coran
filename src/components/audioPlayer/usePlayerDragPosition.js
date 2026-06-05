import { useCallback, useEffect, useRef, useState } from "react";
import {
  clampCardPosition,
  clearCardPos,
  loadCardPos,
  saveCardPos,
} from "./audioPlayerUtils";

function applyCardPosition(card, pos) {
  if (!card || !pos) return;
  card.style.setProperty("--player-left", `${pos.x}px`);
  card.style.setProperty("--player-top", `${pos.y}px`);
  card.style.setProperty("left", `${pos.x}px`, "important");
  card.style.setProperty("top", `${pos.y}px`, "important");
  card.style.setProperty("right", "auto", "important");
  card.style.setProperty("bottom", "auto", "important");
  card.style.setProperty("transform", "none", "important");
}

export function usePlayerDragPosition({
  cardRef,
  expanded,
  isContextualDesktop,
  isMobile,
  minimized,
}) {
  const dragState = useRef(null);
  const hasSavedCardPosRef = useRef(Boolean(loadCardPos()));
  const [isDragging, setIsDragging] = useState(false);
  const [cardPos, setCardPos] = useState(() => {
    const saved = loadCardPos();
    if (saved) return saved;
    return {
      x: window.innerWidth - 280 - 16,
      y: Math.max(88, window.innerHeight - 360 - 24),
    };
  });
  const cardPosRef = useRef(cardPos);
  const [manualDockPosition, setManualDockPosition] = useState(
    () => hasSavedCardPosRef.current,
  );
  const canFreePosition = !isContextualDesktop || manualDockPosition || isDragging;
  const canDragDesktopCard = !isMobile;

  useEffect(() => {
    cardPosRef.current = cardPos;
  }, [cardPos]);

  useEffect(() => {
    const onResize = () => {
      if (!cardRef.current) return;
      const { offsetWidth: w, offsetHeight: h } = cardRef.current;
      setCardPos((prev) => {
        const next = clampCardPosition(prev.x, prev.y, w, h);
        if (manualDockPosition || !isContextualDesktop) {
          saveCardPos(next);
        }
        return next;
      });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [cardRef, manualDockPosition, isContextualDesktop]);

  useEffect(() => {
    if (isMobile || !cardRef.current) return;
    const { offsetWidth: w, offsetHeight: h } = cardRef.current;
    setCardPos((prev) => {
      const next = clampCardPosition(prev.x, prev.y, w, h);
      if (next.x === prev.x && next.y === prev.y) return prev;
      if (manualDockPosition || !isContextualDesktop) {
        saveCardPos(next);
      }
      return next;
    });
  }, [
    cardRef,
    expanded,
    minimized,
    isMobile,
    manualDockPosition,
    isContextualDesktop,
  ]);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    if (isMobile || !canFreePosition) {
      card.style.removeProperty("--player-left");
      card.style.removeProperty("--player-top");
      card.style.removeProperty("left");
      card.style.removeProperty("top");
      card.style.removeProperty("right");
      card.style.removeProperty("bottom");
      card.style.removeProperty("transform");
      return;
    }

    applyCardPosition(card, cardPos);
  }, [cardRef, cardPos, isMobile, canFreePosition]);

  const onPointerDown = useCallback(
    (e) => {
      if (!canDragDesktopCard) return;
      if (!e.isPrimary || e.button !== 0) return;
      const target = e.target instanceof Element ? e.target : null;
      if (!target) return;
      if (
        target.closest("button") ||
        target.closest("input") ||
        target.closest("textarea") ||
        target.closest("select") ||
        target.closest("a") ||
        target.closest("label") ||
        target.closest("[role='button']") ||
        target.closest("[data-no-drag='true']")
      )
        return;
      const explicitDragHandle = target.closest("[data-player-drag='true']");
      if (target.closest("[data-scroll-panel='true']") && !explicitDragHandle)
        return;
      if (target.closest("[data-player-expanded='true']") && !explicitDragHandle)
        return;
      if (!explicitDragHandle && !target.closest(".mp-audio-player")) return;

      const card = cardRef.current;
      const rect = card?.getBoundingClientRect();
      const w = card ? card.offsetWidth : 264;
      const h = card ? card.offsetHeight : 400;
      const startPos = clampCardPosition(
        rect?.left ?? cardPos.x,
        rect?.top ?? cardPos.y,
        w,
        h,
      );
      if (!manualDockPosition) {
        setManualDockPosition(true);
      }
      cardPosRef.current = startPos;
      setCardPos(startPos);
      applyCardPosition(card, startPos);
      e.preventDefault();
      e.currentTarget.setPointerCapture?.(e.pointerId);
      dragState.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        originX: startPos.x,
        originY: startPos.y,
      };
      setIsDragging(true);
    },
    [
      canDragDesktopCard,
      cardPos.x,
      cardPos.y,
      cardRef,
      manualDockPosition,
    ],
  );

  const onPointerMove = useCallback(
    (e) => {
      if (!dragState.current) return;
      if (e.pointerId !== dragState.current.pointerId) return;
      const dx = e.clientX - dragState.current.startX;
      const dy = e.clientY - dragState.current.startY;
      const card = cardRef.current;
      const w = card ? card.offsetWidth : 264;
      const h = card ? card.offsetHeight : 400;
      const next = clampCardPosition(
        dragState.current.originX + dx,
        dragState.current.originY + dy,
        w,
        h,
      );
      cardPosRef.current = next;
      setCardPos(next);
      applyCardPosition(card, next);
    },
    [cardRef],
  );

  const finishPointerDrag = useCallback(
    (e) => {
      if (!dragState.current) return;
      if (
        typeof e?.pointerId === "number" &&
        e.pointerId !== dragState.current.pointerId
      )
        return;
      const card = cardRef.current;
      const w = card ? card.offsetWidth : 264;
      const h = card ? card.offsetHeight : 400;
      const current = cardPosRef.current;
      const next = clampCardPosition(current.x, current.y, w, h);
      if (e?.currentTarget?.hasPointerCapture?.(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
      cardPosRef.current = next;
      setCardPos(next);
      applyCardPosition(card, next);
      saveCardPos(next);
      hasSavedCardPosRef.current = true;
      setManualDockPosition(true);
      dragState.current = null;
      setIsDragging(false);
    },
    [cardRef],
  );

  const onPointerLostCapture = useCallback(() => {
    if (dragState.current) {
      const card = cardRef.current;
      const w = card ? card.offsetWidth : 264;
      const h = card ? card.offsetHeight : 400;
      const current = cardPosRef.current;
      const next = clampCardPosition(current.x, current.y, w, h);
      cardPosRef.current = next;
      setCardPos(next);
      applyCardPosition(card, next);
      saveCardPos(next);
      hasSavedCardPosRef.current = true;
      setManualDockPosition(true);
    }
    dragState.current = null;
    setIsDragging(false);
  }, [cardRef]);

  const resetDockPosition = useCallback(() => {
    clearCardPos();
    hasSavedCardPosRef.current = false;
    dragState.current = null;
    setIsDragging(false);
    setManualDockPosition(false);
  }, []);

  return {
    canDragDesktopCard,
    canFreePosition,
    cardPos,
    finishPointerDrag,
    isDragging,
    manualDockPosition,
    onPointerDown,
    onPointerLostCapture,
    onPointerMove,
    resetDockPosition,
  };
}
