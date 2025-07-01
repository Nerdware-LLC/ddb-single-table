/**
 * Union of deprecated SDK command-parameter names. To prevent their use, this
 * package omits them from all command-input types.
 */
export type DeprecatedSdkCommandParameters =
  | "AttributesToGet" //      Deprecated param: instead use ProjectionExpression
  | "AttributeUpdates" //     Deprecated param: instead use UpdateExpression
  | "ConditionalOperator" //  Deprecated param: instead use ConditionExpression (for Query/Scan, instead use FilterExpression)
  | "Expected" //             Deprecated param: instead use ConditionExpression
  | "KeyConditions" //        Deprecated param: instead use KeyConditionExpression
  | "QueryFilter" //          Deprecated param: instead use FilterExpression
  | "ScanFilter"; //          Deprecated param: instead use FilterExpression

/**
 * Union of SDK command-parameter names which are internally handled by `DdbClientFieldParser`
 * methods and are therefore omitted from command-input types.
 */
export type SdkCommandParametersInternallyHandledByArgParser = "TableName";

/**
 * Union of SDK command-parameter names which are removed from command-input types.
 */
export type OmittedSdkParameters =
  | DeprecatedSdkCommandParameters
  | SdkCommandParametersInternallyHandledByArgParser;
