import type { MarshallingConfigsParameter } from "./MarshallingConfigs.js";
import type { Simplify } from "type-fest";

/**
 * `DdbClientFieldParser` class constructor params.
 */
export type DdbClientFieldParserConstructorParameters = Simplify<
  {
    /** The name of the DynamoDB table. */
    tableName: string;
  } & MarshallingConfigsParameter
>;
