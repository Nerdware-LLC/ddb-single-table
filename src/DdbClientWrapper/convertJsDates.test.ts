import { convertJsDates } from "./convertJsDates.js";
import type { IODirection } from "../IOActions/types/index.js";
import type { BaseItem } from "../types/index.js";

describe("convertJsDates", () => {
  const toDB: IODirection = "toDB";
  const fromDB: IODirection = "fromDB";

  test("converts Date objects to ISO-8601 strings (toDB)", () => {
    const date = new Date("2023-01-01T12:00:00Z");
    const item: BaseItem = { foo: date, bar: 123 };
    const result = convertJsDates(toDB, item);
    expect(result.foo).toBe(date.toISOString());
    expect(result.bar).toBe(123);
  });

  test("converts ISO-8601 strings to Date objects (fromDB)", () => {
    const iso = "2023-01-01T12:00:00.000Z";
    const item: BaseItem = { foo: iso, bar: 123 };
    const result = convertJsDates(fromDB, item);
    expect(result.foo).toBeInstanceOf(Date);
    expect((result.foo as Date).toISOString()).toBe(iso);
    expect(result.bar).toBe(123);
  });

  test("handles nested objects and arrays", () => {
    const date = new Date("2022-05-05T05:05:05Z");
    const iso = date.toISOString();
    const item = {
      a: date,
      b: [date, { c: date }],
      d: { e: [date, iso] },
    } as const satisfies BaseItem;

    const toDbResult = convertJsDates(toDB, item) as unknown as typeof item;

    expect(toDbResult.a).toBe(iso);
    expect(toDbResult.b[0]).toBe(iso);
    expect(toDbResult.b[1].c).toBe(iso);
    expect(toDbResult.d.e[0]).toBe(iso);
    expect(toDbResult.d.e[1]).toBe(iso);

    const fromDbResult = convertJsDates(fromDB, toDbResult) as unknown as typeof item;

    expect(fromDbResult.a).toBeInstanceOf(Date);
    expect(fromDbResult.b[0]).toBeInstanceOf(Date);
    expect(fromDbResult.b[1].c).toBeInstanceOf(Date);
    expect(fromDbResult.d.e[0]).toBeInstanceOf(Date);
    expect(fromDbResult.d.e[1]).toBeInstanceOf(Date);
  });

  test("does not mutate the original object", () => {
    const date = new Date("2020-01-01T00:00:00Z");
    const item: BaseItem = { foo: date };
    const copy = { ...item };

    convertJsDates(toDB, item);

    expect(item).toStrictEqual(copy);
    expect(item.foo).toBe(date);
  });

  test("leaves non-date, non-string values unchanged", () => {
    const item: BaseItem = { num: 42, bool: true, nil: null, undef: undefined };
    const result = convertJsDates(toDB, item);
    expect(result).toStrictEqual(item);
  });

  test("converts valid datetime strings to ISO-8601 strings (toDB)", () => {
    const iso = "2023-01-01T12:00:00.000Z";
    const item: BaseItem = { foo: iso };
    const result = convertJsDates(toDB, item);
    expect(result.foo).toBe(iso);
  });

  test("ignores invalid date strings", () => {
    const item: BaseItem = { foo: "not-a-date" };

    const resultToDb = convertJsDates(toDB, item);
    const resultFromDb = convertJsDates(fromDB, item);

    expect(resultToDb.foo).toBe("not-a-date");
    expect(resultFromDb.foo).toBe("not-a-date");
  });
});
