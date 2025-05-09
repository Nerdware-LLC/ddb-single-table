import { defineConfig, coverageConfigDefaults } from "vitest/config";
import GithubActionsReporter from "vitest-github-actions-reporter";
import type { EmptyObject } from "type-fest";

export default defineConfig({
  test: {
    /**
     * `restoreMocks` accomplishes the following:
     * - clears all spies of `spy.mock.calls` and `spy.mock.results` (same as clearMocks:true)
     * - removes any mocked implementations (same as mockReset:true)
     * - restores the original implementation so fns don't return undefined like with mockReset
     */
    restoreMocks: true,
    globals: true,
    silent: true,
    hideSkippedTests: true,
    watch: false,

    bail: process.env.CI ? 1 : 0, // If in CI, bail on first test failure, else run all tests

    environment: "node",
    setupFiles: "./vitest.setup.ts",

    include: ["**/?(*.){test,spec}.?(c|m)[tj]s?(x)"],

    reporters: [
      "default",
      // GithubActionsReporter is used to format test results for GitHub Actions
      ...(process.env.GITHUB_ACTIONS ? [new GithubActionsReporter()] : []),
    ],

    coverage: {
      include: ["src/**/*.{js,ts}"],
      exclude: [
        ...coverageConfigDefaults.exclude,
        "**/tests/**/*",
        "**/__mocks__/**/*",
        "__mocks__/**/*",
      ],
      reporter: [
        ...(coverageConfigDefaults.reporter as Array<[string, EmptyObject]>),
        // "json-summary" is used by the vitest-coverage-report GitHub Action
        ...(process.env.GITHUB_ACTIONS ? ["json-summary"] : []),
      ],
    },
  },
});
