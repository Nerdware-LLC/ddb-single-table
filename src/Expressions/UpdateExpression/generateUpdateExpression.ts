import { buildAttrPathTokens } from "./buildAttrPathTokens.js";
import type { GenerateUpdateExpressionOpts } from "./types.js";
import type { UpdateItemInput } from "../../DdbClientWrapper/types/index.js";
import type { NativeAttributeValue } from "../../types/index.js";

/**
 * This function uses the provided `itemAttributes` to generate the following `updateItem` args:
 *
 * - `UpdateExpression` (may include `"SET"` and/or `"REMOVE"` clauses)
 * - `ExpressionAttributeNames`
 * - `ExpressionAttributeValues`
 *
 * `UpdateExpression` Clauses:
 * - The `"SET"` clause includes all attributes which are _not_ explicitly `undefined`.
 * - The `"REMOVE"` clause includes all attributes which are explicitly set to `undefined`.
 * - If {@link GenerateUpdateExpressionOpts|nullHandling} is `"REMOVE"` (default), then
 *   attributes with `null` values are added to the `"REMOVE"` clause, otherwise they are
 *   added to the `"SET"` clause.
 */
export const generateUpdateExpression = (
  itemAttributes: { [attrName: string]: NativeAttributeValue },
  { nullHandling }: GenerateUpdateExpressionOpts = {}
): {
  [Key in
    | "UpdateExpression"
    | "ExpressionAttributeNames"
    | "ExpressionAttributeValues"]: NonNullable<UpdateItemInput[Key]>;
} => {
  const shouldAddToRemoveClause =
    nullHandling !== "SET"
      ? (value: unknown) => value === undefined || value === null
      : (value: unknown) => value === undefined;

  const updateExpressionClauses: Record<"SET" | "REMOVE", Array<string>> = { SET: [], REMOVE: [] };
  const ExpressionAttributeNames: Record<string, string> = {};
  const ExpressionAttributeValues: Record<string, NativeAttributeValue> = {};

  const recurse = (value: NativeAttributeValue, path: Array<string | number>) => {
    if (
      typeof value === "object"
      && value !== null
      && !(value instanceof Set)
      && !Buffer.isBuffer(value)
    ) {
      if (Array.isArray(value)) {
        value.forEach((arrayElement, index) => {
          recurse(arrayElement, [...path, index]);
        });
      } else {
        for (const key of Object.keys(value)) {
          const keyValue = value[key as keyof typeof value];
          recurse(keyValue, [...path, key]);
        }
      }
    } else {
      const { namePath, valueToken } = buildAttrPathTokens(path, ExpressionAttributeNames);
      // Derive and append the appropriate UpdateExpression clause
      if (shouldAddToRemoveClause(value)) {
        updateExpressionClauses.REMOVE.push(namePath);
      } else {
        updateExpressionClauses.SET.push(`${namePath} = ${valueToken}`);
        ExpressionAttributeValues[valueToken] = value;
      }
    }
  };

  recurse(itemAttributes, []);

  // Combine the clauses into UpdateExpression
  const UpdateExpression = [
    ...(updateExpressionClauses.SET.length > 0
      ? [`SET ${updateExpressionClauses.SET.join(", ")}`]
      : []),
    ...(updateExpressionClauses.REMOVE.length > 0
      ? [`REMOVE ${updateExpressionClauses.REMOVE.join(", ")}`]
      : []),
  ].join(" ");

  return {
    UpdateExpression,
    ExpressionAttributeNames,
    ExpressionAttributeValues,
  };
};
