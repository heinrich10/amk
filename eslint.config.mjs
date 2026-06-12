import { defineConfig } from "eslint/config";
import globals from "globals";
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default defineConfig([
  {
    files: ["src/**/*.ts", "test/**/*.ts", "scripts/**/*.ts", "migrations/**/*.ts"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
      },
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
    },
    extends: [
      js.configs.recommended,
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
      "no-var": "error",
      eqeqeq: ["error", "smart"],
      "no-eq-null": "error",
      "strict": ["error", "global"],
      "callback-return": "error",
      "no-process-env": "error",
      "no-process-exit": "error",
      "global-require": "error",
      "default-case": "error",
    },
  },
  {
    files: ["test/**/*.ts"],
    rules: {
      "@typescript-eslint/no-floating-promises": "off",
    },
  },
]);
