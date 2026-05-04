import { useEffect, useRef, useState, useCallback } from "react";

/**
 * Hook pour la virtualisation des listes d'ayahs
 * Affiche uniquement les éléments visibles dans le viewport
 * 
 * @param {Array} items - Liste des éléments à virtualiser
 * @param {Object} options - Options de configuration
 * @param {number} options.itemHeight - Hauteur estimée d'un élément (px)
 * @param {number} options.overscan - Nombre d'éléments à pré-rendre hors viewport
 * @param {string} options.containerRef - Référence du conteneur scrollable
 * @returns {Object} État de la virtualisation
 */
export function useVirtualization(items, options = {}) {
  const { 
    itemHeight = 120, 
    overscan = 3,
    enabled = true 
  } = options;
  
  const containerRef = useRef(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });
  const [scrollTop, setScrollTop] = useState(0);
  const containerHeightRef = useRef(0);
  const rafRef = useRef(null);

  // Calculer la plage visible
  const calculateVisibleRange = useCallback(() => {
    if (!containerRef.current || !enabled) {
      setVisibleRange({ start: 0, end: items.length });
      return;
    }

    const container = containerRef.current;
    const scrollTop = container.scrollTop;
    const containerHeight = container.clientHeight;
    containerHeightRef.current = containerHeight;

    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    setVisibleRange({ start: startIndex, end: endIndex });
    setScrollTop(scrollTop);
  }, [items.length, itemHeight, overscan, enabled]);

  // Gérer le scroll avec RAF pour la performance
  const handleScroll = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = requestAnimationFrame(calculateVisibleRange);
  }, [calculateVisibleRange]);

  // Initialiser et écouter le scroll
  useEffect(() => {
    if (!enabled) return;

    const container = containerRef.current;
    if (!container) return;

    // Calcul initial
    calculateVisibleRange();

    // Écouter le scroll
    container.addEventListener("scroll", handleScroll, { passive: true });
    
    // Écouter le resize
    const resizeObserver = new ResizeObserver(() => {
      calculateVisibleRange();
    });
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener("scroll", handleScroll);
      resizeObserver.disconnect();
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [handleScroll, calculateVisibleRange, enabled]);

  // Recalculer quand les items changent
  useEffect(() => {
    calculateVisibleRange();
  }, [items, calculateVisibleRange]);

  // Calculer les éléments visibles
  const visibleItems = enabled 
    ? items.slice(visibleRange.start, visibleRange.end)
    : items;

  // Calculer le style du conteneur
  const containerStyle = enabled ? {
    height: `${items.length * itemHeight}px`,
    position: "relative",
  } : {};

  // Calculer le style de la liste visible
  const listStyle = enabled ? {
    position: "absolute",
    top: `${visibleRange.start * itemHeight}px`,
    left: 0,
    right: 0,
  } : {};

  return {
    containerRef,
    visibleItems,
    visibleRange,
    containerStyle,
    listStyle,
    totalHeight: items.length * itemHeight,
    scrollToIndex: useCallback((index) => {
      if (containerRef.current) {
        containerRef.current.scrollTop = index * itemHeight;
      }
    }, [itemHeight]),
  };
}

/**
 * Composant VirtualList optimisé pour les grandes listes
 * 
 * @param {Object} props
 * @param {Array} props.items - Liste des éléments
 * @param {Function} props.renderItem - Fonction pour rendre un élément
 * @param {number} props.itemHeight - Hauteur estimée d'un élément
 * @param {string} props.className - Classes CSS additionnelles
 * @param {boolean} props.enabled - Activer/désactiver la virtualisation
 */
export function VirtualList({ 
  items, 
  renderItem, 
  itemHeight = 120, 
  className = "",
  enabled = true 
}) {
  const {
    containerRef,
    visibleItems,
    visibleRange,
    containerStyle,
    listStyle,
  } = useVirtualization(items, { itemHeight, enabled });

  if (!enabled) {
    return (
      <div className={className}>
        {items.map((item, index) => renderItem(item, index))}
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ maxHeight: "100vh" }}
    >
      <div style={containerStyle}>
        <div style={listStyle}>
          {visibleItems.map((item, index) => 
            renderItem(item, visibleRange.start + index)
          )}
        </div>
      </div>
    </div>
  );
}
