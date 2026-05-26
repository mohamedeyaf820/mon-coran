// vite.config.js
import { defineConfig } from "file:///E:/mon%20coran/node_modules/vite/dist/node/index.js";
import react from "file:///E:/mon%20coran/node_modules/@vitejs/plugin-react/dist/index.js";
import tailwindcss from "file:///E:/mon%20coran/node_modules/@tailwindcss/vite/dist/index.mjs";

// scripts/cspPolicy.mjs
function buildCspPolicy(mode = "production") {
  const isDev = mode !== "production";
  const scriptSrc = isDev ? "'self' 'unsafe-inline'" : "'self'";
  const connectSrc = isDev ? "'self' https://api.alquran.cloud https://api.quran.com https://*.quran.com https://raw.githubusercontent.com https://cdn.jsdelivr.net https://cdn.islamic.network https://everyayah.com https://audio.qurancdn.com https://verses.quran.com https://*.mp3quran.net https://ia800304.us.archive.org ws://localhost:* http://localhost:*" : "'self' https://api.alquran.cloud https://api.quran.com https://*.quran.com https://raw.githubusercontent.com https://cdn.jsdelivr.net https://cdn.islamic.network https://everyayah.com https://audio.qurancdn.com https://verses.quran.com https://*.mp3quran.net https://ia800304.us.archive.org";
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
    "style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
    "style-src-attr 'unsafe-inline'",
    "font-src 'self' https://fonts.gstatic.com https://fonts.quranwbw.com https://quran.com https://*.quran.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com data:",
    "img-src 'self' data: blob: https:",
    `connect-src ${connectSrc}`,
    "media-src 'self' blob: https://cdn.islamic.network https://everyayah.com https://audio.qurancdn.com https://verses.quran.com https://*.mp3quran.net"
  ].join("; ");
}

