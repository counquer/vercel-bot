expimport js from "@eslint/js";
import node from "eslint-plugin-n";
import globals from "globals";

export default [
  js.configs.recommended,
  {
    plugins: { n: node },
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
    rules: {
      "n/no-unsupported-features/es-syntax": "off", // Permite import/export ESM
      "n/no-missing-import": "error", // Marca error si falta un import
      "n/no-unpublished-import": "warn", // Advierte si importas algo no publicado
      "no-unused-vars": ["warn", { args: "none", ignoreRestSiblings: true }],
      "no-console": "off", // Permite console.log
      // Agrega más reglas aquí si lo deseas
    },
  },
];