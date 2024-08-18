// @ts-check
import eslintJS from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import importPlugin from "eslint-plugin-import-x";
import nodePlugin from "eslint-plugin-node";
import vitestPlugin from "eslint-plugin-vitest";
import globals from "globals";
import tsEslint from "typescript-eslint";

export default tsEslint.config(
  ////////////////////////////////////////////////////////////////
  // ALL FILES
  {
    files: ["src/**/*.[tj]s", "__mocks__/**/*", "./*.[tj]s"],
    linterOptions: { reportUnusedDisableDirectives: true },
    languageOptions: {
      globals: globals.node,
      parser: tsEslint.parser,
      parserOptions: {
        projectService: true,
      },
    },
    plugins: {
      "@typescript-eslint": tsEslint.plugin,
      "import-x": importPlugin,
      node: nodePlugin,
    },
    settings: {
      "import-x/parsers": {
        "@typescript-eslint/parser": [".ts", ".js"],
      },
      "import-x/resolver": {
        node: true,
        typescript: true,
      },
    },
    rules: {
      // MERGE PRESETS:
      ...eslintJS.configs.recommended.rules,
      ...importPlugin.configs.recommended.rules,
      ...importPlugin.configs.typescript.rules,
      ...nodePlugin.configs.recommended.rules,
      ...tsEslint.configs.eslintRecommended.rules, // turns off base eslint rules covered by ts-eslint
      ...[
        ...tsEslint.configs.strictTypeChecked,
        ...tsEslint.configs.stylisticTypeChecked, // prettier-ignore
      ].reduce((accum, config) => ({ ...accum, ...config.rules }), {}),
      // RULE CUSTOMIZATIONS:
      "default-case": "error", //      switch-case statements must have a default case
      "default-case-last": "error", // switch-case statements' default case must be last
      eqeqeq: ["error", "always"],
      "no-console": ["warn", { allow: ["info", "warn", "error"] }],
      "prefer-const": ["warn", { destructuring: "all" }],
      semi: ["error", "always"],
      "import-x/named": "off", //                      TS performs this check
      "import-x/namespace": "off", //                  TS performs this check
      "import-x/default": "off", //                    TS performs this check
      "import-x/no-named-as-default": "off", //        TS performs this check
      "import-x/no-named-as-default-member": "off", // TS performs this check
      "node/no-missing-import": "off", //     Does not work with path aliases
      "node/no-process-env": "error",
      "node/no-unpublished-import": ["error", { allowModules: ["type-fest"] }],
      "@typescript-eslint/array-type": "off", //                      Allow "T[]" and "Array<T>"
      "@typescript-eslint/consistent-indexed-object-style": "off", // Allow "Record<K, V>" and "{ [key: K]: V }"
      "@typescript-eslint/consistent-type-definitions": "off", //     Allow "type" and "interface", there are subtle usage differences
      "@typescript-eslint/no-confusing-void-expression": "off", //    Allow 1-line arrow fns to return void for readability
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-extraneous-class": ["error", { allowStaticOnly: true }],
      "@typescript-eslint/no-inferrable-types": "off",
      "@typescript-eslint/no-misused-promises": [
        "error",
        { checksVoidReturn: { arguments: false } },
      ],
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-unnecessary-boolean-literal-compare": "off", // Allow "if (x === true)"
      "@typescript-eslint/no-unnecessary-type-parameters": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          args: "after-used",
          argsIgnorePattern: "^_",
          vars: "all",
          varsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          ignoreRestSiblings: false,
        },
      ],
      "@typescript-eslint/only-throw-error": "off", // Disabled due to false positives for Error-like objects/subclasses
      "@typescript-eslint/prefer-for-of": "off", //    Allow basic for-loops for performance
      "@typescript-eslint/prefer-nullish-coalescing": [
        "error",
        {
          ignoreConditionalTests: true,
          ignorePrimitives: { string: true },
        },
      ],
      "@typescript-eslint/restrict-template-expressions": [
        "error",
        {
          allowAny: false,
          allowBoolean: true,
          allowNullish: false,
          allowNumber: true,
          allowRegExp: false,
        },
      ],
      ...eslintConfigPrettier.rules, // <-- must be last, removes rules that conflict with prettier
    },
  },
  ////////////////////////////////////////////////////////////////
  // TEST FILES
  {
    files: ["src/**/*.test.ts", "**/tests/**/*", "**/__mocks__/**/*"],
    languageOptions: {
      globals: vitestPlugin.environments.env.globals,
    },
    plugins: {
      vitest: vitestPlugin,
    },
    rules: {
      ...vitestPlugin.configs.recommended.rules,
      "vitest/consistent-test-it": ["error", { fn: "test" }],
      "vitest/no-disabled-tests": "warn",
      "vitest/no-focused-tests": ["warn", { fixable: false }],
      "vitest/prefer-lowercase-title": ["error", { ignore: ["describe"] }],
      "vitest/prefer-to-have-length": "warn",
      "vitest/valid-expect": "error",
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
    },
  }
  ////////////////////////////////////////////////////////////////
);
