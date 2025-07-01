import type {
  marshallOptions as MarshallOptions,
  unmarshallOptions as UnmarshallOptions,
} from "@aws-sdk/util-dynamodb";
import type { Simplify } from "type-fest";

/**
 * A parameter for configuring marshalling/unmarshalling behavior.
 */
export type MarshallingConfigsParameter = {
  /**
   * {@link MarshallingConfigs|Configs} for controlling the
   * marshalling/unmarshalling behavior for attribute values.
   */
  marshallingConfigs?: MarshallingConfigs | undefined;
};

/**
 * Configs for controlling how item attributes are marshalled and unmarshalled.
 *
 * > Note: the SDK defaults all marshalling/unmarshalling options to `false`.
 */
export type MarshallingConfigs = {
  /**
   * ---
   * ### Marshall Options
   *
   * - `convertEmptyValues` (default: `false`)
   *   > ```ts
   *   > marshall({ x: "" }, { convertEmptyValues: true })
   *   > // → { x: { NULL: true } }
   *   > marshall({ x: "" }, { convertEmptyValues: false })
   *   > // → { x: { S: "" } }
   *   > ```
   *
   * - `removeUndefinedValues ` (default: `true`, SDK default: `false`)
   *   > ```ts
   *   > marshall({ a: 1, b: undefined }, { removeUndefinedValues: true })
   *   > // → { a: { N: "1" } }
   *   > marshall({ a: 1, b: undefined }, { removeUndefinedValues: false })
   *   > // → Error
   *   > ```
   *
   * - `convertClassInstanceToMap ` (default: `true`, SDK default: `false`)
   *   > ```ts
   *   > class Foo { constructor(x: number) { this.x = x } }
   *   >
   *   > marshall(new Foo(1), { convertClassInstanceToMap: true })
   *   > // → { x: { N: "1" } }
   *   >
   *   > marshall(new Foo(1), { convertClassInstanceToMap: false })
   *   > // → Error
   *   > ```
   *
   * - `convertTopLevelContainer` (default: `false`)
   *   > ```ts
   *   > marshall([1, 2], { convertTopLevelContainer: true })
   *   > // → { L: [{ N: "1" }, { N: "2" }] }
   *   > marshall([1, 2], { convertTopLevelContainer: false })
   *   > // → [{ N: "1" }, { N: "2" }]
   *   > ```
   *
   * - `allowImpreciseNumbers` (default: `false`)
   *   > ```ts
   *   > marshall({ x: 1e20 }, { allowImpreciseNumbers: true })
   *   > // → { x: { N: "100000000000000000000" } }
   *   > marshall({ x: 1e20 }, { allowImpreciseNumbers: false })
   *   > // → Error
   *   > ```
   */
  marshallOptions?: Simplify<MarshallOptions>;
  /**
   * ---
   * ### Unmarshall Options
   *
   * - `wrapNumbers` (default: `false`)
   *   > ```ts
   *   > unmarshall({ x: { N: "9007199254740992" } }, { wrapNumbers: true })
   *   > // → { x: NumberValue("9007199254740992") }
   *   > unmarshall({ x: { N: "9007199254740992" } }, { wrapNumbers: false })
   *   > // → { x: 9007199254740992 } // may lose precision
   *   > ```
   *
   * - `convertWithoutMapWrapper` (default: `false`)
   *   > ```ts
   *   > unmarshall({ M: { x: { N: "1" } } }, { convertWithoutMapWrapper: true })
   *   > // → { x: 1 }
   *   > unmarshall({ M: { x: { N: "1" } } }, { convertWithoutMapWrapper: false })
   *   > // → Error
   *   > ```
   */
  unmarshallOptions?: Simplify<UnmarshallOptions>;
};
