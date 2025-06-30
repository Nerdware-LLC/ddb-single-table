/**
 * A non-generic Item-type with _**unknown**_ values.
 *
 * > **This item-type is only for use in generic type constraints that default
 * > to deeply-nested mapped-value types like `ItemTypeFromSchema`, since such
 * > implementations are so memory intensive that they otherwise break the TS
 * > compiler. Broadening the value-constraint to `unknown` resolves this issue.**
 */
export interface UnknownItem {
  [attrName: string]: unknown;
}
