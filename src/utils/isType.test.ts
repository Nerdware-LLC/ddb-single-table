import { isType, isNumber, isTuple, isEnumMember } from "./isType.js";

describe("isType", () => {
  describe("isType.string", () => {
    test("returns true when called with a string", () => {
      expect(isType.string("foo")).toBe(true);
      expect(isType.string(``)).toBe(true);
      expect(isType.string(String())).toBe(true);
    });
    test("returns false when called with a non-string argument", () => {
      expect(isType.string()).toBe(false);
      expect(isType.string(1)).toBe(false);
      expect(isType.string(0)).toBe(false);
      expect(isType.string(NaN)).toBe(false);
      expect(isType.string(true)).toBe(false);
      expect(isType.string(false)).toBe(false);
      expect(isType.string(null)).toBe(false);
      expect(isType.string(undefined)).toBe(false);
      expect(isType.string({})).toBe(false);
      expect(isType.string([])).toBe(false);
      expect(isType.string(new Date())).toBe(false);
      expect(isType.string(new Map())).toBe(false);
      expect(isType.string(new Set())).toBe(false);
      expect(isType.string(Buffer.from(""))).toBe(false);
      expect(isType.string(Symbol(""))).toBe(false);
      expect(isType.string(BigInt(1))).toBe(false);
      expect(isType.string(() => "")).toBe(false);
    });
  });
  describe("isType.number", () => {
    test("returns true when called with a valid number", () => {
      expect(isType.number(0)).toBe(true);
      expect(isType.number(123)).toBe(true);
      expect(isType.number(-123)).toBe(true);
      expect(isType.number(1.23)).toBe(true);
      expect(isType.number(0x7b)).toBe(true); //   123
      expect(isType.number(1.23e2)).toBe(true); // 123
      expect(isType.number(Number.MAX_VALUE)).toBe(true);
      expect(isType.number(Number.MIN_VALUE)).toBe(true);
      expect(isType.number(Number.MAX_SAFE_INTEGER)).toBe(true);
      expect(isType.number(Number.MIN_SAFE_INTEGER)).toBe(true);
    });
    test("returns false when called with anything other than a valid number", () => {
      expect(isType.number()).toBe(false);
      expect(isType.number("number")).toBe(false);
      expect(isType.number("")).toBe(false);
      expect(isType.number(NaN)).toBe(false);
      expect(isType.number(Number.NaN)).toBe(false);
      expect(isType.number(Infinity)).toBe(false);
      expect(isType.number(-Infinity)).toBe(false);
      expect(isType.number(Number.POSITIVE_INFINITY)).toBe(false);
      expect(isType.number(Number.NEGATIVE_INFINITY)).toBe(false);
      expect(isType.number(true)).toBe(false);
      expect(isType.number(false)).toBe(false);
      expect(isType.number(null)).toBe(false);
      expect(isType.number(undefined)).toBe(false);
      expect(isType.number({})).toBe(false);
      expect(isType.number([])).toBe(false);
      expect(isType.number(new Date())).toBe(false);
      expect(isType.number(new Map())).toBe(false);
      expect(isType.number(new Set())).toBe(false);
      expect(isType.number(Buffer.from(""))).toBe(false);
      expect(isType.number(Symbol(""))).toBe(false);
      expect(isType.number(BigInt(1))).toBe(false);
      expect(isType.number(() => "")).toBe(false);
    });
  });
  describe("isType.boolean", () => {
    test("returns true when called with a boolean", () => {
      expect(isType.boolean(true)).toBe(true);
      expect(isType.boolean(false)).toBe(true);
      expect(isType.boolean(!"")).toBe(true);
      expect(isType.boolean(!!"")).toBe(true);
    });
    test("returns false when called with a non-boolean argument", () => {
      expect(isType.boolean()).toBe(false);
      expect(isType.boolean("boolean")).toBe(false);
      expect(isType.boolean("")).toBe(false);
      expect(isType.boolean(1)).toBe(false);
      expect(isType.boolean(0)).toBe(false);
      expect(isType.boolean(NaN)).toBe(false);
      expect(isType.boolean(null)).toBe(false);
      expect(isType.boolean(undefined)).toBe(false);
      expect(isType.boolean({})).toBe(false);
      expect(isType.boolean([])).toBe(false);
      expect(isType.boolean(new Date())).toBe(false);
      expect(isType.boolean(new Map())).toBe(false);
      expect(isType.boolean(new Set())).toBe(false);
      expect(isType.boolean(Buffer.from(""))).toBe(false);
      expect(isType.boolean(Symbol(""))).toBe(false);
      expect(isType.boolean(BigInt(1))).toBe(false);
      expect(isType.boolean(() => "")).toBe(false);
    });
  });
  describe("isType.Buffer", () => {
    test("returns true when called with a Buffer", () => {
      expect(isType.Buffer(Buffer.from("foo"))).toBe(true);
      expect(isType.Buffer(Buffer.from(""))).toBe(true);
    });
    test("returns false when called with a non-Buffer argument", () => {
      expect(isType.Buffer("object")).toBe(false);
      expect(isType.Buffer("")).toBe(false);
      expect(isType.Buffer(1)).toBe(false);
      expect(isType.Buffer(0)).toBe(false);
      expect(isType.Buffer(NaN)).toBe(false);
      expect(isType.Buffer(true)).toBe(false);
      expect(isType.Buffer(false)).toBe(false);
      expect(isType.Buffer(null)).toBe(false);
      expect(isType.Buffer(undefined)).toBe(false);
      expect(isType.Buffer({})).toBe(false);
      expect(isType.Buffer([])).toBe(false);
      expect(isType.Buffer(new Date())).toBe(false);
      expect(isType.Buffer(new Map())).toBe(false);
      expect(isType.Buffer(new Set())).toBe(false);
      expect(isType.Buffer(Symbol(""))).toBe(false);
      expect(isType.Buffer(BigInt(1))).toBe(false);
      expect(isType.Buffer(() => "")).toBe(false);
    });
  });
  describe("isType.Date", () => {
    test("returns true when called with a Date", () => {
      expect(isType.Date(new Date())).toBe(true);
      expect(isType.Date(new Date(2020, 1, 1))).toBe(true);
    });
    test("returns false when called with a non-Date argument", () => {
      expect(isType.Date()).toBe(false);
      expect(isType.Date("object")).toBe(false);
      expect(isType.Date("")).toBe(false);
      expect(isType.Date(1)).toBe(false);
      expect(isType.Date(0)).toBe(false);
      expect(isType.Date(NaN)).toBe(false);
      expect(isType.Date(true)).toBe(false);
      expect(isType.Date(false)).toBe(false);
      expect(isType.Date(null)).toBe(false);
      expect(isType.Date(undefined)).toBe(false);
      expect(isType.Date({})).toBe(false);
      expect(isType.Date([])).toBe(false);
      expect(isType.Date(Date.now())).toBe(false);
      expect(isType.Date(new Date("NOPE"))).toBe(false);
      expect(isType.Date(new Map())).toBe(false);
      expect(isType.Date(new Set())).toBe(false);
      expect(isType.Date(Buffer.from(""))).toBe(false);
      expect(isType.Date(Symbol(""))).toBe(false);
      expect(isType.Date(BigInt(1))).toBe(false);
      expect(isType.Date(() => "")).toBe(false);
    });
  });
  describe("isType.array", () => {
    test("returns true when called with an array", () => {
      expect(isType.array([])).toBe(true);
      expect(isType.array(Array(0))).toBe(true);
    });
    test("returns false when called with a non-array argument", () => {
      expect(isType.array()).toBe(false);
      expect(isType.array("object")).toBe(false);
      expect(isType.array("")).toBe(false);
      expect(isType.array(1)).toBe(false);
      expect(isType.array(0)).toBe(false);
      expect(isType.array(NaN)).toBe(false);
      expect(isType.array(true)).toBe(false);
      expect(isType.array(false)).toBe(false);
      expect(isType.array(null)).toBe(false);
      expect(isType.array(undefined)).toBe(false);
      expect(isType.array({})).toBe(false);
      expect(isType.array(new Date())).toBe(false);
      expect(isType.array(new Map())).toBe(false);
      expect(isType.array(new Set())).toBe(false);
      expect(isType.array(Buffer.from(""))).toBe(false);
      expect(isType.array(Symbol(""))).toBe(false);
      expect(isType.array(BigInt(1))).toBe(false);
      expect(isType.array(() => "")).toBe(false);
    });
  });
  describe("isType.map", () => {
    test("returns true when called with a record-like object", () => {
      expect(isType.map({})).toBe(true);
      expect(isType.map(Object.create(null))).toBe(true);
    });
    test("returns false when called with a non-record-like argument", () => {
      expect(isType.map()).toBe(false);
      expect(isType.map("object")).toBe(false);
      expect(isType.map("")).toBe(false);
      expect(isType.map(1)).toBe(false);
      expect(isType.map(0)).toBe(false);
      expect(isType.map(NaN)).toBe(false);
      expect(isType.map(true)).toBe(false);
      expect(isType.map(false)).toBe(false);
      expect(isType.map(null)).toBe(false);
      expect(isType.map(undefined)).toBe(false);
      expect(isType.map([])).toBe(false);
      expect(isType.map(new Date())).toBe(false);
      expect(isType.map(new Map())).toBe(false);
      expect(isType.map(new Set())).toBe(false);
      expect(isType.map(Buffer.from(""))).toBe(false);
      expect(isType.map(Symbol(""))).toBe(false);
      expect(isType.map(BigInt(1))).toBe(false);
      expect(isType.map(() => "")).toBe(false);
    });
  });
  describe("isType.tuple", () => {
    test("returns true when called with a tuple", () => {
      expect(isType.tuple([], [])).toBe(true);
      expect(isType.tuple([""], [""])).toBe(true);
    });
    test("returns false when called with a non-tuple argument", () => {
      expect(isType.tuple()).toBe(false);
      expect(isType.tuple("")).toBe(false);
      expect(isType.tuple("", undefined)).toBe(false);
      expect(isType.tuple(undefined, "")).toBe(false);
      expect(isType.tuple(undefined, undefined)).toBe(false);
      expect(isType.tuple("string", [])).toBe(false);
      expect(isType.tuple("", [])).toBe(false);
      expect(isType.tuple(1, [])).toBe(false);
      expect(isType.tuple(0, [])).toBe(false);
      expect(isType.tuple(NaN, [])).toBe(false);
      expect(isType.tuple(true, [])).toBe(false);
      expect(isType.tuple(false, [])).toBe(false);
      expect(isType.tuple(null, [])).toBe(false);
      expect(isType.tuple(undefined, [])).toBe(false);
      expect(isType.tuple({}, [])).toBe(false);
      expect(isType.tuple([""], [])).toBe(false);
      expect(isType.tuple([], [""])).toBe(false);
      expect(isType.tuple(new Date(), [])).toBe(false);
      expect(isType.tuple(new Map(), [])).toBe(false);
      expect(isType.tuple(new Set(), [])).toBe(false);
      expect(isType.tuple(Buffer.from(""), [])).toBe(false);
      expect(isType.tuple(Symbol(""), [])).toBe(false);
      expect(isType.tuple(BigInt(1), [])).toBe(false);
      expect(isType.tuple(() => "", [])).toBe(false);
    });
  });
  describe("isType.enum", () => {
    test("returns true when called with a valid enum", () => {
      expect(isType.enum("a", ["a", "b", "c"])).toBe(true);
      expect(isType.enum("", [""])).toBe(true);
    });
    test("returns false when called with invalid enum arguments", () => {
      expect(isType.enum()).toBe(false);
      expect(isType.enum("")).toBe(false);
      expect(isType.enum("", undefined)).toBe(false);
      expect(isType.enum(undefined, "")).toBe(false);
      expect(isType.enum(undefined, undefined)).toBe(false);
      expect(isType.enum("string", ["a", "b", "c"])).toBe(false);
      expect(isType.enum("", ["a", "b", "c"])).toBe(false);
      expect(isType.enum(1, ["a", "b", "c"])).toBe(false);
      expect(isType.enum(0, ["a", "b", "c"])).toBe(false);
      expect(isType.enum(true, ["a", "b", "c"])).toBe(false);
      expect(isType.enum(false, ["a", "b", "c"])).toBe(false);
      expect(isType.enum(null, ["a", "b", "c"])).toBe(false);
      expect(isType.enum(undefined, ["a", "b", "c"])).toBe(false);
      expect(isType.enum({}, ["a", "b", "c"])).toBe(false);
      expect(isType.enum([], ["a", "b", "c"])).toBe(false);
      expect(isType.enum(new Date(), ["a", "b", "c"])).toBe(false);
      expect(isType.enum(Buffer.from(""), ["a", "b", "c"])).toBe(false);
      expect(isType.enum(Symbol(""), ["a", "b", "c"])).toBe(false);
      expect(isType.enum(BigInt(1), ["a", "b", "c"])).toBe(false);
      expect(isType.enum(new Map(), ["a", "b", "c"])).toBe(false);
      expect(isType.enum(new Set(), ["a", "b", "c"])).toBe(false);
      expect(isType.enum(() => "", ["a", "b", "c"])).toBe(false);
    });
  });
});

