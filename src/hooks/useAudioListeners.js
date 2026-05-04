import { useEffect, useRef } from "react";
import audioService from "../services/audioService";

/**
 * Hook pour écouter les mises à jour de temps audio avec nettoyage automatique
 * @param {Function} callback - Fonction appelée à chaque mise à jour de temps
 * @param {Array} deps - Dépendances du useEffect
 */
export function useAudioTimeUpdate(callback, deps = []) {
  const callbackRef = useRef(callback);
  
  // Mettre à jour la référence si le callback change
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const unsubscribe = audioService.addTimeUpdateListener((...args) => {
      callbackRef.current(...args);
    });
    
    return () => {
      unsubscribe();
    };
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
}

/**
 * Hook pour écouter les changements d'ayah avec nettoyage automatique
 * @param {Function} callback - Fonction appelée à chaque changement d'ayah
 * @param {Array} deps - Dépendances du useEffect
 */
export function useAudioAyahChange(callback, deps = []) {
  const callbackRef = useRef(callback);
  
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const unsubscribe = audioService.addAyahChangeListener((...args) => {
      callbackRef.current(...args);
    });
    
    return () => {
      unsubscribe();
    };
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
}

/**
 * Hook pour écouter la fin de lecture avec nettoyage automatique
 * @param {Function} callback - Fonction appelée à la fin de la lecture
 * @param {Array} deps - Dépendances du useEffect
 */
export function useAudioEnd(callback, deps = []) {
  const callbackRef = useRef(callback);
  
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const unsubscribe = audioService.addEndListener((...args) => {
      callbackRef.current(...args);
    });
    
    return () => {
      unsubscribe();
    };
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
}

/**
 * Hook pour écouter les changements de latence avec nettoyage automatique
 * @param {Function} callback - Fonction appelée à chaque changement de latence
 * @param {Array} deps - Dépendances du useEffect
 */
export function useAudioLatency(callback, deps = []) {
  const callbackRef = useRef(callback);
  
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const unsubscribe = audioService.subscribeLatency((...args) => {
      callbackRef.current(...args);
    });
    
    return () => {
      unsubscribe();
    };
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
}
