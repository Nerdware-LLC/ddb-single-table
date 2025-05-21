import type {
  marshallOptions as MarshallOptions,
  unmarshallOptions as UnmarshallOptions,
} from "@aws-sdk/util-dynamodb";

/**
 * Configs for controlling how item attributes are marshalled and unmarshalled.
 *
 * @see {@link DEFAULT_MARSHALLING_CONFIGS} for the default values.
 */
export type MarshallingConfigs = {
  marshallOptions?: MarshallOptions;
  unmarshallOptions?: UnmarshallOptions;
};

/**
 * Default {@link MarshallingConfigs} for the DynamoDB client.
 *
 * > Note: the SDK defaults all of these options to `false`.
 */
export const DEFAULT_MARSHALLING_CONFIGS = {
  marshallOptions: {
    convertEmptyValues: false,
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  },
  unmarshallOptions: {
    wrapNumbers: false,
  },
} as const satisfies MarshallingConfigs;
