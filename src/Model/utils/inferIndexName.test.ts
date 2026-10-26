import { inferIndexName } from "./inferIndexName.js";
import type { TableIndexesMap } from "../../Table/types/TableKeysAndIndexes.js";

describe("inferIndexName", () => {
  const indexes: TableIndexesMap = {
    sk_gsi: { name: "sk_gsi", type: "GLOBAL", indexPK: "sk", indexSK: "data" },
    data_gsi: { name: "data_gsi", type: "GLOBAL", indexPK: "data", indexSK: "sk" },
    sk_pk_gsi: { name: "sk_pk_gsi", type: "GLOBAL", indexPK: "sk", indexSK: "pk" },
    hash_only_gsi: { name: "hash_only_gsi", type: "GLOBAL", indexPK: "group" },
    pk_lsi: { name: "pk_lsi", type: "LOCAL", indexPK: "pk", indexSK: "data" },
  };

  test.each([
    { pkAttrName: "sk", skAttrName: "data", expected: "sk_gsi" },
    { pkAttrName: "data", skAttrName: "sk", expected: "data_gsi" },
    { pkAttrName: "sk", skAttrName: "pk", expected: "sk_pk_gsi" },
    { pkAttrName: "pk", skAttrName: "data", expected: "pk_lsi" },
  ])(
    "matches partition=$pkAttrName and sort=$skAttrName to $expected",
    ({ pkAttrName, skAttrName, expected }) => {
      expect(inferIndexName({ pkAttrName, skAttrName }, indexes)).toBe(expected);
    }
  );

  test.each([
    { pkAttrName: "sk", expected: "sk_gsi" },
    { pkAttrName: "data", expected: "data_gsi" },
    { pkAttrName: "group", expected: "hash_only_gsi" },
    { pkAttrName: "pk", expected: "pk_lsi" },
  ])(
    "matches partition=$pkAttrName without a sort key to $expected",
    ({ pkAttrName, expected }) => {
      expect(inferIndexName({ pkAttrName }, indexes)).toBe(expected);
    }
  );

  test("selects the first configured match when a partition-only query is ambiguous", () => {
    const reorderedIndexes = {
      sk_pk_gsi: indexes.sk_pk_gsi,
      sk_gsi: indexes.sk_gsi,
    };

    expect(inferIndexName({ pkAttrName: "sk" }, indexes)).toBe("sk_gsi");
    expect(inferIndexName({ pkAttrName: "sk" }, reorderedIndexes)).toBe("sk_pk_gsi");
  });

  test("selects the first configured match when multiple indexes have the same key pair", () => {
    const duplicateIndexes = {
      sk_gsi: indexes.sk_gsi,
      duplicate_gsi: { ...indexes.sk_gsi, name: "duplicate_gsi" },
    };

    expect(inferIndexName({ pkAttrName: "sk", skAttrName: "data" }, duplicateIndexes)).toBe(
      "sk_gsi"
    );
  });

  test.each([
    { pkAttrName: "missing" },
    { pkAttrName: "missing", skAttrName: "sk" },
    { pkAttrName: "sk", skAttrName: "missing" },
    { pkAttrName: "data", skAttrName: "pk" },
    { pkAttrName: "group", skAttrName: "sk" },
  ])("returns undefined for unmatched query keys $pkAttrName / $skAttrName", (queryKeys) => {
    expect(inferIndexName(queryKeys, indexes)).toBeUndefined();
  });

  test.each([undefined, {}])("returns undefined when indexes is %j", (emptyIndexes) => {
    expect(inferIndexName({ pkAttrName: "sk", skAttrName: "data" }, emptyIndexes)).toBeUndefined();
  });
});
