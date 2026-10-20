import { expectTypeOf } from "vitest";
import type { IterateNestDepthMax32, NestDepthMax32 } from "./NestDepth.js";

describe("NestDepth", () => {
  test("permits exactly the integer depths from zero through 32", () => {
    type Depths = [
      0,
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      11,
      12,
      13,
      14,
      15,
      16,
      17,
      18,
      19,
      20,
      21,
      22,
      23,
      24,
      25,
      26,
      27,
      28,
      29,
      30,
      31,
      32,
    ];

    expectTypeOf<NestDepthMax32>().toEqualTypeOf<Depths[number]>();
    expectTypeOf<-1>().not.toExtend<NestDepthMax32>();
    expectTypeOf<33>().not.toExtend<NestDepthMax32>();
    expectTypeOf<1.5>().not.toExtend<NestDepthMax32>();
    expectTypeOf<number>().not.toExtend<NestDepthMax32>();
  });

  test("increments every depth and saturates at 32", () => {
    type NextDepths = { [Depth in NestDepthMax32]: IterateNestDepthMax32<Depth> };

    expectTypeOf<NextDepths>().toEqualTypeOf<{
      0: 1;
      1: 2;
      2: 3;
      3: 4;
      4: 5;
      5: 6;
      6: 7;
      7: 8;
      8: 9;
      9: 10;
      10: 11;
      11: 12;
      12: 13;
      13: 14;
      14: 15;
      15: 16;
      16: 17;
      17: 18;
      18: 19;
      19: 20;
      20: 21;
      21: 22;
      22: 23;
      23: 24;
      24: 25;
      25: 26;
      26: 27;
      27: 28;
      28: 29;
      29: 30;
      30: 31;
      31: 32;
      32: 32;
    }>();
    expectTypeOf<IterateNestDepthMax32>().toEqualTypeOf<1>();
    expectTypeOf<IterateNestDepthMax32<0 | 15 | 32>>().toEqualTypeOf<1 | 16 | 32>();
  });
});
