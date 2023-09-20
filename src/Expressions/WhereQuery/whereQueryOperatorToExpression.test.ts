import { WHERE_QUERY_OPERATOR_TO_EXPRESSION as OPERATORS } from "./whereQueryOperatorToExpression";

describe("OPERATORS", () => {
  describe("eq()", () => {
    test("returns the correct expression when called with valid args", () => {
      expect(OPERATORS.eq("#name", [":value"])).toBe("#name = :value");
    });
    test("throws an error when called with the 2nd param set to null or undefined", () => {
      expect(() => OPERATORS.eq("#name", null as any)).toThrow();
      expect(() => OPERATORS.eq("#name", undefined as any)).toThrow();
    });
  });

  describe("lt()", () => {
    test("returns the correct expression when called with valid args", () => {
      expect(OPERATORS.lt("#name", [":value"])).toBe("#name < :value");
    });
    test("throws an error when called with the 2nd param set to null or undefined", () => {
      expect(() => OPERATORS.lt("#name", null as any)).toThrow();
      expect(() => OPERATORS.lt("#name", undefined as any)).toThrow();
    });
  });

  describe("lte()", () => {
    test("returns the correct expression when called with valid args", () => {
      expect(OPERATORS.lte("#name", [":value"])).toBe("#name <= :value");
    });
    test("throws an error when called with the 2nd param set to null or undefined", () => {
      expect(() => OPERATORS.lte("#name", null as any)).toThrow();
      expect(() => OPERATORS.lte("#name", undefined as any)).toThrow();
    });
  });

  describe("gt()", () => {
    test("returns the correct expression when called with valid args", () => {
      expect(OPERATORS.gt("#name", [":value"])).toBe("#name > :value");
    });
    test("throws an error when called with the 2nd param set to null or undefined", () => {
      expect(() => OPERATORS.gt("#name", null as any)).toThrow();
      expect(() => OPERATORS.gt("#name", undefined as any)).toThrow();
    });
  });

  describe("gte()", () => {
    test("returns the correct expression when called with valid args", () => {
      expect(OPERATORS.gte("#name", [":value"])).toBe("#name >= :value");
    });
    test("throws an error when called with the 2nd param set to null or undefined", () => {
      expect(() => OPERATORS.gte("#name", null as any)).toThrow();
      expect(() => OPERATORS.gte("#name", undefined as any)).toThrow();
    });
  });

  describe("beginsWith()", () => {
    test("returns the correct expression when called with valid args", () => {
      expect(OPERATORS.beginsWith("#name", [":value"])).toBe("begins_with( #name, :value )");
    });
    test("throws an error when called with the 2nd param set to null or undefined", () => {
      expect(() => OPERATORS.beginsWith("#name", null as any)).toThrow();
      expect(() => OPERATORS.beginsWith("#name", undefined as any)).toThrow();
    });
  });

  describe("between()", () => {
    test("returns the correct expression when called with valid args", () => {
      expect(OPERATORS.between("#name", [":value1", ":value2"])).toBe(
        "#name BETWEEN :value1 AND :value2"
      );
    });
    test("throws an error when called with the 2nd param set to null or undefined", () => {
      expect(() => OPERATORS.between("#name", null as any)).toThrow();
      expect(() => OPERATORS.between("#name", undefined as any)).toThrow();
    });
  });
});
