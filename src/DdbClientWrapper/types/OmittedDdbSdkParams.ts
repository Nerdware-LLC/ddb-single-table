/**
 * Union of deprecated/legacy SDK command-parameter names. To prevent their
 * use, this package omits them from all ddb client parameter typings.
 */
type LegacyDdbSdkParameters =
  | "AttributesToGet" //      Legacy param: instead use ProjectionExpression
  | "AttributeUpdates" //     Legacy param: instead use UpdateExpression
  | "ConditionalOperator" //  Legacy param: instead use ConditionExpression (for Query/Scan, instead use FilterExpression)
  | "Expected" //             Legacy param: instead use ConditionExpression
  | "KeyConditions" //        Legacy param: instead use KeyConditionExpression
  | "QueryFilter" //          Legacy param: instead use FilterExpression
  | "ScanFilter"; //          Legacy param: instead use FilterExpression

/**
 * Union of SDK command-parameter names which are internally handled by wrapper
 * methods and are therefore omitted from method-parameter typings.
 */
type DdbSdkParametersInternallyHandledByWrapper = "TableName";

/**
 * Union of SDK command-parameter names which are removed from method parameters.
 */
export type OmittedDdbSdkParams =
  | LegacyDdbSdkParameters
  | DdbSdkParametersInternallyHandledByWrapper;
