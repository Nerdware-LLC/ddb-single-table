import { buildAttrPathTokens } from "./buildAttrPathTokens.js";

describe("buildAttrPathTokens()", () => {
  test("builds namePath and valueToken for a simple fieldPath", () => {
    const fieldPath = ["foo", "bar", 0];
    const ExpressionAttributeNames: Record<string, string> = {};

    const result = buildAttrPathTokens(fieldPath, ExpressionAttributeNames);

    expect(result).toStrictEqual({
      namePath: "#foo.#bar[0]",
      valueToken: ":foo_bar_i0",
    });
    expect(ExpressionAttributeNames).toStrictEqual({
      "#foo": "foo",
      "#bar": "bar",
    });
  });

  test("handles a fieldPath with only strings", () => {
    const fieldPath = ["foo", "bar", "baz"];
    const ExpressionAttributeNames: Record<string, string> = {};

    const result = buildAttrPathTokens(fieldPath, ExpressionAttributeNames);

    expect(result).toStrictEqual({
      namePath: "#foo.#bar.#baz",
      valueToken: ":foo_bar_baz",
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

    const result = buildAttrPathTokens(fieldPath, ExpressionAttributeNames);

    expect(result).toStrictEqual({
      namePath: "[0][1][2]",
      valueToken: ":i0_i1_i2",
    });
    expect(ExpressionAttributeNames).toStrictEqual({});
  });

  test("handles an empty fieldPath", () => {
    const fieldPath: Array<string | number> = [];
    const ExpressionAttributeNames: Record<string, string> = {};

    const result = buildAttrPathTokens(fieldPath, ExpressionAttributeNames);

    expect(result).toStrictEqual({
      namePath: "",
      valueToken: "",
    });
    expect(ExpressionAttributeNames).toStrictEqual({});
  });

  test("does not overwrite existing ExpressionAttributeNames", () => {
    const fieldPath = ["foo", "bar"];
    const ExpressionAttributeNames: Record<string, string> = { "#existing": "existing" };

    const result = buildAttrPathTokens(fieldPath, ExpressionAttributeNames);

    expect(result).toStrictEqual({
      namePath: "#foo.#bar",
      valueToken: ":foo_bar",
    });
    expect(ExpressionAttributeNames).toStrictEqual({
      "#existing": "existing",
      "#foo": "foo",
      "#bar": "bar",
    });
  });
});
