import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { buildCspPolicy } from "./scripts/cspPolicy.mjs";

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "inject-csp-policy",
      transformIndexHtml(html) {
        // `frame-ancestors` only works as an HTTP response header. Keeping it
        // in the HTML meta policy produces a browser warning on every page.
        // Netlify and Vercel still enforce the directive through their headers.
        const metaPolicy = buildCspPolicy(mode)
          .split("; ")
          .filter((directive) => !directive.startsWith("frame-ancestors"))
          .join("; ");
        return html.replace("__CSP_POLICY__", metaPolicy);
      },
    },
  ],
  server: {
    port: 3002,
    strictPort: false,
    host: true,
    hmr: true,
    open: false,
  },
  build: {
    outDir: "dist",
    // Pas de sourcemap en production: empeche la reconstruction du code source.
    sourcemap: false,
    target: "es2020",
    // Minification agressive + suppression console/debugger
    minify: "esbuild",
    cssCodeSplit: true,
    cssMinify: "esbuild",
    // Enable compression
    reportCompressedSize: true,
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        // Noms de chunks haches, pas de noms lisibles.
        chunkFileNames: "assets/[hash].js",
        entryFileNames: "assets/[hash].js",
        assetFileNames: "assets/[hash].[ext]",
        manualChunks(id) {
          if (id.includes("node_modules/react")) return "vendor-react";
          if (id.includes("node_modules/crypto-js")) return "vendor-crypto";
          if (id.includes("node_modules/idb")) return "vendor-storage";
        },
      },
    },
    // Supprimer console.*, debugger et commentaires.
    esbuildOptions: {
      drop: mode === "production" ? ["console", "debugger"] : [],
      legalComments: "none",
    },
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ["react", "react-dom", "idb", "zod"],
  },
}));
