import { convertWhereQueryToSdkQueryArgs } from "./convertWhereQueryToSdkQueryArgs.js";

describe("convertWhereQueryToSdkQueryArgs()", () => {
  // positive test case: valid short-hand "eq" WhereQuery field
  test(`returns the correct QueryCommand args when called with a valid short-hand "eq" WhereQuery field`, () => {
    const result = convertWhereQueryToSdkQueryArgs({
      where: {
        name: "Foo",
      },
    });
    expect(result).toStrictEqual({
      KeyConditionExpression: "#name = :name",
      ExpressionAttributeNames: { "#name": "name" },
      ExpressionAttributeValues: { ":name": "Foo" },
    });
  });

  // positive test case: one valid WhereQuery field
  test("returns the correct QueryCommand args when called with just one valid WhereQuery field", () => {
    const result = convertWhereQueryToSdkQueryArgs({
      where: {
        name: { eq: "Foo" },
      },
    });
    expect(result).toStrictEqual({
      KeyConditionExpression: "#name = :name",
      ExpressionAttributeNames: { "#name": "name" },
      ExpressionAttributeValues: { ":name": "Foo" },
    });
  });

  // positive test case: valid "eq" and "lt"
  test(`returns the correct QueryCommand args when called with valid "eq" and "lt" WhereQuery fields`, () => {
    const result = convertWhereQueryToSdkQueryArgs({
      where: {
        name: { eq: "Foo" },
        age: { lt: 30 },
      },
    });
    expect(result).toStrictEqual({
      KeyConditionExpression: "#name = :name AND #age < :age",
      ExpressionAttributeNames: {
        "#name": "name",
        "#age": "age",
      },
      ExpressionAttributeValues: {
        ":name": "Foo",
        ":age": 30,
      },
    });
  });

  // positive test case: valid "eq" and "lte"
  test(`returns the correct QueryCommand args when called with valid "eq" and "lte" WhereQuery fields`, () => {
    const result = convertWhereQueryToSdkQueryArgs({
      where: {
        name: { eq: "Foo" },
        age: { lte: 30 },
      },
    });
    expect(result).toStrictEqual({
      KeyConditionExpression: "#name = :name AND #age <= :age",
      ExpressionAttributeNames: {
        "#name": "name",
        "#age": "age",
      },
      ExpressionAttributeValues: {
        ":name": "Foo",
        ":age": 30,
      },
    });
  });

  // positive test case: valid "eq" and "gt"
  test(`returns the correct QueryCommand args when called with valid "eq" and "gt" WhereQuery fields`, () => {
    const result = convertWhereQueryToSdkQueryArgs({
      where: {
        name: { eq: "Foo" },
        age: { gt: 30 },
      },
    });
    expect(result).toStrictEqual({
      KeyConditionExpression: "#name = :name AND #age > :age",
      ExpressionAttributeNames: {
        "#name": "name",
        "#age": "age",
      },
      ExpressionAttributeValues: {
        ":name": "Foo",
        ":age": 30,
      },
    });
  });

  // positive test case: valid "eq" and "gte"
  test(`returns the correct QueryCommand args when called with valid "eq" and "gte" WhereQuery fields`, () => {
    const result = convertWhereQueryToSdkQueryArgs({
      where: {
        name: { eq: "Foo" },
        age: { gte: 30 },
      },
    });
    expect(result).toStrictEqual({
      KeyConditionExpression: "#name = :name AND #age >= :age",
      ExpressionAttributeNames: {
        "#name": "name",
        "#age": "age",
      },
      ExpressionAttributeValues: {
        ":name": "Foo",
        ":age": 30,
      },
    });
  });

  // positive test case: valid "eq" and "between"
  test(`returns the correct QueryCommand args when called with valid "eq" and "between" WhereQuery fields`, () => {
    const result = convertWhereQueryToSdkQueryArgs({
      where: {
        name: { eq: "Foo" },
        age: { between: [15, 30] },
      },
    });
    expect(result).toStrictEqual({
      KeyConditionExpression: "#name = :name AND #age BETWEEN :ageLowerBound AND :ageUpperBound",
      ExpressionAttributeNames: {
        "#name": "name",
        "#age": "age",
      },
      ExpressionAttributeValues: {
        ":name": "Foo",
        ":ageLowerBound": 15,
        ":ageUpperBound": 30,
      },
    });
  });

  // positive test case: valid "eq" and "beginsWith"
  test(`returns the correct QueryCommand args when called with valid "eq" and "beginsWith" WhereQuery fields`, () => {
    const result = convertWhereQueryToSdkQueryArgs({
      where: {
        name: { eq: "Foo" },
        favoriteAnime: { beginsWith: "The Dragon Prince" },
      },
    });
    expect(result).toStrictEqual({
      KeyConditionExpression: `#name = :name AND begins_with( #favoriteAnime, :favoriteAnime )`,
      ExpressionAttributeNames: {
        "#name": "name",
        "#favoriteAnime": "favoriteAnime",
      },
      ExpressionAttributeValues: {
        ":name": "Foo",
        ":favoriteAnime": "The Dragon Prince",
      },
    });
  });

  // destructive test case: the provided arg is not an object with a "where" property
  test(`throws an InvalidExpressionError when the provided arg is not an object with a "where" property`, () => {
    [undefined, null, [], { foo: "bar" }, true, NaN, 10].forEach((invalidArg) => {
      expect(() => convertWhereQueryToSdkQueryArgs(invalidArg as any)).toThrow();
    });
  });

  // destructive test case: "where" value is not an object with enumerable properties
  test(`throws an InvalidExpressionError when "where" value is not an object with enumerable properties`, () => {
    [undefined, null, [], true, NaN, 10].forEach((invalidWhereValue) => {
      expect(() =>
        convertWhereQueryToSdkQueryArgs({ where: invalidWhereValue as any })
      ).toThrowError(/Invalid "where" value .* object with enumerable properties/is);
      // Regex note: the "s" flag allows . to match newline characters
    });
  });

  // destructive test case: 3+ WhereQuery entries/K-V pairs
  test(`throws an InvalidExpressionError when called with 3+ WhereQuery entries`, () => {
    expect(() =>
      convertWhereQueryToSdkQueryArgs({
        where: {
          name: { eq: "Foo" },
          age: { between: [15, 30] },
          height: { gt: 60 }, // <-- 3rd entry
        },
      })
    ).toThrowError(/the WhereQuery object contains more than two keys/i);
  });

  // destructive test case: no "eq" expression
  test(`throws an InvalidExpressionError when called without an "eq" expression`, () => {
    expect(() =>
      convertWhereQueryToSdkQueryArgs({
        where: {
          name: { beginsWith: "Foo" },
          age: { between: [15, 30] },
        },
      })
    ).toThrowError(/KeyConditionExpressions must include an equality check/i);
    expect(() =>
      convertWhereQueryToSdkQueryArgs({
        where: {},
      })
    ).toThrowError(/KeyConditionExpressions must include an equality check/i);
  });
});
