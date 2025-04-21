import type { BaseItem } from "../../types/index.js";

/**
 * Model config options to define item-level transformations and validations.
 */
export interface ModelSchemaOptions {
  /**
   * Whether write methods should add `"createdAt"` and `"updatedAt"` operation timestamps to
   * item parameters when creating or updating items respectively (default: `false`). Currently
   * only numerical unix timestamps are supported, but other formats like ISO-8601 strings may
   * be supported in the future if there is demand for it.
   *
   * When enabled, timestamp fields are added _before_ any `default` functions defined in your
   * schema are called, so your `default` functions can access the timestamp values for use cases
   * like UUID generation. For example, your schema could define a `"pk"` attribute with a `default`
   * function which generates a timestamp-based UUID using the `createdAt` value.
   */
  readonly autoAddTimestamps?: boolean;

  /**
   * Whether the Model allows items to include properties which aren't defined in its
   * schema on create/upsert operations (default: `false`). This may also be set to
   * an array of strings to only allow certain attributes — this can be useful if the
   * Model includes a `transformItem` function which adds properties to the item.
   */
  readonly allowUnknownAttributes?: boolean | Array<string>;

  /**
   * Item-level transformations to/from the DB.
   */
  readonly transformItem?: {
    /** Fn to modify entire Item before `validate` fn is called. */
    readonly toDB?: (item: any) => BaseItem;
    /** Fn to modify entire Item returned from DDB client. */
    readonly fromDB?: (item: any) => BaseItem;
  };

  /**
   * Item-level custom validation function.
   */
  readonly validateItem?: (item: any) => boolean;
}
