/**
 * Given a `fieldPath` like `['foo', 'bar', 0]`, returns:
 *   - `namePath`:   `"#foo.#bar[0]"`
 *   - `valueToken`: `":foo_bar_i0"`
 *
 * Also populates `ExpressionAttributeNames` for each string segment.
 */
export const buildAttrPathTokens = (
  fieldPath: Array<string | number>,
  ExpressionAttributeNames: Record<string, string>
): { namePath: string; valueToken: string } => {
  let namePath: string = "";
  const valueParts: Array<string> = [];

  for (const segment of fieldPath) {
    if (typeof segment === "number") {
      namePath += `[${segment}]`;
      valueParts.push(`i${segment}`);
    } else {
      const token = `#${segment}`;
      namePath += namePath ? `.${token}` : token; // only add a dot if not the first segment
      valueParts.push(segment);
      ExpressionAttributeNames[token] = segment;
    }
  }

  return {
    namePath,
    valueToken: valueParts.length > 0 ? `:${valueParts.join("_")}` : "",
  };
};
