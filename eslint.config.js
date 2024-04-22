// @ts-check
import eslintJS from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import importPlugin from "eslint-plugin-import";
import nodePlugin from "eslint-plugin-node";
import vitestPlugin from "eslint-plugin-vitest";
import globals from "globals";
import tsEslint from "typescript-eslint";

/** @type { import("eslint").Linter.FlatConfig } */
export default [
  ////////////////////////////////////////////////////////////////
  // ALL FILES
  {
    files: ["src/**/*.[tj]s", "__mocks__/**/*", "./*.[tj]s"],
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
    languageOptions: {
      globals: globals.node,
      ecmaVersion: "latest",
      sourceType: "module",
      parser: tsEslint.parser,
      parserOptions: {
        project: "./tsconfig.json",
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          globalReturn: false,
        },
      },
    },
    plugins: {
      "@typescript-eslint": tsEslint.plugin,
      import: importPlugin,
      node: nodePlugin,
    },
    rules: {
      // MERGE PRESETS:
      ...eslintJS.configs.recommended.rules,
      ...importPlugin.configs.recommended.rules,
      ...importPlugin.configs["typescript"].rules,
      ...nodePlugin.configs.recommended.rules,
      ...tsEslint.configs.eslintRecommended.rules, // turns off base eslint rules covered by ts-eslint
      ...[
        ...tsEslint.configs.strictTypeChecked,
        ...tsEslint.configs.stylisticTypeChecked, // prettier-ignore
      ].reduce((acc, { rules = {} }) => ({ ...acc, ...rules }), {}),
      // RULE CUSTOMIZATIONS:
      "default-case": "error",
      "default-case-last": "error",
      eqeqeq: ["error", "always"],
      "no-console": ["warn", { allow: ["info", "warn", "error"] }],
      "prefer-const": "warn",
      semi: ["error", "always"],
      "node/no-missing-import": "off",
      "node/no-process-env": "error",
      "node/no-unpublished-import": ["error", { allowModules: ["type-fest", "lodash.set"] }],
      "@typescript-eslint/array-type": "off", // Allow "T[]" and "Array<T>"
      "@typescript-eslint/consistent-indexed-object-style": "off", // Allow "Record<K, V>" and "{ [key: K]: V }"
      "@typescript-eslint/consistent-type-definitions": "off", // Allow "type" and "interface", there are subtle usage differences
      "@typescript-eslint/no-confusing-void-expression": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-extraneous-class": "off",
      "@typescript-eslint/no-inferrable-types": "off",
      "@typescript-eslint/no-misused-promises": [
        "error",
        { checksVoidReturn: { arguments: false } },
      ],
      "@typescript-eslint/no-unnecessary-boolean-literal-compare": "off", // Allow "if (x === true)"
      "@typescript-eslint/no-unnecessary-condition": "off", // Allow option chains to convey "dont know if preceding exists"
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
      "@typescript-eslint/only-throw-error": "off", // <-- rule results in false positives for Error-like objects/subclasses
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
    },
    settings: {
      "import/parsers": {
        "@typescript-eslint/parser": [".ts", ".js"],
      },
      "import/resolver": {
        node: true,
        typescript: {
          project: "./tsconfig.json",
        },
      },
    },
  },
  ////////////////////////////////////////////////////////////////
  // TEST FILES
  {
    files: ["src/**/*.{test,spec}.[tj]s", "**/tests/**/*", "**/__mocks__/**/*"],
    languageOptions: {
      globals: {
        vitest: "readonly",
        vi: "readonly",
        describe: "readonly",
        it: "readonly",
        expect: "readonly",
        assert: "readonly",
        suite: "readonly",
        test: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
      },
    },
    plugins: {
      vitest: vitestPlugin,
      node: nodePlugin,
    },
    rules: {
      ...vitestPlugin.configs.recommended.rules,
      "vitest/no-disabled-tests": "warn",
      "vitest/no-focused-tests": "warn",
      "vitest/prefer-to-have-length": "warn",
      "vitest/valid-expect": "error",
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
    },
  },
  ////////////////////////////////////////////////////////////////
  // eslint-config-prettier (must be last, rm's conflicting rules)

  eslintConfigPrettier,

  ////////////////////////////////////////////////////////////////
];
