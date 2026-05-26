import React, { memo, useMemo } from "react";

/**
 * Composants optimisés avec React.memo pour éviter les re-renders inutiles
 */

/**
 * Wrapper mémoïsé pour les composants enfants
 * Nécessite que le parent passe les props de manière stable
 */
export const MemoizedComponent = memo(
  ({ children }) => children,
  (prevProps, nextProps) => {
    // Comparaison profonde des children si nécessaire
    return prevProps.children === nextProps.children;
  }
);

/**
 * Composant pour afficher une liste d'éléments de manière optimisée
 * Utilise React.memo pour chaque élément
 */
export const OptimizedList = memo(({ 
  items, 
  renderItem, 
  keyExtractor,
  className = "" 
}) => {
  const renderedItems = useMemo(() => {
    return items.map((item, index) => {
      const key = keyExtractor ? keyExtractor(item, index) : index;
      return (
        <MemoizedListItem 
          key={key} 
          item={item} 
          renderItem={renderItem} 
          index={index}
        />
      );
    });
  }, [items, renderItem, keyExtractor]);

  return <div className={className}>{renderedItems}</div>;
});

// Élément de liste individuel mémoïsé
const MemoizedListItem = memo(({ item, renderItem, index }) => {
  return renderItem(item, index);
}, (prevProps, nextProps) => {
  // Ne re-render que si l'item a changé (référence)
  return prevProps.item === nextProps.item && 
         prevProps.index === nextProps.index;
});

/**
 * Composant pour conditionnellement rendre un composant lourd
 * avec un fallback léger pendant le chargement
 */
export const LazyComponent = ({
  isReady,
  children,
  fallback = null,
  placeholder = null
}) => {
  if (!isReady) {
    return placeholder || fallback;
  }
  return children;
};

/**
 * Composant pour virtualiser une liste si elle dépasse une certaine taille
 */
export const SmartList = memo(({
  items,
  renderItem,
  threshold = 50,
  virtualizedProps = {},
  regularProps = {}
}) => {
  // Si la liste est petite, utiliser le rendu normal
  if (items.length <= threshold) {
    return (
      <div {...regularProps}>
        {items.map((item, index) => (
          <React.Fragment key={index}>
            {renderItem(item, index)}
          </React.Fragment>
        ))}
      </div>
    );
  }

  // Pour les grandes listes, utiliser la virtualisation (si disponible)
  // Sinon, utiliser le rendu paginé
  return (
    <PaginatedList
      items={items}
      renderItem={renderItem}
      pageSize={threshold}
      {...regularProps}
    />
  );
});

/**
 * Liste paginée simple pour les grandes listes
 */
const PaginatedList = memo(({
  items,
  renderItem,
  pageSize = 50,
  className = ""
}) => {
  const [visibleCount, setVisibleCount] = React.useState(pageSize);

  const visibleItems = useMemo(() => {
    return items.slice(0, visibleCount);
  }, [items, visibleCount]);

  const hasMore = visibleCount < items.length;

  const loadMore = React.useCallback(() => {
    setVisibleCount(prev => Math.min(prev + pageSize, items.length));
  }, [items.length, pageSize]);

  return (
    <div className={className}>
      {visibleItems.map((item, index) => (
        <React.Fragment key={index}>
          {renderItem(item, index)}
        </React.Fragment>
      ))}
      
      {hasMore && (
        <button
          onClick={loadMore}
          className="w-full py-4 text-center text-sm opacity-60 hover:opacity-100 transition-opacity"
        >
          Charger plus ({items.length - visibleCount} restants)
        </button>
      )}
    </div>
  );
});

/**
 * Composant pour délayer le rendu d'un composant lourd
 * Utile pour les composants hors écran
 */
export const DeferredComponent = ({
  children,
  delay = 0,
  fallback = null
}) => {
  const [shouldRender, setShouldRender] = React.useState(delay === 0);

  React.useEffect(() => {
    if (delay === 0) return;
    
    const timer = setTimeout(() => {
      setShouldRender(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  if (!shouldRender) {
    return fallback;
  }

  return children;
};

/**
 * Composant pour mesurer le temps de rendu
 * À utiliser en développement uniquement
 */
export const PerformanceMeasure = ({
  componentName,
  children
}) => {
  if (!import.meta.env.DEV) {
    return children;
  }

  const startTime = React.useRef(performance.now());

  React.useEffect(() => {
    const endTime = performance.now();
    const duration = endTime - startTime.current;
    
    if (duration > 16) { // Plus d'un frame (60fps)
      console.warn(
        `[Performance] ${componentName} rendered in ${duration.toFixed(2)}ms`
      );
    }
  });

  return children;
};

/**
 * Wrapper pour créer rapidement un composant mémoïsé
 * @param {Function} Component - Le composant à mémoïser
 * @param {Function} areEqual - Fonction de comparaison optionnelle
 */
export function createMemoComponent(Component, areEqual) {
  return memo(Component, areEqual);
}
