import { buildAttrPathTokens } from "./buildAttrPathTokens.js";

describe("buildAttrPathTokens()", () => {
  test("builds namePath and valueToken for a simple fieldPath", () => {
    const fieldPath = ["foo", "bar", 0];
    const ExpressionAttributeNames: Record<string, string> = {};

    const result = buildAttrPathTokens(fieldPath, ExpressionAttributeNames, 0);

    expect(result).toStrictEqual({
      namePath: "#foo.#bar[0]",
      valueToken: ":v0",
    });
    expect(ExpressionAttributeNames).toStrictEqual({
      "#foo": "foo",
      "#bar": "bar",
    });
  });

  test("handles a fieldPath with only strings", () => {
    const fieldPath = ["foo", "bar", "baz"];
    const ExpressionAttributeNames: Record<string, string> = {};

    const result = buildAttrPathTokens(fieldPath, ExpressionAttributeNames, 0);

    expect(result).toStrictEqual({
      namePath: "#foo.#bar.#baz",
      valueToken: ":v0",
    });
    expect(ExpressionAttributeNames).toStrictEqual({
      "#foo": "foo",
      "#bar": "bar",
      "#baz": "baz",
    });
  });

  test("handles a fieldPath with only numbers", () => {
    const fieldPath = [0, 1, 2];
    const ExpressionAttributeNames: Record<string, string> = {};

    const result = buildAttrPathTokens(fieldPath, ExpressionAttributeNames, 0);

    expect(result).toStrictEqual({
      namePath: "[0][1][2]",
      valueToken: ":v0",
    });
    expect(ExpressionAttributeNames).toStrictEqual({});
  });

  test("handles an empty fieldPath", () => {
    const fieldPath: Array<string | number> = [];
    const ExpressionAttributeNames: Record<string, string> = {};

    const result = buildAttrPathTokens(fieldPath, ExpressionAttributeNames, 0);

    expect(result).toStrictEqual({
      namePath: "",
      valueToken: "",
    });
    expect(ExpressionAttributeNames).toStrictEqual({});
  });

  test("does not overwrite existing ExpressionAttributeNames", () => {
    const fieldPath = ["foo", "bar"];
    const ExpressionAttributeNames: Record<string, string> = { "#existing": "existing" };

    const result = buildAttrPathTokens(fieldPath, ExpressionAttributeNames, 0);

    expect(result).toStrictEqual({
      namePath: "#foo.#bar",
      valueToken: ":v0",
    });
    expect(ExpressionAttributeNames).toStrictEqual({
      "#existing": "existing",
      "#foo": "foo",
      "#bar": "bar",
    });
  });

  test("uses the supplied unique index instead of concatenating path segments", () => {
    const names: Record<string, string> = {};
    const paths = [["a_b"], ["a", "b"], ["ab"], ["a", 0], ["a", "i0"]];
    const tokens = paths.map((path, index) => buildAttrPathTokens(path, names, index).valueToken);

    expect(tokens).toStrictEqual([":v0", ":v1", ":v2", ":v3", ":v4"]);
    expect(new Set(tokens).size).toBe(paths.length);

    for (const token of tokens) expect(token).toMatch(/^:[A-Za-z0-9]+$/);
  });

  test("aliases punctuation and Unicode with valid, distinct name placeholders", () => {
    const names: Record<string, string> = {};
    const segments = ["first-name", "with space", "a.b", "雪", "n", "n0", ""];
    const paths = segments.map((segment, index) => buildAttrPathTokens([segment], names, index));

    expect(new Set(paths.map(({ namePath }) => namePath)).size).toBe(segments.length);

    for (const [index, { namePath, valueToken }] of paths.entries()) {
      expect(namePath).toMatch(/^#[A-Za-z0-9_]+$/);
      expect(names[namePath]).toBe(segments[index]);
      expect(valueToken).toMatch(/^:[A-Za-z0-9]+$/);
    }
  });

  test("reuses aliases without overwriting a pre-existing conflicting binding", () => {
    const names = { "#n": "reserved", "#foo": "anotherAttribute" };
    const first = buildAttrPathTokens(["foo", "a-b", 1], names, 0);
    const second = buildAttrPathTokens(["foo", "a-b", 2], names, 1);

    expect(first).toStrictEqual({ namePath: "#foo0.#n0[1]", valueToken: ":v0" });
    expect(second).toStrictEqual({ namePath: "#foo0.#n0[2]", valueToken: ":v1" });
    expect(names).toStrictEqual({
      "#n": "reserved",
      "#foo": "anotherAttribute",
      "#foo0": "foo",
      "#n0": "a-b",
    });
  });
});
