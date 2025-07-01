import type { WhereQueryOperator } from "./types/index.js";

/**
 * Type-guard function for `WhereQueryOperator`.
 *
 * @param str The string to check.
 * @returns A boolean indicating whether the provided `str` is a valid `WhereQueryOperator`.
 */
export const isValidWhereQueryOperator = (str: string): str is WhereQueryOperator => {
  return (
    str === "eq"
    || str === "lt"
    || str === "lte"
    || str === "gt"
    || str === "gte"
    || str === "between"
    || str === "beginsWith"
  );
};