// INDIVIDUAL TYPE GUARD FUNCTIONS:

describe("isNumber", () => {
  test("returns true when called with a valid number", () => {
    expect(isNumber(0)).toBe(true);
    expect(isNumber(123)).toBe(true);
    expect(isNumber(-123)).toBe(true);
    expect(isNumber(1.23)).toBe(true);
    expect(isNumber(0x7b)).toBe(true); //   123
    expect(isNumber(1.23e2)).toBe(true); // 123
    expect(isNumber(Number.MAX_VALUE)).toBe(true);
    expect(isNumber(Number.MIN_VALUE)).toBe(true);
    expect(isNumber(Number.MAX_SAFE_INTEGER)).toBe(true);
    expect(isNumber(Number.MIN_SAFE_INTEGER)).toBe(true);
  });
  test("returns false when called with anything other than a valid number", () => {
    expect(isNumber()).toBe(false);
    expect(isNumber("number")).toBe(false);
    expect(isNumber("")).toBe(false);
    expect(isNumber(NaN)).toBe(false);
    expect(isNumber(Number.NaN)).toBe(false);
    expect(isNumber(Infinity)).toBe(false);
    expect(isNumber(-Infinity)).toBe(false);
    expect(isNumber(Number.POSITIVE_INFINITY)).toBe(false);
    expect(isNumber(Number.NEGATIVE_INFINITY)).toBe(false);
    expect(isNumber(true)).toBe(false);
    expect(isNumber(false)).toBe(false);
    expect(isNumber(null)).toBe(false);
    expect(isNumber(undefined)).toBe(false);
    expect(isNumber({})).toBe(false);
    expect(isNumber([])).toBe(false);
    expect(isNumber(new Date())).toBe(false);
    expect(isNumber(new Map())).toBe(false);
    expect(isNumber(new Set())).toBe(false);
    expect(isNumber(Buffer.from(""))).toBe(false);
    expect(isNumber(Symbol(""))).toBe(false);
    expect(isNumber(BigInt(1))).toBe(false);
    expect(isNumber(() => "")).toBe(false);
  });
});

