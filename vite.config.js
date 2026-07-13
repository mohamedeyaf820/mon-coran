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
          if (id.includes("node_modules/zod")) return "vendor-validation";
          if (id.includes("node_modules/crypto-js")) return "vendor-crypto";
          if (id.includes("node_modules/idb")) return "vendor-storage";
          if (id.includes("node_modules/@radix-ui")) return "vendor-ui";
          if (id.includes("node_modules/lucide-react")) return "vendor-icons";
          // App data — large static data files that inflate the main chunk
          if (id.includes("src/data/reciters")) return "data-reciters";
          if (id.includes("src/data/surahs")) return "data-surahs";
          if (id.includes("src/data/juz")) return "data-juz";
          if (id.includes("src/data/duas")) return "data-duas";
          if (id.includes("src/data/tajwid")) return "data-tajwid";
          // i18n translations — three language files go together
          if (id.includes("src/i18n")) return "app-i18n";
          // App-level singletons shared by every component
          if (id.includes("src/context/AppContext")) return "app-context";
          if (id.includes("src/services/audioService")) return "svc-audio";
          // Audio player components — isolated so shared chunk stays under 250 kB
          if (id.includes("src/components/AudioPlayer") || id.includes("src/components/audioPlayer")) return "comp-audio-player";
          if (id.includes("src/components/SettingsModal")) return "comp-settings";
          if (id.includes("src/components/ArabicFontControls")) return "comp-arabic-font";
          // Route-based splitting — each lazy route gets its own chunk
          if (id.includes("src/components/Home/") || id.includes("src/components/HomePage")) return "route-home";
          if (id.includes("src/components/QuranDisplay")) return "route-reader";
          if (id.includes("src/components/recitation")) return "route-recitation";
          if (id.includes("src/components/Quran/")) return "route-quran-components";
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
