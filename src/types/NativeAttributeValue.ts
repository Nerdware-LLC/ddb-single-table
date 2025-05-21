import type {
  NativeScalarAttributeValue,
  NativeAttributeBinary,
  NumberValue,
} from "@aws-sdk/util-dynamodb";

/**
 * The SDK's `NativeAttributeValue` type gets resolved to `any` due to the `InstanceType`
 * union member (`InstanceType<new (...args: any[]) => any>` is just `any` with extra steps).
 * This type is a copy of the SDK's type, only without the problematic `InstanceType` member.
 */
export type NativeAttributeValue =
  | NativeScalarAttributeValue
  | { [key: string]: NativeAttributeValue }
  | NativeAttributeValue[]
  | Set<string | number | bigint | NumberValue | NativeAttributeBinary | undefined>;

/**
 * A union of {@link NativeAttributeValue} types that can be used as a key in a DynamoDB table.
 */
export type NativeKeyAttributeValue =
  | string
  | number
  | bigint
  | NumberValue
  | NativeAttributeBinary;
