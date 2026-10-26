import { NumberValueImpl } from "@aws-sdk/util-dynamodb";
import { ItemInputError } from "../../utils/errors.js";

const numericKey = (value: string): string => {
  const match = /^([+-]?)(\d*)(?:\.(\d*))?(?:e([+-]?\d+))?$/i.exec(value);
  if (!match) throw new ItemInputError("Invalid numeric primary key.");

  let digits = (match[2] + (match.at(3) ?? "")).replace(/^0+/, "");
  if (!digits) return "0";

  let exponent = BigInt(match.at(4) ?? "0") - BigInt((match.at(3) ?? "").length);
  const trailing = /0+$/.exec(digits)?.[0].length ?? 0;

  digits = digits.slice(0, digits.length - trailing);
  exponent += BigInt(trailing);

  return `${match[1] === "-" ? "-" : ""}${digits}e${exponent}`;
};

/**
 * Type-tagged components prevent binary/string and composite-key collisions.
 */
export const canonicalPrimaryKey = (
  item: Record<string, unknown>,
  hashKey: string,
  rangeKey?: string
): string => {
  const encode = (value: unknown): [string, string] => {
    if (typeof value === "string") return ["S", value];
    if (typeof value === "number" || typeof value === "bigint" || value instanceof NumberValueImpl)
      return ["N", numericKey(String(value))];
    if (ArrayBuffer.isView(value))
      return ["B", Buffer.from(value.buffer, value.byteOffset, value.byteLength).toString("hex")];
    if (value instanceof ArrayBuffer) return ["B", Buffer.from(value).toString("hex")];
    throw new ItemInputError("Unsupported primary key value.");
  };
  return JSON.stringify(
    rangeKey ? [encode(item[hashKey]), encode(item[rangeKey])] : [encode(item[hashKey])]
  );
};
