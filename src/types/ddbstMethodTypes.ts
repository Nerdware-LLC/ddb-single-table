import type { Model } from "../Model";
import type { ItemInputType, ItemOutputType } from "./itemTypes";
import type {
  TableKeysSchemaType,
  ModelSchemaType,
  ModelSchemaOptions,
  MergeModelAndTableKeysSchema,
} from "./schemaTypes";

/**
 * This type defines the `createModel` method of DdbSingleTable class instances.
 */
export type DdbSingleTableCreateModelMethod<TableKeysSchema extends TableKeysSchemaType> = <
  ModelSchema extends ModelSchemaType<TableKeysSchema>,
  ItemOutput extends Record<string, any> = ItemOutputType<
    MergeModelAndTableKeysSchema<TableKeysSchema, ModelSchema>
  >,
  ItemInput extends Record<string, any> = ItemInputType<
    MergeModelAndTableKeysSchema<TableKeysSchema, ModelSchema>
  >
>(
  modelName: string,
  modelSchema: ModelSchema,
  modelSchemaOptions?: ModelSchemaOptions
) => InstanceType<
  typeof Model<MergeModelAndTableKeysSchema<TableKeysSchema, ModelSchema>, ItemOutput, ItemInput>
>;
