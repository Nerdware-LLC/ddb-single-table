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
      "SET #attr1 = :attr1, #attr2 = :attr2, #attr3.#bools[0] = :attr3_bools_i0, #attr3.#bools[1] = :attr3_bools_i1, #attr3.#foo.#bar.#baz = :attr3_foo_bar_baz"
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
      ":attr1": "foo",
      ":attr2": 22,
      ":attr3_bools_i0": true,
      ":attr3_bools_i1": false,
      ":attr3_foo_bar_baz": "qux",
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
    expect(result.UpdateExpression).toBe("SET #attr1 = :attr1 REMOVE #attr2");
    expect(result.ExpressionAttributeNames).toStrictEqual({ "#attr1": "attr1", "#attr2": "attr2" });
    expect(result.ExpressionAttributeValues).toStrictEqual({ ":attr1": null });
  });
});
