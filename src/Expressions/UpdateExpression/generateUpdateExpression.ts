import { getExpressionAttrTokens } from "../helpers.js";
import type { GenerateUpdateExpressionOpts } from "./types.js";
import type { UpdateItemInput } from "../../DdbClientWrapper/types/index.js";

/**
 * This function uses the provided `itemAttributes` to generate the following `updateItem` args:
 *
 * - `UpdateExpression` (may include `"SET"` and/or `"REMOVE"` clauses)
 * - `ExpressionAttributeNames`
 * - `ExpressionAttributeValues`
 *
 * Attribute names and values in the `UpdateExpression` are replaced with token placeholders, which
 * here are derived by removing all non-letter characters from the key, and then adding a num-sign
 * prefix to the EA-Names token and a colon prefix to the the EA-Values token. For example, an
 * attribute `"foo-1"` would yield clause `"#foo = :foo"` in the `UpdateExpression`.
 *
 * `UpdateExpression` Clauses:
 * - The `"SET"` clause includes all attributes which are _not_ explicitly `undefined`.
 * - The `"REMOVE"` clause includes all attributes which are explicitly set to `undefined`.
 * - If **{@link GenerateUpdateExpressionOpts|nullHandling}** is `"REMOVE"` (default), then
 *   attributes with `null` values are added to the `"REMOVE"` clause, otherwise they are
 *   added to the `"SET"` clause.
 */
export const generateUpdateExpression = (
  itemAttributes: { [attrName: string]: unknown },
  { nullHandling }: GenerateUpdateExpressionOpts = {}
) => {
  const shouldAddToRemoveClause =
    nullHandling !== "SET"
      ? (value: unknown) => value === undefined || value === null
      : (value: unknown) => value === undefined;

  const updateExpressionClauses = { SET: "", REMOVE: "" };
  const ExpressionAttributeNames: UpdateItemInput["ExpressionAttributeNames"] = {};
  const ExpressionAttributeValues: UpdateItemInput["ExpressionAttributeValues"] = {};

  for (const attributeName in itemAttributes) {
    const attributeValue = itemAttributes[attributeName];
    // Get the keys for ExpressionAttribute{Names,Values}
    const { attrNamesToken, attrValuesToken } = getExpressionAttrTokens(attributeName);
    // Always update ExpressionAttributeNames
    ExpressionAttributeNames[attrNamesToken] = attributeName;
    // Derive and append the appropriate UpdateExpression clause
    if (shouldAddToRemoveClause(attributeValue)) {
      updateExpressionClauses.REMOVE += `${attrNamesToken}, `;
    } else {
      updateExpressionClauses.SET += `${attrNamesToken} = ${attrValuesToken}, `;
      // Only add to EAV if attrValue will be used, otherwise DDB will throw error
      ExpressionAttributeValues[attrValuesToken] = attributeValue;
    }
  }

  // Combine the clauses into UpdateExpression (slice to rm last comma+space)
  const UpdateExpression = [
    ...(updateExpressionClauses.SET.length > 0
      ? [`SET ${updateExpressionClauses.SET.slice(0, -2)}`]
      : []),
    ...(updateExpressionClauses.REMOVE.length > 0
      ? [`REMOVE ${updateExpressionClauses.REMOVE.slice(0, -2)}`]
      : []),
  ].join(" ");

  return {
    UpdateExpression,
    ExpressionAttributeNames,
    ExpressionAttributeValues,
  };
};
