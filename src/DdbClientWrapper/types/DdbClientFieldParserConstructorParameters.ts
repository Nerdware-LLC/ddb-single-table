import type { MarshallingConfigsParameter } from "./MarshallingConfigs.js";
import type { ModelSchemaType } from "../../Schema/types/index.js";
import type { Simplify } from "type-fest";

/**
 * `DdbClientFieldParser` class constructor params.
 */
export type DdbClientFieldParserConstructorParameters = Simplify<
  {
    /** The name of the DynamoDB table. */
    tableName: string;
    /** Legacy blanket conversion remains the wrapper default; Models supply their schema. */
    dateConversion?: "legacy" | "none";
    dateSchema?: ModelSchemaType;
  } & MarshallingConfigsParameter
>;
