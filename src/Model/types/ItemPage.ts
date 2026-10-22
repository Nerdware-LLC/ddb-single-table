import type { ItemKeys } from "../../types/index.js";

/**
 * A single database page; continuation keys use native, unaliased attribute names.
 */
export type ItemPage<T> = { items: T[]; lastEvaluatedKey?: ItemKeys };
