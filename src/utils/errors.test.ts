import { DdbSingleTableError } from "./errors";

describe("DdbSingleTableError", () => {
  test(`returns a valid DdbSingleTableError instance when called with a custom error "message"`, () => {
    const errorMessage = "Test error message";
    const errorWithCustomMsg = new DdbSingleTableError(errorMessage);
    expect(errorWithCustomMsg instanceof Error).toBe(true);
    expect(errorWithCustomMsg instanceof DdbSingleTableError).toBe(true);
    expect(errorWithCustomMsg.name).toBe("DdbSingleTableError");
    expect(errorWithCustomMsg.message).toBe(errorMessage);
  });

  test(`returns a valid DdbSingleTableError with a default message when called without args`, () => {
    const errorWithDefaultMsg = new DdbSingleTableError();
    expect(errorWithDefaultMsg instanceof Error).toBe(true);
    expect(errorWithDefaultMsg instanceof DdbSingleTableError).toBe(true);
    expect(errorWithDefaultMsg.name).toBe("DdbSingleTableError");
    expect(errorWithDefaultMsg.message).toBe(DdbSingleTableError.DEFAULT_MSG); // "An unknown error occurred"
  });

  test(`returns a valid DdbSingleTableError with a default message when called with a "message" arg that's not a truthy string`, () => {
    [null, undefined, "", 1, 0, {}, [], Symbol("foo"), BigInt(1), () => {}].forEach((value) => {
      const errorWithDefaultMsg = new DdbSingleTableError(value);
      expect(errorWithDefaultMsg instanceof Error).toBe(true);
      expect(errorWithDefaultMsg instanceof DdbSingleTableError).toBe(true);
      expect(errorWithDefaultMsg.name).toBe("DdbSingleTableError");
      expect(errorWithDefaultMsg.message).toBe(DdbSingleTableError.DEFAULT_MSG); // "An unknown error occurred"
    });
  });

  test("returns a DdbSingleTableError with a stack property containing a stack trace", () => {
    const error = new DdbSingleTableError();
    expect(typeof error.stack).toBe("string");
    expect(error?.stack?.length).toBeGreaterThan(0);
  });

  test("returns a string containing the name and message properties when calling the toString method", () => {
    const errorMessage = "Test error message";
    const error = new DdbSingleTableError(errorMessage);
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    expect(error.toString()).toBe(`DdbSingleTableError: ${errorMessage}`);
  });
});
