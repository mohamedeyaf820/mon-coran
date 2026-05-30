(function () {
  "use strict";

  var KEY = "mushaf-plus:boot-recovery-once";
  var ASSET_RE = /\/assets\/[^?#]+\.(?:js|css)(?:[?#]|$)/;

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

  function cleanupAndReload() {
    if (hasAlreadyRetried()) return;
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
})();
