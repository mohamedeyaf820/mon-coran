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
        return html.replace("__CSP_POLICY__", buildCspPolicy(mode));
      },
    },
  ],
  server: {
    port: 3002,
    strictPort: false,
    host: true,
    hmr: {
      host: "localhost",
      protocol: "ws",
      clientPort: 3002,
    },
    open: true,
  },
  build: {
    outDir: "dist",
    // Pas de sourcemap en production — empêche la reconstruction du code source
    sourcemap: false,
    target: "es2020",
    // Minification agressive + suppression console/debugger
    minify: "esbuild",
    cssCodeSplit: true,
    cssMinify: true,
    rollupOptions: {
      output: {
        // Noms de chunks hachés, pas de noms lisibles
        chunkFileNames: "assets/[hash].js",
        entryFileNames: "assets/[hash].js",
        assetFileNames: "assets/[hash].[ext]",
        manualChunks: {
          _r: ["react", "react-dom"],
          _s: [
            "./src/services/quranAPI.js",
            "./src/services/warshService.js",
            "./src/services/audioService.js",
            "./src/services/storageService.js",
          ],
          _d: [
            "./src/data/surahs.js",
            "./src/data/juz.js",
            "./src/data/reciters.js",
            "./src/data/tajwidRules.js",
          ],
        },
      },
    },
    // Supprimer console.*, debugger et commentaires
    esbuildOptions: {
      drop: ["console", "debugger"],
      legalComments: "none",
      minifyIdentifiers: true,
      minifySyntax: true,
      minifyWhitespace: true,
    },
  },
}));