describe("isTuple", () => {
  test("returns true when called with a tuple", () => {
    expect(isTuple([], [])).toBe(true);
    expect(isTuple([""], [""])).toBe(true);
  });
  test("returns false when called with a non-tuple argument", () => {
    expect(isTuple()).toBe(false);
    expect(isTuple("")).toBe(false);
    expect(isTuple("", undefined)).toBe(false);
    expect(isTuple(undefined, "")).toBe(false);
    expect(isTuple(undefined, undefined)).toBe(false);
    expect(isTuple("string", [])).toBe(false);
    expect(isTuple("", [])).toBe(false);
    expect(isTuple(1, [])).toBe(false);
    expect(isTuple(0, [])).toBe(false);
    expect(isTuple(NaN, [])).toBe(false);
    expect(isTuple(true, [])).toBe(false);
    expect(isTuple(false, [])).toBe(false);
    expect(isTuple(null, [])).toBe(false);
    expect(isTuple(undefined, [])).toBe(false);
    expect(isTuple({}, [])).toBe(false);
    expect(isTuple([""], [])).toBe(false);
    expect(isTuple([], [""])).toBe(false);
    expect(isTuple(new Date(), [])).toBe(false);
    expect(isTuple(new Map(), [])).toBe(false);
    expect(isTuple(new Set(), [])).toBe(false);
    expect(isTuple(Buffer.from(""), [])).toBe(false);
    expect(isTuple(Symbol(""), [])).toBe(false);
    expect(isTuple(BigInt(1), [])).toBe(false);
    expect(isTuple(() => "", [])).toBe(false);
  });
});