// vite.config.js
var vite_config_default = defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "inject-csp-policy",
      transformIndexHtml(html) {
        return html.replace("__CSP_POLICY__", buildCspPolicy(mode));
      }
    }
  ],
  server: {
    port: 3002,
    strictPort: false,
    host: true,
    hmr: {
      host: "localhost",
      protocol: "ws",
      clientPort: 3002
    },
    open: true
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
            "./src/services/storageService.js"
          ],
          _d: [
            "./src/data/surahs.js",
            "./src/data/juz.js",
            "./src/data/reciters.js",
            "./src/data/tajwidRules.js"
          ]
        }
      }
    },
    // Supprimer console.*, debugger et commentaires
    esbuildOptions: {
      drop: ["console", "debugger"],
      legalComments: "none",
      minifyIdentifiers: true,
      minifySyntax: true,
      minifyWhitespace: true
    }
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiLCAic2NyaXB0cy9jc3BQb2xpY3kubWpzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiRTpcXFxcbW9uIGNvcmFuXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJFOlxcXFxtb24gY29yYW5cXFxcdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0U6L21vbiUyMGNvcmFuL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcclxuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdFwiO1xyXG5pbXBvcnQgdGFpbHdpbmRjc3MgZnJvbSBcIkB0YWlsd2luZGNzcy92aXRlXCI7XHJcbmltcG9ydCB7IGJ1aWxkQ3NwUG9saWN5IH0gZnJvbSBcIi4vc2NyaXB0cy9jc3BQb2xpY3kubWpzXCI7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiAoe1xyXG4gIHBsdWdpbnM6IFtcclxuICAgIHJlYWN0KCksXHJcbiAgICB0YWlsd2luZGNzcygpLFxyXG4gICAge1xyXG4gICAgICBuYW1lOiBcImluamVjdC1jc3AtcG9saWN5XCIsXHJcbiAgICAgIHRyYW5zZm9ybUluZGV4SHRtbChodG1sKSB7XHJcbiAgICAgICAgcmV0dXJuIGh0bWwucmVwbGFjZShcIl9fQ1NQX1BPTElDWV9fXCIsIGJ1aWxkQ3NwUG9saWN5KG1vZGUpKTtcclxuICAgICAgfSxcclxuICAgIH0sXHJcbiAgXSxcclxuICBzZXJ2ZXI6IHtcclxuICAgIHBvcnQ6IDMwMDIsXHJcbiAgICBzdHJpY3RQb3J0OiBmYWxzZSxcclxuICAgIGhvc3Q6IHRydWUsXHJcbiAgICBobXI6IHtcclxuICAgICAgaG9zdDogXCJsb2NhbGhvc3RcIixcclxuICAgICAgcHJvdG9jb2w6IFwid3NcIixcclxuICAgICAgY2xpZW50UG9ydDogMzAwMixcclxuICAgIH0sXHJcbiAgICBvcGVuOiB0cnVlLFxyXG4gIH0sXHJcbiAgYnVpbGQ6IHtcclxuICAgIG91dERpcjogXCJkaXN0XCIsXHJcbiAgICAvLyBQYXMgZGUgc291cmNlbWFwIGVuIHByb2R1Y3Rpb24gXHUyMDE0IGVtcFx1MDBFQWNoZSBsYSByZWNvbnN0cnVjdGlvbiBkdSBjb2RlIHNvdXJjZVxyXG4gICAgc291cmNlbWFwOiBmYWxzZSxcclxuICAgIHRhcmdldDogXCJlczIwMjBcIixcclxuICAgIC8vIE1pbmlmaWNhdGlvbiBhZ3Jlc3NpdmUgKyBzdXBwcmVzc2lvbiBjb25zb2xlL2RlYnVnZ2VyXHJcbiAgICBtaW5pZnk6IFwiZXNidWlsZFwiLFxyXG4gICAgY3NzQ29kZVNwbGl0OiB0cnVlLFxyXG4gICAgY3NzTWluaWZ5OiB0cnVlLFxyXG4gICAgcm9sbHVwT3B0aW9uczoge1xyXG4gICAgICBvdXRwdXQ6IHtcclxuICAgICAgICAvLyBOb21zIGRlIGNodW5rcyBoYWNoXHUwMEU5cywgcGFzIGRlIG5vbXMgbGlzaWJsZXNcclxuICAgICAgICBjaHVua0ZpbGVOYW1lczogXCJhc3NldHMvW2hhc2hdLmpzXCIsXHJcbiAgICAgICAgZW50cnlGaWxlTmFtZXM6IFwiYXNzZXRzL1toYXNoXS5qc1wiLFxyXG4gICAgICAgIGFzc2V0RmlsZU5hbWVzOiBcImFzc2V0cy9baGFzaF0uW2V4dF1cIixcclxuICAgICAgICBtYW51YWxDaHVua3M6IHtcclxuICAgICAgICAgIF9yOiBbXCJyZWFjdFwiLCBcInJlYWN0LWRvbVwiXSxcclxuICAgICAgICAgIF9zOiBbXHJcbiAgICAgICAgICAgIFwiLi9zcmMvc2VydmljZXMvcXVyYW5BUEkuanNcIixcclxuICAgICAgICAgICAgXCIuL3NyYy9zZXJ2aWNlcy93YXJzaFNlcnZpY2UuanNcIixcclxuICAgICAgICAgICAgXCIuL3NyYy9zZXJ2aWNlcy9hdWRpb1NlcnZpY2UuanNcIixcclxuICAgICAgICAgICAgXCIuL3NyYy9zZXJ2aWNlcy9zdG9yYWdlU2VydmljZS5qc1wiLFxyXG4gICAgICAgICAgXSxcclxuICAgICAgICAgIF9kOiBbXHJcbiAgICAgICAgICAgIFwiLi9zcmMvZGF0YS9zdXJhaHMuanNcIixcclxuICAgICAgICAgICAgXCIuL3NyYy9kYXRhL2p1ei5qc1wiLFxyXG4gICAgICAgICAgICBcIi4vc3JjL2RhdGEvcmVjaXRlcnMuanNcIixcclxuICAgICAgICAgICAgXCIuL3NyYy9kYXRhL3RhandpZFJ1bGVzLmpzXCIsXHJcbiAgICAgICAgICBdLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICB9LFxyXG4gICAgLy8gU3VwcHJpbWVyIGNvbnNvbGUuKiwgZGVidWdnZXIgZXQgY29tbWVudGFpcmVzXHJcbiAgICBlc2J1aWxkT3B0aW9uczoge1xyXG4gICAgICBkcm9wOiBbXCJjb25zb2xlXCIsIFwiZGVidWdnZXJcIl0sXHJcbiAgICAgIGxlZ2FsQ29tbWVudHM6IFwibm9uZVwiLFxyXG4gICAgICBtaW5pZnlJZGVudGlmaWVyczogdHJ1ZSxcclxuICAgICAgbWluaWZ5U3ludGF4OiB0cnVlLFxyXG4gICAgICBtaW5pZnlXaGl0ZXNwYWNlOiB0cnVlLFxyXG4gICAgfSxcclxuICB9LFxyXG59KSk7XHJcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiRTpcXFxcbW9uIGNvcmFuXFxcXHNjcmlwdHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkU6XFxcXG1vbiBjb3JhblxcXFxzY3JpcHRzXFxcXGNzcFBvbGljeS5tanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0U6L21vbiUyMGNvcmFuL3NjcmlwdHMvY3NwUG9saWN5Lm1qc1wiO2V4cG9ydCBmdW5jdGlvbiBidWlsZENzcFBvbGljeShtb2RlID0gXCJwcm9kdWN0aW9uXCIpIHtcclxuICBjb25zdCBpc0RldiA9IG1vZGUgIT09IFwicHJvZHVjdGlvblwiO1xyXG4gIGNvbnN0IHNjcmlwdFNyYyA9IGlzRGV2ID8gXCInc2VsZicgJ3Vuc2FmZS1pbmxpbmUnXCIgOiBcIidzZWxmJ1wiO1xyXG4gIGNvbnN0IGNvbm5lY3RTcmMgPSBpc0RldlxuICAgID8gXCInc2VsZicgaHR0cHM6Ly9hcGkuYWxxdXJhbi5jbG91ZCBodHRwczovL2FwaS5xdXJhbi5jb20gaHR0cHM6Ly8qLnF1cmFuLmNvbSBodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20gaHR0cHM6Ly9jZG4uanNkZWxpdnIubmV0IGh0dHBzOi8vY2RuLmlzbGFtaWMubmV0d29yayBodHRwczovL2V2ZXJ5YXlhaC5jb20gaHR0cHM6Ly9hdWRpby5xdXJhbmNkbi5jb20gaHR0cHM6Ly92ZXJzZXMucXVyYW4uY29tIGh0dHBzOi8vKi5tcDNxdXJhbi5uZXQgaHR0cHM6Ly9pYTgwMDMwNC51cy5hcmNoaXZlLm9yZyB3czovL2xvY2FsaG9zdDoqIGh0dHA6Ly9sb2NhbGhvc3Q6KlwiXG4gICAgOiBcIidzZWxmJyBodHRwczovL2FwaS5hbHF1cmFuLmNsb3VkIGh0dHBzOi8vYXBpLnF1cmFuLmNvbSBodHRwczovLyoucXVyYW4uY29tIGh0dHBzOi8vcmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSBodHRwczovL2Nkbi5qc2RlbGl2ci5uZXQgaHR0cHM6Ly9jZG4uaXNsYW1pYy5uZXR3b3JrIGh0dHBzOi8vZXZlcnlheWFoLmNvbSBodHRwczovL2F1ZGlvLnF1cmFuY2RuLmNvbSBodHRwczovL3ZlcnNlcy5xdXJhbi5jb20gaHR0cHM6Ly8qLm1wM3F1cmFuLm5ldCBodHRwczovL2lhODAwMzA0LnVzLmFyY2hpdmUub3JnXCI7XG5cclxuICByZXR1cm4gW1xyXG4gICAgXCJkZWZhdWx0LXNyYyAnc2VsZidcIixcclxuICAgIFwiYmFzZS11cmkgJ3NlbGYnXCIsXHJcbiAgICBcIm9iamVjdC1zcmMgJ25vbmUnXCIsXHJcbiAgICBcImZyYW1lLWFuY2VzdG9ycyAnbm9uZSdcIixcclxuICAgIFwiZm9ybS1hY3Rpb24gJ3NlbGYnXCIsXHJcbiAgICBgc2NyaXB0LXNyYyAke3NjcmlwdFNyY31gLFxyXG4gICAgXCJzdHlsZS1zcmMgJ3NlbGYnICd1bnNhZmUtaW5saW5lJyBodHRwczovL2ZvbnRzLmdvb2dsZWFwaXMuY29tIGh0dHBzOi8vY2RuanMuY2xvdWRmbGFyZS5jb21cIixcclxuICAgIFwic3R5bGUtc3JjLWVsZW0gJ3NlbGYnICd1bnNhZmUtaW5saW5lJyBodHRwczovL2ZvbnRzLmdvb2dsZWFwaXMuY29tIGh0dHBzOi8vY2RuanMuY2xvdWRmbGFyZS5jb21cIixcclxuICAgIFwic3R5bGUtc3JjLWF0dHIgJ3Vuc2FmZS1pbmxpbmUnXCIsXHJcbiAgICBcImZvbnQtc3JjICdzZWxmJyBodHRwczovL2ZvbnRzLmdzdGF0aWMuY29tIGh0dHBzOi8vZm9udHMucXVyYW53YncuY29tIGh0dHBzOi8vcXVyYW4uY29tIGh0dHBzOi8vKi5xdXJhbi5jb20gaHR0cHM6Ly9jZG4uanNkZWxpdnIubmV0IGh0dHBzOi8vY2RuanMuY2xvdWRmbGFyZS5jb20gZGF0YTpcIixcbiAgICBcImltZy1zcmMgJ3NlbGYnIGRhdGE6IGJsb2I6IGh0dHBzOlwiLFxyXG4gICAgYGNvbm5lY3Qtc3JjICR7Y29ubmVjdFNyY31gLFxyXG4gICAgXCJtZWRpYS1zcmMgJ3NlbGYnIGJsb2I6IGh0dHBzOi8vY2RuLmlzbGFtaWMubmV0d29yayBodHRwczovL2V2ZXJ5YXlhaC5jb20gaHR0cHM6Ly9hdWRpby5xdXJhbmNkbi5jb20gaHR0cHM6Ly92ZXJzZXMucXVyYW4uY29tIGh0dHBzOi8vKi5tcDNxdXJhbi5uZXRcIixcbiAgXS5qb2luKFwiOyBcIik7XG59XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQTROLFNBQVMsb0JBQW9CO0FBQ3pQLE9BQU8sV0FBVztBQUNsQixPQUFPLGlCQUFpQjs7O0FDRm1PLFNBQVMsZUFBZSxPQUFPLGNBQWM7QUFDdFMsUUFBTSxRQUFRLFNBQVM7QUFDdkIsUUFBTSxZQUFZLFFBQVEsMkJBQTJCO0FBQ3JELFFBQU0sYUFBYSxRQUNmLDJVQUNBO0FBRUosU0FBTztBQUFBLElBQ0w7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQSxjQUFjLFNBQVM7QUFBQSxJQUN2QjtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBLGVBQWUsVUFBVTtBQUFBLElBQ3pCO0FBQUEsRUFDRixFQUFFLEtBQUssSUFBSTtBQUNiOzs7QURqQkEsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxLQUFLLE9BQU87QUFBQSxFQUN6QyxTQUFTO0FBQUEsSUFDUCxNQUFNO0FBQUEsSUFDTixZQUFZO0FBQUEsSUFDWjtBQUFBLE1BQ0UsTUFBTTtBQUFBLE1BQ04sbUJBQW1CLE1BQU07QUFDdkIsZUFBTyxLQUFLLFFBQVEsa0JBQWtCLGVBQWUsSUFBSSxDQUFDO0FBQUEsTUFDNUQ7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBQ0EsUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sWUFBWTtBQUFBLElBQ1osTUFBTTtBQUFBLElBQ04sS0FBSztBQUFBLE1BQ0gsTUFBTTtBQUFBLE1BQ04sVUFBVTtBQUFBLE1BQ1YsWUFBWTtBQUFBLElBQ2Q7QUFBQSxJQUNBLE1BQU07QUFBQSxFQUNSO0FBQUEsRUFDQSxPQUFPO0FBQUEsSUFDTCxRQUFRO0FBQUE7QUFBQSxJQUVSLFdBQVc7QUFBQSxJQUNYLFFBQVE7QUFBQTtBQUFBLElBRVIsUUFBUTtBQUFBLElBQ1IsY0FBYztBQUFBLElBQ2QsV0FBVztBQUFBLElBQ1gsZUFBZTtBQUFBLE1BQ2IsUUFBUTtBQUFBO0FBQUEsUUFFTixnQkFBZ0I7QUFBQSxRQUNoQixnQkFBZ0I7QUFBQSxRQUNoQixnQkFBZ0I7QUFBQSxRQUNoQixjQUFjO0FBQUEsVUFDWixJQUFJLENBQUMsU0FBUyxXQUFXO0FBQUEsVUFDekIsSUFBSTtBQUFBLFlBQ0Y7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxVQUNGO0FBQUEsVUFDQSxJQUFJO0FBQUEsWUFDRjtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFVBQ0Y7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQTtBQUFBLElBRUEsZ0JBQWdCO0FBQUEsTUFDZCxNQUFNLENBQUMsV0FBVyxVQUFVO0FBQUEsTUFDNUIsZUFBZTtBQUFBLE1BQ2YsbUJBQW1CO0FBQUEsTUFDbkIsY0FBYztBQUFBLE1BQ2Qsa0JBQWtCO0FBQUEsSUFDcEI7QUFBQSxFQUNGO0FBQ0YsRUFBRTsiLAogICJuYW1lcyI6IFtdCn0K
