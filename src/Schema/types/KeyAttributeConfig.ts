import type { BaseAttributeConfig } from "./BaseAttributeConfig.js";

/**
 * Key attribute configs.
 */
export interface KeyAttributeConfig extends BaseAttributeConfig {
  /** The key attribute's DynamoDB type (keys can only be S, N, or B). */
  readonly type: "string" | "number" | "Buffer";
  /** Is attribute-value required flag (must be `true` for key attributes). */
  readonly required: true;
  /** Indicates the attribute is the table's hash key (default: `false`) */
  readonly isHashKey?: boolean;
  /** Indicates the attribute is the table's range key (default: `false`) */
  readonly isRangeKey?: boolean;
  /** DynamoDB index configs, provided on the index's hash key. */
  readonly index?: SecondaryIndexConfig;
}

/**
 * Secondary index configs, defined within the the attribute config of the index's hash-key.
 */
export interface SecondaryIndexConfig {
  /** The index name */
  readonly name: string;
  /** Is global index; pass `false` for local indexes (default: `true`). */
  readonly global?: boolean;
  /** The attribute which will serve as the index's range key, if any. */
  readonly rangeKey?: string;
  /** `true`: project ALL, `false`: project KEYS_ONLY, `string[]`: project listed attributes */
  readonly project?: boolean | Array<string>; //
  /** Don't set this when billing mode is PAY_PER_REQUEST */
  readonly throughput?: {
    readonly read: number;
    readonly write: number;
  };
}
