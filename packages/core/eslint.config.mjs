import deMorgan from "eslint-plugin-de-morgan";
import github from "eslint-plugin-github";
import pluginJest from "eslint-plugin-jest";
import perfectionist from "eslint-plugin-perfectionist";
import sonarjs from "eslint-plugin-sonarjs";
import globals from "globals";
import tseslint from "typescript-eslint";

export default [
  { languageOptions: { globals: globals.browser } },
  ...tseslint.configs.recommended,
  {
    files: ["tests/*.test.ts"],
    languageOptions: {
      globals: pluginJest.environments.globals.globals,
    },
    plugins: { jest: pluginJest },
    rules: {
      "jest/no-alias-methods": "error",
      "jest/no-disabled-tests": "warn",
      "jest/no-focused-tests": "error",
      "jest/no-identical-title": "error",
      "jest/prefer-to-have-length": "warn",
      "jest/valid-expect": "error",
    },
  },
  {
    ignores: ["jest.config.ts", "example-flows/**"],
  },
  perfectionist.configs["recommended-alphabetical"],
  perfectionist.configs["recommended-line-length"],
  perfectionist.configs["recommended-natural"],
  sonarjs.configs.recommended,
  deMorgan.configs.recommended,
  ...github.getFlatConfigs().typescript,
];