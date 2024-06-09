import { transformItem } from "./transformItem.js";
import type { IOActions, IOActionContext, IODirection } from "./types.js";

describe("IOAction: transformItem", () => {
  // Mock `this` context can be empty bc transformItem doesn't access any other IOActionMethods
  const mockThis = {} as IOActions;

  // Mock item
  const mockItem = {
    id: "USER-1",
    name: "Human McPerson",
    age: 32,
  };

  // Mock ctx with transformItem
  const mockCtx = {
    schemaOptions: {
      transformItem: {
        toDB: (item: any) => {
          return { ...item, NEW_TO_DB_KEY: "NEW_TO_DB_VALUE" } as Record<string, any>;
        },
        fromDB: (item: any) => {
          return { ...item, NEW_FROM_DB_KEY: "NEW_FROM_DB_VALUE" } as Record<string, any>;
        },
      },
    },
  } as const satisfies Partial<IOActionContext>;

  test(`returns the "item" as configured when "transformItem.toDB" is a function`, () => {
    expect(
      transformItem.call(mockThis, mockItem, {
        ...mockCtx,
        ioDirection: "toDB",
      } as any)
    ).toStrictEqual({ ...mockItem, NEW_TO_DB_KEY: "NEW_TO_DB_VALUE" });
  });

  test(`returns the "item" as configured when "transformItem.fromDB" is a function`, () => {
    expect(
      transformItem.call(mockThis, mockItem, {
        ...mockCtx,
        ioDirection: "fromDB",
      } as any)
    ).toStrictEqual({ ...mockItem, NEW_FROM_DB_KEY: "NEW_FROM_DB_VALUE" });
  });

  test(`returns the "item" unaltered when "transformItem" is not provided`, () => {
    (["toDB", "fromDB"] satisfies Array<IODirection>).forEach((ioDirection) => {
      expect(
        transformItem.call(mockThis, mockItem, {
          ...mockCtx,
          schemaOptions: {},
          ioDirection,
        } as any)
      ).toStrictEqual(mockItem);
    });
  });
});
