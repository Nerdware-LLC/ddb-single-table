import type { MarshallingConfigs } from "../../utils/index.js";

/**
 * A `marshallingConfigs` property added to method-param types for methods
 * which involve marshalling/unmarshalling of attribute values.
 */
export type MarshallingConfigsParam = { marshallingConfigs?: MarshallingConfigs };
