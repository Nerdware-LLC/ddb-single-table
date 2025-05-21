import type { TableKeysSchemaType, ModelSchemaType } from "../../Schema/types/index.js";
import type { AttrAliasOrName, NativeAttributeValue } from "../../types/index.js";

/**
 * This generic is used by the Model class to provide intellisense for the aliased key params
 * that methods like `getItem()` and `deleteItem()` accept as input.
 */
export type KeyParameters<Schema extends TableKeysSchemaType | ModelSchemaType> = {
  // Required — filter out RangeKey if configured with a functional default
  -readonly [Key in keyof Schema as Schema[Key] extends
    | { isHashKey: true }
    | { isRangeKey: true; default?: undefined }
    ? AttrAliasOrName<Schema, Key, { aliasKeys: true }>
    : never]-?: string | number;
} & {
  // This map will set RangeKey to optional if configured with a functional default
  -readonly [Key in keyof Schema as Schema[Key] extends {
    isRangeKey: true;
    default: (item: any) => NativeAttributeValue;
  }
    ? AttrAliasOrName<Schema, Key, { aliasKeys: true }>
    : never]+?: string | number;
};
