import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Disable unused variables warnings
      "@typescript-eslint/no-unused-vars": "off",
      // Disable warnings about conditional hook calls
      "@typescript-eslint/no-empty-object-type": "off",
      "react-hooks/rules-of-hooks": "off",
      "react-hooks/exhaustive-deps": "off",
      // Disable warning for using <img> instead of <Image />
      "@next/next/no-img-element": "off",
      "react/no-unescaped-entities": "off"
    },
  },
];

export default eslintConfig;
