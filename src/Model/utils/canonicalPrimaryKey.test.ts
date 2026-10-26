import { NumberValueImpl } from "@aws-sdk/util-dynamodb";
import { canonicalPrimaryKey } from "./canonicalPrimaryKey.js";

describe("canonicalPrimaryKey", () => {
  test("normalizes binary and numeric primary keys without composite/string collisions", () => {
    expect(canonicalPrimaryKey({ pk: Buffer.from([1, 2]) }, "pk")).toBe(
      canonicalPrimaryKey({ pk: new Uint8Array([1, 2]) }, "pk")
    );
    expect(canonicalPrimaryKey({ pk: 1 }, "pk")).toBe(
      canonicalPrimaryKey({ pk: new NumberValueImpl("1.00e0") }, "pk")
    );
    expect(canonicalPrimaryKey({ pk: 1000n }, "pk")).toBe(
      canonicalPrimaryKey({ pk: new NumberValueImpl("1e3") }, "pk")
    );
    expect(canonicalPrimaryKey({ pk: "0102" }, "pk")).not.toBe(
      canonicalPrimaryKey({ pk: Buffer.from([1, 2]) }, "pk")
    );
    expect(canonicalPrimaryKey({ pk: "a|b", sk: "c" }, "pk", "sk")).not.toBe(
      canonicalPrimaryKey({ pk: "a", sk: "b|c" }, "pk", "sk")
    );
  });
});
