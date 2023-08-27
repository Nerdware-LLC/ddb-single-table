import eslintJS from "@eslint/js";
import tsEslintPlugin from "@typescript-eslint/eslint-plugin";
import tsEslintParser from "@typescript-eslint/parser";
import importPlugin from "eslint-plugin-import";
import nodePlugin from "eslint-plugin-node";
import vitestPlugin from "eslint-plugin-vitest";
import globals from "globals";

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
      parser: tsEslintParser,
      parserOptions: {
        project: ["./tsconfig.json"],
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": tsEslintPlugin,
      import: importPlugin,
      node: nodePlugin,
    },
    rules: {
      ...eslintJS.configs.recommended.rules,
      ...importPlugin.configs.recommended.rules,
      ...importPlugin.configs["typescript"].rules,
      ...nodePlugin.configs.recommended.rules,
      ...tsEslintPlugin.configs["eslint-recommended"].rules,
      ...tsEslintPlugin.configs.recommended.rules,
      ...tsEslintPlugin.configs["recommended-requiring-type-checking"].rules,
      eqeqeq: ["error", "always"],
      "no-console": "off",
      "no-dupe-class-members": "off", // @typescript-eslint/no-dupe-class-members is used instead
      "no-redeclare": "off", //          @typescript-eslint/no-redeclare is used instead
      "no-unused-vars": "off", //        @typescript-eslint/no-unused-vars is used instead
      "prefer-const": "warn",
      semi: ["error", "always"],
      "import/no-unresolved": "error",
      "node/no-missing-import": "off",
      "node/no-process-env": "error",
      "node/no-unpublished-import": "off",
      "node/no-unsupported-features/es-syntax": "off",
      "@typescript-eslint/ban-types": [
        "error",
        {
          types: { "{}": false /* un-bans `{}`, which is banned by default */ },
          extendDefaults: true,
        },
      ],
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-inferrable-types": "off",
      "@typescript-eslint/no-misused-promises": [
        "error",
        { checksVoidReturn: { arguments: false } },
      ],
      "@typescript-eslint/no-non-null-assertion": "off",
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
    },
    settings: {
      "import/parsers": {
        "@typescript-eslint/parser": [".ts", ".js"],
      },
      "import/resolver": {
        node: true,
        typescript: {
          project: ["./tsconfig.json"],
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
      "@typescript-eslint/no-unsafe-assignment": "off",
    },
  },
  ////////////////////////////////////////////////////////////////
];
