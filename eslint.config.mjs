import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Bridge the shipped eslint-config-next presets (still authored in the legacy
// eslintrc format) into ESLint 9's flat config.
const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "node_modules/**",
      "next-env.d.ts",
      // Standalone email-generation tooling and generated artifacts.
      "scripts/**",
      "emails/**",
    ],
  },
  // Next.js 15 + React 19 + TypeScript rules (Core Web Vitals + TS).
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default eslintConfig;
