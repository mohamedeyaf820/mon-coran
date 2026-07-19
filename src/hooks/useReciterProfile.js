import { useEffect, useState } from "react";

let profileCataloguePromise;

function loadProfileCatalogue() {
  if (!profileCataloguePromise) {
    const baseUrl = import.meta.env.BASE_URL || "/";
    profileCataloguePromise = fetch(`${baseUrl}data/reciter-profiles.json`, {
      cache: "force-cache",
    }).then((response) => {
      if (!response.ok) throw new Error(`Reciter profiles: ${response.status}`);
      return response.json();
    });
  }
  return profileCataloguePromise;
}

export function useReciterProfile(reciterId) {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    let active = true;
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
