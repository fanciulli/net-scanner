import globals from "globals";
import pluginJs from "@eslint/js";

/** @type {import('eslint').Linter.Config[]} */
export default [
  { languageOptions: { ecmaVersion: 'latest', globals: globals.node } },
  {
    rules: {
      'no-duplicate-imports': 'error',
      'no-template-curly-in-string': 'warn',
      'no-use-before-define': 'error',
      'require-atomic-updates': 'error'
    }
  },
  pluginJs.configs.recommended
];
