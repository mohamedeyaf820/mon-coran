import { useEffect, useState } from "react";

let profileCataloguePromise;

function loadProfileCatalogue() {
  if (!profileCataloguePromise) {
    const baseUrl = import.meta.env.BASE_URL || "/";
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    profileCataloguePromise = fetch(`${baseUrl}data/reciter-profiles.json`, {
      cache: "force-cache",
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error(`Reciter profiles: ${response.status}`);
        return response.json();
      })
      .catch((error) => {
        profileCataloguePromise = undefined;
        throw error;
      })
      .finally(() => clearTimeout(timeout));
  }
  return profileCataloguePromise;
}

export function preloadReciterProfiles() {
  return loadProfileCatalogue().catch(() => null);
}

export function useReciterProfile(reciterId) {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(Boolean(reciterId));
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setProfile(null);
    setError(false);
    setLoading(Boolean(reciterId));
    if (!reciterId) return undefined;

    loadProfileCatalogue()
      .then((catalogue) => {
        if (active) setProfile(catalogue[reciterId] || null);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [reciterId, attempt]);

  return { profile, error, loading, retry: () => setAttempt((value) => value + 1) };
}
