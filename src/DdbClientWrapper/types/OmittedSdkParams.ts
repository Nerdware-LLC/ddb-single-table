/**
 * Union of deprecated/legacy SDK command-parameter names. To prevent their use,
 * this package omits them from all command-input types.
 */
type LegacySdkCommandParams =
  | "AttributesToGet" //      Legacy param: instead use ProjectionExpression
  | "AttributeUpdates" //     Legacy param: instead use UpdateExpression
  | "ConditionalOperator" //  Legacy param: instead use ConditionExpression (for Query/Scan, instead use FilterExpression)
  | "Expected" //             Legacy param: instead use ConditionExpression
  | "KeyConditions" //        Legacy param: instead use KeyConditionExpression
  | "QueryFilter" //          Legacy param: instead use FilterExpression
  | "ScanFilter"; //          Legacy param: instead use FilterExpression

/**
 * Union of SDK command-parameter names which are internally handled by `DdbClientArgParser`
 * methods and are therefore omitted from command-input types.
 */
type SdkCommandParamsInternallyHandledByArgParser = "TableName";

/**
 * Union of SDK command-parameter names which are removed from command-input types.
 */
export type OmittedSdkParams =
  | LegacySdkCommandParams
  | SdkCommandParamsInternallyHandledByArgParser;
