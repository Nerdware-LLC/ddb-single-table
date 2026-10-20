/**
 * Builds an attribute path and a value placeholder such as `:v0`.
 * `valueTokenIndex` must be unique for each leaf in an update expression.
 * Attribute-name placeholders are reused where possible and contain only valid characters.
 */
export const buildAttrPathTokens = (
  fieldPath: Array<string | number>,
  ExpressionAttributeNames: Record<string, string>,
  valueTokenIndex: number
): { namePath: string; valueToken: string } => {
  let namePath = "";

  for (const segment of fieldPath) {
    if (typeof segment === "number") {
      namePath += `[${segment}]`;
    } else {
      const baseToken = /^[A-Za-z0-9_]+$/.test(segment) ? `#${segment}` : "#n";
      let token = baseToken;
      let suffix = 0;

      while (
        Object.hasOwn(ExpressionAttributeNames, token)
        && ExpressionAttributeNames[token] !== segment
      ) {
        token = `${baseToken}${suffix++}`;
      }

      namePath += namePath ? `.${token}` : token;
      ExpressionAttributeNames[token] = segment;
    }
  }

  return {
    namePath,
    valueToken: fieldPath.length > 0 ? `:v${valueTokenIndex}` : "",
  };
};
