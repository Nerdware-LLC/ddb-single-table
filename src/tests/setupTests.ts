import dayjs from "dayjs";
import { isDate, isConvertibleToDate } from "../utils";

/**
 * This Vitest setup file accomplishes the following:
 *   1. Implements commonly-used custom matchers.
 *   2. Calls `vi.mock()` to setup default mock implementations for modules
 *      that meet one or more of the following criteria:
 *        - Communicates with external services (e.g. Stripe, AWS SDK)
 *        - Reliant upon the operating environment (e.g., the ENV object)
 *        - Used in many test suites
 *      These default mocks satisfy the needs of most unit+int tests, and
 *      are simply overridden where necessary.
 */

vi.mock("@aws-sdk/client-dynamodb"); // <repo_root>/__mocks__/@aws-sdk/client-dynamodb.ts
vi.mock("@aws-sdk/lib-dynamodb"); //    <repo_root>/__mocks__/@aws-sdk/lib-dynamodb.ts

/**
 * This helper fn returns a `message` for the custom matchers below.
 * - `message` format: `"expected <received> to <predicate> <expected>"`
 */
export const getCustomMatcherMessage = ({
  received,
  expected,
  predicate,
  isNot,
  utils,
}: { received: unknown; expected: unknown; predicate: string } & ReturnType<
  typeof expect.getState
>) => {
  const receivedStr = utils.printReceived(received);
  const expectedStr = utils.printExpected(expected);
  return `expected ${receivedStr} to ${isNot ? "not " : ""}${predicate} ${expectedStr}`;
};

expect.extend({
  /** Test if the `received` array only contains elements specified in the `expected` array. */
  toOnlyContain(received: unknown = [], matchObject: Record<PropertyKey, unknown>) {
    return {
      pass: this.equals(received, expect.arrayContaining([expect.objectContaining(matchObject)])),
      message: () =>
        getCustomMatcherMessage({
          received,
          expected: matchObject,
          predicate: "contain objects matching",
          ...this,
        }),
      actual: received,
      expected: matchObject,
    };
  },
  /** Test if the `received` value matches one of the values in the `expected` array. */
  toBeOneOf(received: unknown, matchers: Array<unknown>) {
    return {
      pass: matchers.findIndex((matcher) => this.equals(received, matcher)) > -1,
      message: () =>
        getCustomMatcherMessage({ received, expected: matchers, predicate: "be one of", ...this }),
      actual: received,
      expected: matchers,
    };
  },
  /** Test if the `received` value matches one of the match-objects in the `expected` array. */
  toMatchOneOf(received: unknown, matchObjects: Array<Record<PropertyKey, unknown>>) {
    return {
      pass:
        matchObjects.findIndex((obj) => this.equals(received, expect.objectContaining(obj))) > -1,
      message: () =>
        getCustomMatcherMessage({
          received,
          expected: matchObjects,
          predicate: "match one of",
          ...this,
        }),
      actual: received,
      expected: matchObjects,
    };
  },
  /** Test if the `received` value represents a valid datetime (can be Date, string, or number). */
  toBeValidDate(received: unknown) {
    return {
      pass: isConvertibleToDate(received) && dayjs(received).isValid(),
      message: () =>
        getCustomMatcherMessage({
          received,
          predicate: "be",
          expected: "a valid Date object, ISO 8601 date string, or numerical timestamp",
          ...this,
        }),
      actual: received,
    };
  },
  /**
   * Test if the `received` value passes the provided function (this is an asymmetric version
   * of the existing [`toSatisfy`](https://vitest.dev/api/expect.html#tosatisfy) matcher.
   */
  toSatisfyFn(received: unknown, matcherFn: (value: unknown) => boolean) {
    return {
      pass: matcherFn.call(this, received),
      message: () =>
        getCustomMatcherMessage({
          received,
          expected: matcherFn.name || "toSatisfy",
          predicate: "pass the function",
          ...this,
        }),
      actual: received,
    };
  },
});
