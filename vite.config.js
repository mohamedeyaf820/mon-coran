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
    hmr: true,
    open: false,
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
    // Enable compression
    reportCompressedSize: true,
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        // Noms de chunks hachés, pas de noms lisibles
        chunkFileNames: "assets/[hash].js",
        entryFileNames: "assets/[hash].js",
        assetFileNames: "assets/[hash].[ext]",
        manualChunks: {
          // Vendor chunks - third party libraries
          vendor: ["react", "react-dom"],
          // UI components (lazy loaded)
          ui: ["@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu", "@radix-ui/react-popover", "@radix-ui/react-tabs", "@radix-ui/react-tooltip"],
        },
      },
    },
    // Supprimer console.*, debugger et commentaires
    esbuildOptions: {
      drop: mode === "production" ? ["console", "debugger"] : [],
      legalComments: "none",
      minifyIdentifiers: true,
      minifySyntax: true,
      minifyWhitespace: true,
      treeShaking: true,
    },
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ["react", "react-dom", "idb", "zod"],
    exclude: ["./src/services/audioService.js"], // Lazy load audio service
  },
}));
