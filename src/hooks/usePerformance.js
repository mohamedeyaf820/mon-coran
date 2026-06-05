import { useEffect, useRef, useState } from "react";

/**
 * Hook pour mesurer les performances des composants
 * À utiliser en mode développement uniquement
 */
export function usePerformanceMonitor(componentName) {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(performance.now());

  useEffect(() => {
    if (import.meta.env.DEV) {
      renderCount.current += 1;
      const now = performance.now();
      const timeSinceLastRender = now - lastRenderTime.current;
      
      if (renderCount.current > 1 && timeSinceLastRender < 100) {
        console.warn(
          `[Performance] ${componentName} re-rendered ${renderCount.current} times in ${timeSinceLastRender.toFixed(2)}ms`
        );
      }
      
      lastRenderTime.current = now;
    }
  });

  return renderCount.current;
}

/**
 * Hook pour mesurer le temps d'exécution d'une fonction
 */
export function usePerformanceMeasure() {
  const measures = useRef(new Map());

  const start = (label) => {
    if (import.meta.env.DEV) {
      measures.current.set(label, performance.now());
    }
  };

  const end = (label) => {
    if (import.meta.env.DEV && measures.current.has(label)) {
      const duration = performance.now() - measures.current.get(label);
      console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`);
      measures.current.delete(label);
      return duration;
    }
    return 0;
  };

  return { start, end };
}

/**
 * Hook pour débouncer une valeur (utile pour la recherche)
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook pour throttler une fonction (utile pour le scroll/resize)
 */
export function useThrottle(callback, limit = 100) {
  const lastRun = useRef(0);
  const timeoutRef = useRef(null);

  return (...args) => {
    const now = Date.now();
    
    if (now - lastRun.current >= limit) {
      lastRun.current = now;
      callback(...args);
    } else {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        lastRun.current = Date.now();
        callback(...args);
      }, limit - (now - lastRun.current));
    }
  };
}

/**
 * Hook pour détecter si l'appareil est lent
 */
export function useDevicePerformance() {
  const [isLowEndDevice, setIsLowEndDevice] = useState(false);

  useEffect(() => {
    // Détection des appareils à faible performance
    const memory = navigator.deviceMemory;
    const cores = navigator.hardwareConcurrency;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
    
    // Considérer comme appareil lent si :
    // - Moins de 4GB de RAM
    // - Moins de 4 coeurs
    // - Appareil mobile avec moins de 6 coeurs
    const isLowEnd = 
      (memory && memory < 4) || 
      (cores && cores < 4) ||
      (isMobile && cores && cores < 6);
    
    setIsLowEndDevice(isLowEnd);
    
    if (isLowEnd && import.meta.env.DEV) {
      console.log("[Performance] Low-end device detected, enabling performance mode");
    }
  }, []);

  return isLowEndDevice;
}

/**
 * Hook pour lazy load une valeur avec loading state
 */
export function useLazyValue(factory, deps = []) {
  const [value, setValue] = useState(null);
  const [loading, setLoading] = useState(true);
  const factoryRef = useRef(factory);

  useEffect(() => {
    let cancelled = false;
    
    const load = async () => {
      setLoading(true);
      try {
        const result = await factoryRef.current();
        if (!cancelled) {
          setValue(result);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, deps);

  return { value, loading };
}

/**
 * Hook pour cacher le résultat d'un calcul coûteux
 * avec invalidation manuelle
 */
export function useCachedValue(calculator, deps = []) {
  const cacheRef = useRef({ key: null, value: null });
  const depsRef = useRef(deps);
  
  // Vérifier si les dépendances ont changé
  const depsChanged = deps.some((dep, i) => dep !== depsRef.current[i]);
  
  if (depsChanged || cacheRef.current.key === null) {
    cacheRef.current.value = calculator();
    cacheRef.current.key = Date.now();
    depsRef.current = deps;
  }
  
  return {
    value: cacheRef.current.value,
    invalidate: () => {
      cacheRef.current.key = null;
    },
  };
}
