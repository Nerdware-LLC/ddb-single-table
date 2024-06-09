import { validateItem } from "./validateItem.js";
import type { IOActions, IOActionContext } from "./types.js";

describe("IOAction: validateItem", () => {
  // Mock `this` context can be empty bc validateItem doesn't access any other IOActionMethods
  const mockThis = {} as IOActions;

  // Mock item
  const mockItem = {
    id: "USER-1",
    name: "Human McPerson",
    age: 32,
  };

  test(`returns the provided "item" without throwing when "validateItem" is not defined`, () => {
    expect(
      validateItem.call(mockThis, mockItem, {
        modelName: "MockModel",
        schemaOptions: {},
      } as IOActionContext)
    ).toStrictEqual(mockItem);
  });

  test(`returns the provided "item" without throwing when "validateItem" returns true`, () => {
    expect(
      validateItem.call(mockThis, mockItem, {
        modelName: "MockModel",
        schemaOptions: {
          validateItem: (_item: any) => true,
        },
      } as IOActionContext)
    ).toStrictEqual(mockItem);
  });

  test(`throws an ItemInputError when "validateItem" returns false`, () => {
    expect(() =>
      validateItem.call(mockThis, mockItem, {
        modelName: "MockModel",
        schemaOptions: {
          validateItem: (_item: any) => false,
        },
      } as IOActionContext)
    ).toThrowError("Invalid MockModel item.");
  });
});
