import { generateUpdateExpression } from "./generateUpdateExpression.js";

describe("generateUpdateExpression()", () => {
  test("returns an empty UpdateExpression when itemAttributes is an empty object", () => {
    const result = generateUpdateExpression({});
    expect(result.UpdateExpression).toBe("");
  });

  test("returns the expected values when called with truthy string/number/object attributes", () => {
    const result = generateUpdateExpression({
      attr1: "foo",
      attr2: 22,
      attr3: {
        bools: [true, false],
        foo: {
          bar: {
            baz: "qux",
          },
        },
      },
    });

    expect(result.UpdateExpression).toBe(
      "SET #attr1 = :v0, #attr2 = :v1, #attr3.#bools[0] = :v2, #attr3.#bools[1] = :v3, #attr3.#foo.#bar.#baz = :v4"
    );
    expect(result.ExpressionAttributeNames).toStrictEqual({
      "#attr1": "attr1",
      "#attr2": "attr2",
      "#attr3": "attr3",
      "#bools": "bools",
      "#foo": "foo",
      "#bar": "bar",
      "#baz": "baz",
    });
    expect(result.ExpressionAttributeValues).toStrictEqual({
      ":v0": "foo",
      ":v1": 22,
      ":v2": true,
      ":v3": false,
      ":v4": "qux",
    });
  });

  test(`returns the expected values when called with null/undefined attributes and "nullHandling" is "REMOVE"`, () => {
    const result = generateUpdateExpression(
      { attr1: null, attr2: undefined },
      { nullHandling: "REMOVE" }
    );
    expect(result.UpdateExpression).toBe("REMOVE #attr1, #attr2");
    expect(result.ExpressionAttributeNames).toStrictEqual({ "#attr1": "attr1", "#attr2": "attr2" });
    expect(result.ExpressionAttributeValues).toStrictEqual({});
  });

  test(`returns the expected values when called with null/undefined attributes and "nullHandling" is "SET"`, () => {
    const result = generateUpdateExpression(
      { attr1: null, attr2: undefined },
      { nullHandling: "SET" }
    );
    expect(result.UpdateExpression).toBe("SET #attr1 = :v0 REMOVE #attr2");
    expect(result.ExpressionAttributeNames).toStrictEqual({ "#attr1": "attr1", "#attr2": "attr2" });
    expect(result.ExpressionAttributeValues).toStrictEqual({ ":v0": null });
  });

  test(`does not overwrite EAV keys when multiple attributes generate the same placeholder`, () => {
    const result = generateUpdateExpression({
      a_b: 1,
      a: { b: 2 },
    });
    expect(result.UpdateExpression).toBe("SET #a_b = :v0, #a.#b = :v1");
    expect(result.ExpressionAttributeNames).toStrictEqual({
      "#a_b": "a_b",
      "#a": "a",
      "#b": "b",
    });
    expect(result.ExpressionAttributeValues).toStrictEqual({
      ":v0": 1,
      ":v1": 2,
    });
  });

  test("uses unique alphanumeric EAV keys for ambiguous and special-character paths", () => {
    const input = {
      "a_b": 1,
      "a": { b: 2, i0: 3 },
      "ab": 4,
      "a_b_1": 5,
      "list": [6, 7],
      "list_i0": 8,
      "a-b": 9,
      "with space": 10,
      "雪": 11,
      "n": 12,
      "n0": 13,
    };
    const result = generateUpdateExpression(input);
    const tokens = result.UpdateExpression.match(/:[A-Za-z0-9]+/g) ?? [];

    expect(tokens).toHaveLength(13);
    expect(new Set(tokens).size).toBe(13);
    expect(Object.keys(result.ExpressionAttributeValues)).toStrictEqual(tokens);
    expect(Object.values(result.ExpressionAttributeValues)).toStrictEqual(
      Array.from({ length: 13 }, (_, index) => index + 1)
    );
    for (const token of Object.keys(result.ExpressionAttributeValues)) {
      expect(token).toMatch(/^:[A-Za-z0-9]+$/);
    }
    for (const token of Object.keys(result.ExpressionAttributeNames)) {
      expect(token).toMatch(/^#[A-Za-z0-9_]+$/);
    }
    expect(new Set(Object.values(result.ExpressionAttributeNames))).toStrictEqual(
      new Set([
        "a_b",
        "a",
        "b",
        "i0",
        "ab",
        "a_b_1",
        "list",
        "list_i0",
        "a-b",
        "with space",
        "雪",
        "n",
        "n0",
      ])
    );
  });

  test("keeps SET values aligned with their paths when REMOVE leaves appear first", () => {
    const result = generateUpdateExpression({
      removed: undefined,
      nested: { value: 0 },
      flag: false,
    });

    expect(result.UpdateExpression).toBe("SET #nested.#value = :v1, #flag = :v2 REMOVE #removed");
    expect(result.ExpressionAttributeValues).toStrictEqual({ ":v1": 0, ":v2": false });
  });

  test("starts value-token allocation afresh for each expression", () => {
    const first = generateUpdateExpression({ a: 1 });
    const second = generateUpdateExpression({ a: 2 });

    expect(first.ExpressionAttributeValues).toStrictEqual({ ":v0": 1 });
    expect(second.ExpressionAttributeValues).toStrictEqual({ ":v0": 2 });
    expect(first.UpdateExpression).toBe(second.UpdateExpression);
  });
});
