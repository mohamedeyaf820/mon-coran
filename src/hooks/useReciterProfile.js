import { useEffect, useState } from "react";
import { fetchWithTimeout } from "../services/fetchWithTimeout.js";

let profileCataloguePromise;
const PROFILE_CATALOGUE_VERSION = "2026-09-19";
// Same-origin static catalogue served from the SW cache; 8 s matches the
// other metadata fetches and releases the memoised promise so a later mount
// can retry instead of waiting forever on a stalled response.
const PROFILE_FETCH_TIMEOUT_MS = 8000;

function loadProfileCatalogue() {
  if (!profileCataloguePromise) {
    const baseUrl = import.meta.env?.BASE_URL || "/";
    profileCataloguePromise = fetchWithTimeout(
      `${baseUrl}data/reciter-profiles.json?v=${PROFILE_CATALOGUE_VERSION}`,
      { cache: "force-cache" },
      PROFILE_FETCH_TIMEOUT_MS,
    )
      .then((response) => {
        if (!response.ok) throw new Error(`Reciter profiles: ${response.status}`);
        return response.json();
      })
      .catch((error) => {
        profileCataloguePromise = undefined;
        throw error;
      });
  }
  return profileCataloguePromise;
}

export function preloadReciterProfiles() {
  return loadProfileCatalogue().catch(() => null);
}

export function useReciterProfile(reciterId) {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    let active = true;
    setProfile(null);
    if (!reciterId) return undefined;

    loadProfileCatalogue()
      .then((catalogue) => {
        if (active) setProfile(catalogue[reciterId] || null);
      })
      .catch(() => {
        if (active) setProfile(null);
      });

    return () => {
      active = false;
    };
  }, [reciterId]);

  return profile;
}
