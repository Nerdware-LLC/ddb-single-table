import "vitest";
import type { CustomMatcher, allCustomMatcher } from "aws-sdk-client-mock-vitest";

/**
 * This type `Pick`s the [aws-sdk-client-mock-vitest][repo-readme] {@link CustomMatcher}
 * methods that are added to the Vitest `expect` API in the `vitest.setup.ts` file.
 *
 * [repo-readme]: https://github.com/stschulte/aws-sdk-client-mock-vitest#aws-sdk-client-mock-vitest
 */
type AwsSdkClientMockVitestCustomMatchers<T = unknown> = Pick<
  CustomMatcher<T>,
  keyof typeof allCustomMatcher // only the methods from allCustomMatcher, not the aliased ones
>;

declare module "vitest" {
  interface Assertion<T = any> extends AwsSdkClientMockVitestCustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends AwsSdkClientMockVitestCustomMatchers {}
}
