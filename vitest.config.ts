import { defineConfig, coverageConfigDefaults } from "vitest/config";
import GithubActionsReporter from "vitest-github-actions-reporter";

const isCI = !!process.env.CI;
const isGitHubActionWorkflow = !!process.env.GITHUB_ACTIONS;

export default defineConfig({
  test: {
    /**
     * `restoreMocks` accomplishes the following:
     *   - Removes any mocked implementations (same as mockReset:true).
     *   - Restores the original implementation so fns don't return undefined like with mockReset.
     *   - Clears mock-state for spies created "manually" via `vi.spyOn` (same as clearMocks:true).
     *     > Mock-state is NOT cleared for spies created via *automocking* (`mockReset` does this).
     *
     * `mockReset` accomplishes the following:
     *   - Resets mock-state (call counts, arguments, etc.) for all mocks, including automocks.
     */
    restoreMocks: true,
    mockReset: true,
    unstubGlobals: true,
    globals: true,
    silent: true,
    hideSkippedTests: true,
    watch: false,
    bail: isCI ? 1 : 0, // If in CI, bail on first test failure, else run all tests
    environment: "node",
    setupFiles: ["./vitest.setup.ts"],
    reporters: [
      "default",
      // GithubActionsReporter is used to format test results for GitHub Actions
      ...(isGitHubActionWorkflow ? [new GithubActionsReporter()] : []),
    ],
    coverage: {
      include: ["src/**/*.{js,ts}"],
      exclude: [...coverageConfigDefaults.exclude, "**/index.ts"],
      reporter: [
        "text", // <-- for console output (even in CI, for logging/debugging purposes)
        "lcov", // <-- for uploading coverage info to Codecov
        ...(isGitHubActionWorkflow
          ? ["json-summary"] // <-- for the vitest-coverage-report GitHub Action
          : []),
      ],
    },
  },
});
