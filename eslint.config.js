import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

export default [
  {
    name: "mushaf-plus/ignores",
    ignores: [
      "dist/**",
      ".vercel/**",
      ".vercel-cli-data/**",
      "node_modules/**",
      "playwright-report/**",
      "test-results/**",
      "coverage/**",
      "design-audit/**",
      "design-audit-2/**",
      "public/boot-recovery.js",
      // Local-only workspaces that are git-ignored and never shipped or gated:
      // `.kilo/worktrees/**` mirrors a whole copy of the repository, and
      // `.codex-artifacts/**` plus `scratch/**` hold one-off investigation
      // probes with no maintenance contract.
      ".kilo/**",
      ".codex-artifacts/**",
      "scratch/**",
      ".scratch-diag/**",
      "tmp-verification-warsh/**",
      "test-results-audio/**",
      "test-results-juz/**",
    ],
  },
  js.configs.recommended,
  {
    files: ["src/**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      "no-empty": ["error", { allowEmptyCatch: true }],
      "no-control-regex": "off",
      "no-irregular-whitespace": "off",
      "no-misleading-character-class": "off",
      "preserve-caught-error": "off",
      "no-useless-assignment": "warn",
      "no-useless-escape": "warn",
      "no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          varsIgnorePattern: "^(React|_)$",
        },
      ],
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
    },
  },
  {
    files: [
      "**/*.{mjs,cjs}",
      "scripts/**/*.{js,mjs,cjs}",
      "tests/**/*.{js,mjs,cjs}",
      "*.{js,mjs,cjs}",
    ],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.node, ...globals.browser },
    },
    rules: {
      "no-empty": ["error", { allowEmptyCatch: true }],
      "no-unused-vars": ["error", { argsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" }],
    },
  },
  {
    // CommonJS probe scripts keep Node's classic module globals.
    files: ["**/*.cjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "commonjs",
      globals: globals.node,
    },
  },
  {
    files: ["public/sw.js"],
    languageOptions: {
      ecmaVersion: "latest",
      globals: globals.serviceworker,
    },
  },
  {
    files: ["mushafplus-motion/animation.js", "mushafplus-motion/render.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "script",
      globals: globals.browser,
    },
  },
];
