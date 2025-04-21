/**
 * This internal union represents the nest-depth of recursively mapped item/attribute types,
 * up to the [DynamoDB maximum nest-depth limit of 32][ddb-nest-max].
 *
 * [ddb-nest-max]: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/ServiceQuotas.html#limits-attributes
 */
// prettier-ignore
export type NestDepthMax32 = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 | 31 | 32;

/**
 * This internal generic takes a {@link NestDepthMax32|NestDepth} type parameter and returns
 * the next nest-depth value, up to a maximum of `32`.
 */
// prettier-ignore
export type IterateNestDepthMax32<NestDepth extends NestDepthMax32 = 0> =
  NestDepth extends 0 ? 1
  : NestDepth extends 1 ? 2
  : NestDepth extends 2 ? 3
  : NestDepth extends 3 ? 4
  : NestDepth extends 4 ? 5
  : NestDepth extends 5 ? 6
  : NestDepth extends 6 ? 7
  : NestDepth extends 7 ? 8
  : NestDepth extends 8 ? 9
  : NestDepth extends 9 ? 10
  : NestDepth extends 10 ? 11
  : NestDepth extends 11 ? 12
  : NestDepth extends 12 ? 13
  : NestDepth extends 13 ? 14
  : NestDepth extends 14 ? 15
  : NestDepth extends 15 ? 16
  : NestDepth extends 16 ? 17
  : NestDepth extends 17 ? 18
  : NestDepth extends 18 ? 19
  : NestDepth extends 19 ? 20
  : NestDepth extends 20 ? 21
  : NestDepth extends 21 ? 22
  : NestDepth extends 22 ? 23
  : NestDepth extends 23 ? 24
  : NestDepth extends 24 ? 25
  : NestDepth extends 25 ? 26
  : NestDepth extends 26 ? 27
  : NestDepth extends 27 ? 28
  : NestDepth extends 28 ? 29
  : NestDepth extends 29 ? 30
  : NestDepth extends 30 ? 31
  : NestDepth extends 31 ? 32
  : 32;
