/**
 * This internal union represents the nest-depth of recursively mapped object types.
 * Setting the max depth to `5` successfully resolves ts2589 errors ("Type instantiation
 * is excessively deep and possibly infinite"), which currently occurs when recursively
 * mapping object types.
 * @internal
 */
export type NestDepthMax5 = 0 | 1 | 2 | 3 | 4 | 5;

/**
 * This internal generic takes a {@link NestDepthMax5|NestDepth} type parameter and
 * returns the next nest-depth value, up to a maximum of `5`. These two are used in
 * combination by generic util-types which recursively map object types in order to
 * successfully resolve ts2589 errors ("Type instantiation is excessively deep and
 * possibly infinite").
 * @internal
 */
export type IterateNestDepth<NestDepth extends NestDepthMax5 = 0> = NestDepth extends 0
  ? 1
  : NestDepth extends 1
  ? 2
  : NestDepth extends 2
  ? 3
  : NestDepth extends 3
  ? 4
  : NestDepth extends 4
  ? 5
  : 5;
