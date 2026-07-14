import React from "react";
import ReactDOM from "react-dom/client";

import { installSharedBootstrap, renderRootFailure } from "./bootstrap/sharedBootstrap";
import { resolveAppSurface } from "./routing/appSurface";

installSharedBootstrap();

const rootElement = document.getElementById("root");

if (!rootElement) {
  renderRootFailure();
} else {
  const surface = resolveAppSurface(window.location.pathname);
  const rootModulePromise =
    surface === "legacy"
      ? import("./legacy/LegacyRoot")
      : import("./modern/ModernRoot");

  rootModulePromise.then(({ default: Root }) => {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <Root />
      </React.StrictMode>,
    );
  });
}
