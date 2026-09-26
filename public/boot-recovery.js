(function () {
  "use strict";

  var KEY = "mushaf-plus:boot-recovery-once";
  var ASSET_RE = /\/assets\/[^?#]+\.(?:js|css)(?:[?#]|$)/;

  function activateDeferredStyles() {
    var quranFonts = document.getElementById("quran-google-fonts");
    if (!quranFonts) return;

    var activate = function () {
      quranFonts.media = "all";
    };

    quranFonts.addEventListener("load", activate, { once: true });
    if (quranFonts.sheet) activate();
  }

  // The Warsh Quran face is declared font-display: block, so a reader who has it
  // selected sees no Arabic at all until the 90 kB file lands. Preloading it on
  // every boot would tax each first visit with glyphs no Hafs route draws, so it is
  // injected only for the one setting that paints with it.
  function preloadWarshFace() {
    // saveSettings mirrors this one bit in plain text because the settings blob
    // itself is opaque once a passphrase is set.
    var flag = null;
    try {
      flag = localStorage.getItem("mushaf-plus-warsh-preload");
    } catch (_) {}
    if (flag === null) {
      var stored;
      try {
        stored = JSON.parse(localStorage.getItem("mushaf-plus-settings") || "null");
      } catch (_) {
        return;
      }
      if (!stored || stored.riwaya !== "warsh") return;
      // Scheherazade is the one Warsh choice already declared with font-display: swap.
      if (stored.fontFamily === "scheherazade-new-warsh") return;
    } else if (flag !== "1") {
      return;
    }

    var link = document.createElement("link");
    link.rel = "preload";
    link.as = "font";
    link.type = "font/woff2";
    link.href = "/fonts/kfgqpc-warsh-21.woff2";
    link.crossOrigin = "anonymous";
    document.head.appendChild(link);
  }

  function hasAlreadyRetried() {
    try {
      return sessionStorage.getItem(KEY) === "1";
    } catch (_) {
      return false;
    }
  }

  function markRetried() {
    try {
      sessionStorage.setItem(KEY, "1");
    } catch (_) {
      // Ignore private-mode/sessionStorage edge cases.
    }
  }

  function clearRetryFlagSoon() {
    setTimeout(function () {
      try {
        sessionStorage.removeItem(KEY);
      } catch (_) {
        // no-op
      }
    }, 15000);
  }

  async function cleanupAndReload() {
    // An unavailable optional chunk must never erase a usable offline shell.
    if (navigator.onLine === false || hasAlreadyRetried()) return;
    try {
      // HEAD bypasses our GET-only worker; a cached shell is not proof of connectivity.
      var probe = await fetch("/index.html", { method: "HEAD", cache: "no-store" });
      if (!probe.ok || navigator.onLine === false || hasAlreadyRetried()) return;
    } catch (_) {
      return;
    }
    markRetried();

    var tasks = [];

    if ("serviceWorker" in navigator) {
      tasks.push(
        navigator.serviceWorker
          .getRegistrations()
          .then(function (registrations) {
            return Promise.all(
              registrations.map(function (registration) {
                return registration.unregister();
              }),
            );
          })
          .catch(function () {}),
      );
    }

    if ("caches" in window) {
      tasks.push(
        caches
          .keys()
          .then(function (keys) {
            return Promise.all(
              keys
                .filter(function (key) {
                  return key.indexOf("mushaf-plus") === 0;
                })
                .map(function (key) {
                  return caches.delete(key);
                }),
            );
          })
          .catch(function () {}),
      );
    }

    Promise.all(tasks).finally(function () {
      window.location.reload();
    });
  }

  window.addEventListener(
    "error",
    function (event) {
      var target = event && event.target;
      var url =
        target && (target.src || target.href)
          ? String(target.src || target.href)
          : "";
      if (ASSET_RE.test(url)) {
        cleanupAndReload();
      }
    },
    true,
  );

  window.addEventListener("load", function () {
    clearRetryFlagSoon();
    setTimeout(function () {
      var root = document.getElementById("root");
      if (root && root.childElementCount === 0) {
        cleanupAndReload();
      }
    }, 3500);
  });

  preloadWarshFace();
  activateDeferredStyles();
})();
