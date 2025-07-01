import { getRecursiveValueConverter } from "./getRecursiveValueConverter.js";

describe("getRecursiveValueConverter()", () => {
  test("returns falsy values as-is", () => {
    const converter = getRecursiveValueConverter(() => undefined);

    expect(converter(null)).toBe(null);
    expect(converter(undefined)).toBe(undefined);
    expect(converter(false)).toBe(false);
    expect(converter(0)).toBe(0);
    expect(converter("")).toBe("");
  });

  test("applies valueConverter to primitive values", () => {
    const converter = getRecursiveValueConverter((value) =>
      typeof value === "number" ? value * 2 : undefined
    );

    expect(converter(3)).toBe(6);
    expect(converter("test")).toBe("test");
  });

  test("recursively applies valueConverter to arrays", () => {
    const converter = getRecursiveValueConverter((value) =>
      typeof value === "string" ? value.toUpperCase() : undefined
    );

    expect(converter(["a", "b", "c"])).toStrictEqual(["A", "B", "C"]);
    expect(converter([1, "x", [2, "y"]])).toStrictEqual([1, "X", [2, "Y"]]);
  });

  test("recursively applies valueConverter to objects", () => {
    const converter = getRecursiveValueConverter((value) =>
      typeof value === "string" ? value + "!" : undefined
    );

    expect(converter({ a: "hi", b: 2, c: { d: "yo", e: [1, "z"] } })).toStrictEqual({
      a: "hi!",
      b: 2,
      c: { d: "yo!", e: [1, "z!"] },
    });
  });

  test("handles mixed nested structures", () => {
    const converter = getRecursiveValueConverter((value) =>
      typeof value === "number" ? value + 1 : undefined
    );

    const input = {
      a: 1,
      b: [2, { c: 3, d: [4, 5] }],
      e: null,
      f: { g: undefined, h: false },
    };

    expect(converter(input)).toStrictEqual({
      a: 2,
      b: [3, { c: 4, d: [5, 6] }],
      e: null,
      f: { g: undefined, h: false },
    });
  });

  test("returns value as-is if valueConverter returns undefined and not array/object", () => {
    const converter = getRecursiveValueConverter(() => undefined);

    const symX = Symbol("x");

    expect(converter(symX as any)).toStrictEqual(symX);
    expect(converter((() => 123) as any)).toBeInstanceOf(Function);
  });
});
