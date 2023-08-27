import { hasDefinedProperty } from "./hasDefinedProperty";

describe("hasDefinedProperty()", () => {
  // string key
  test("returns true when the provided object has the provided string key", () => {
    expect(hasDefinedProperty({ foo: "" }, "foo")).toBe(true);
    expect(hasDefinedProperty({ "": "" }, "")).toBe(true); // works with empty-string key
  });
  test("returns false when the provided object does not have the provided string key", () => {
    expect(hasDefinedProperty({ foo: "" }, "NOPE")).toBe(false);
  });
  test("returns false when the provided object has the provided string key, but the value is null/undefined", () => {
    expect(hasDefinedProperty({ foo: null }, "foo")).toBe(false);
    expect(hasDefinedProperty({ foo: undefined }, "foo")).toBe(false);
    expect(hasDefinedProperty({ "": null }, "")).toBe(false); //      empty-string key
    expect(hasDefinedProperty({ "": undefined }, "")).toBe(false); // empty-string key
  });

  // number key
  test("returns true when the provided object has the provided number key", () => {
    expect(hasDefinedProperty({ 1: "" }, 1)).toBe(true); //     works with truthy number key
    expect(hasDefinedProperty({ 0: "" }, 0)).toBe(true); //     works with falsey number key zero
    expect(hasDefinedProperty({ NaN: "" }, NaN)).toBe(true); // works with falsey number key NaN
  });
  test("returns false when the provided object does not have the provided number key", () => {
    expect(hasDefinedProperty({ 1: "" }, 0)).toBe(false); //   truthy key, falsey value
    expect(hasDefinedProperty({ 1: "" }, 5)).toBe(false); //   truthy key, truthy value
    expect(hasDefinedProperty({ 0: "" }, NaN)).toBe(false); // falsey key, falsey value
    expect(hasDefinedProperty({ 0: "" }, 1)).toBe(false); //   falsey key, truthy value
  });
  test("returns false when the provided object has the provided number key, but the value is null/undefined", () => {
    expect(hasDefinedProperty({ 1: null }, 1)).toBe(false);
    expect(hasDefinedProperty({ 1: undefined }, 1)).toBe(false);
  });

  // symbol key
  test("returns true when the provided object has the provided symbol key", () => {
    const sym = Symbol("foo");
    expect(hasDefinedProperty({ [sym]: "" }, sym)).toBe(true);
  });
  test("returns false when the provided object does not have the provided symbol key", () => {
    const sym = Symbol("foo");
    expect(hasDefinedProperty({ [sym]: "" }, Symbol("NOPE"))).toBe(false);
  });
  test("returns false when the provided object has the provided symbol key, but the value is null/undefined", () => {
    const sym = Symbol("foo");
    expect(hasDefinedProperty({ [sym]: null }, sym)).toBe(false);
    expect(hasDefinedProperty({ [sym]: undefined }, sym)).toBe(false);
  });

  // edge cases
  test("returns false when the provided object has no keys", () => {
    expect(hasDefinedProperty({}, "")).toBe(false);
    expect(hasDefinedProperty({}, "foo")).toBe(false);
  });

  // destructive test case
  test("throws an error when called with invalid arguments", () => {
    expect(() => hasDefinedProperty(null as any, "foo")).toThrow();
  });
});
