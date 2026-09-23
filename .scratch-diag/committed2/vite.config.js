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
          .filter(
            (directive) =>
              !directive.startsWith("frame-ancestors") &&
              // Deployment headers enforce HTTPS in production. Keeping this
              // directive in the HTML meta policy makes WebKit upgrade local
              // preview assets from http://127.0.0.1 to HTTPS and blank the app.
              directive !== "upgrade-insecure-requests",
          )
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
    manifest: true,
    // Pas de sourcemap en production: empeche la reconstruction du code source.
    sourcemap: false,
    target: "es2020",
    // Minification agressive + suppression console/debugger
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
        minify:
          mode === "production"
            ? {
                compress: { dropConsole: true, dropDebugger: true },
                mangle: true,
                codegen: { legalComments: "none" },
              }
            : false,
        codeSplitting: {
          groups: [
            {
              name: "vendor-react",
              test: /node_modules[\\/](?:react|react-dom|scheduler)[\\/]/,
              priority: 30,
            },
            {
              name: "vendor-crypto",
              test: /node_modules[\\/]crypto-js[\\/]/,
              priority: 20,
            },
            {
              name: "vendor-storage",
              test: /node_modules[\\/]idb[\\/]/,
              priority: 20,
            },
            {
              name: "vendor-icons",
              test: /node_modules[\\/]lucide-react[\\/]/,
              minSize: 8 * 1024,
              maxSize: 160 * 1024,
              priority: 15,
            },
          ],
        },
      },
    },
  },
  // La minification JavaScript est confiée à Rolldown/Oxc dans `output.minify`.
  // Cela permet de supprimer les consoles de production sans double minification.
  // Optimize dependencies
  optimizeDeps: {
    include: ["react", "react-dom", "idb"],
  },
}));