describe("isEnumMember", () => {
  test("returns true when called with a valid enum", () => {
    expect(isEnumMember("a", ["a", "b", "c"])).toBe(true);
    expect(isEnumMember("", [""])).toBe(true);
  });
  test("returns false when called with invalid enum arguments", () => {
    expect(isEnumMember()).toBe(false);
    expect(isEnumMember("")).toBe(false);
    expect(isEnumMember("", undefined)).toBe(false);
    expect(isEnumMember(undefined, "")).toBe(false);
    expect(isEnumMember(undefined, undefined)).toBe(false);
    expect(isEnumMember("string", ["a", "b", "c"])).toBe(false);
    expect(isEnumMember("", ["a", "b", "c"])).toBe(false);
    expect(isEnumMember(1, ["a", "b", "c"])).toBe(false);
    expect(isEnumMember(0, ["a", "b", "c"])).toBe(false);
    expect(isEnumMember(NaN, ["a", "b", "c"])).toBe(false);
    expect(isEnumMember(true, ["a", "b", "c"])).toBe(false);
    expect(isEnumMember(false, ["a", "b", "c"])).toBe(false);
    expect(isEnumMember(null, ["a", "b", "c"])).toBe(false);
    expect(isEnumMember(undefined, ["a", "b", "c"])).toBe(false);
    expect(isEnumMember({}, ["a", "b", "c"])).toBe(false);
    expect(isEnumMember([], ["a", "b", "c"])).toBe(false);
    expect(isEnumMember(new Date(), ["a", "b", "c"])).toBe(false);
    expect(isEnumMember(new Map(), ["a", "b", "c"])).toBe(false);
    expect(isEnumMember(new Set(), ["a", "b", "c"])).toBe(false);
    expect(isEnumMember(Buffer.from(""), ["a", "b", "c"])).toBe(false);
    expect(isEnumMember(Symbol(""), ["a", "b", "c"])).toBe(false);
    expect(isEnumMember(BigInt(1), ["a", "b", "c"])).toBe(false);
    expect(isEnumMember(() => "", ["a", "b", "c"])).toBe(false);
  });
});
