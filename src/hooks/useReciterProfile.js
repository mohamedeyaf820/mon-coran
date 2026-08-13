import { useEffect, useState } from "react";

let profileCataloguePromise;
const PROFILE_CATALOGUE_VERSION = "2026-08-13";

function loadProfileCatalogue() {
  if (!profileCataloguePromise) {
    const baseUrl = import.meta.env.BASE_URL || "/";
    profileCataloguePromise = fetch(`${baseUrl}data/reciter-profiles.json?v=${PROFILE_CATALOGUE_VERSION}`, {
      cache: "force-cache",
    })
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
