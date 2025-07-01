import { aliasMapping } from "./aliasMapping.js";
import type { IOActions, IOActionContext } from "./types/index.js";

describe("IOAction: aliasMapping", () => {
  // Mock `this` context can be empty bc aliasMapping doesn't use any other IOActions
  const mockThis = {} as IOActions;

  // Mock items for testing `toDB and `fromDB` (no need to include any nested attributes here)
  const mockToDbItem = {
    id: "USER-1",
    name: "Human McPerson",
    age: 32,
    email: "foo@example.com",
  };
  const mockFromDbItem = {
    pk: mockToDbItem.id,
    sk: mockToDbItem.name,
    age: mockToDbItem.age,
    email: mockToDbItem.email,
  };

  // The mock IOActionsContext includes a mock schema with aliased attributes
  const mockToDbCtx = {
    modelName: "MockModel",
    schema: {
      pk: { alias: "id", type: "string", required: true },
      sk: { alias: "name", type: "string", required: true },
      age: { type: "number" },
      email: { type: "string" },
    },
    schemaEntries: [] as any, // empty, bc aliasMapping doesn't use schemaEntries
    schemaOptions: {
      allowUnknownAttributes: false,
    },
    ioDirection: "toDB",
    aliasesMap: {
      id: "pk",
      name: "sk",
    },
  } as const satisfies IOActionContext;

  test(`maps aliases to attributes when "ioDirection" is "toDB"`, () => {
    expect(aliasMapping.call(mockThis, mockToDbItem, mockToDbCtx)).toStrictEqual(mockFromDbItem);
  });

  test(`maps attributes to aliases when "ioDirection" is "fromDB"`, () => {
    expect(
      aliasMapping.call(mockThis, mockFromDbItem, {
        ...mockToDbCtx,
        ioDirection: "fromDB",
        aliasesMap: {
          pk: "id",
          sk: "name",
        },
      })
    ).toStrictEqual(mockToDbItem);
  });

  test(`maps aliases to attributes and include uknown attributes when "allowUnknownAttributes" is true`, () => {
    expect(
      aliasMapping.call(
        mockThis,
        { ...mockToDbItem, UNKNOWN_ATTR: "mock_value_of_unknown_attr" },
        {
          ...mockToDbCtx,
          schemaOptions: {
            ...mockToDbCtx.schemaOptions,
            allowUnknownAttributes: true,
          },
        }
      )
    ).toStrictEqual({
      ...mockFromDbItem,
      UNKNOWN_ATTR: "mock_value_of_unknown_attr",
    });
  });

  test(`maps aliases to attributes and include an uknown attribute that's explicitly listed in "allowUnknownAttributes"`, () => {
    expect(
      aliasMapping.call(
        mockThis,
        { ...mockToDbItem, UNKNOWN_ATTR: "mock_value_of_unknown_attr" },
        {
          ...mockToDbCtx,
          schemaOptions: {
            ...mockToDbCtx.schemaOptions,
            allowUnknownAttributes: ["UNKNOWN_ATTR"],
          },
        }
      )
    ).toStrictEqual({
      ...mockFromDbItem,
      UNKNOWN_ATTR: "mock_value_of_unknown_attr",
    });
  });

  test(`throws an error if an unknown attribute is found and "allowUnknownAttributes" is false`, () => {
    expect(() =>
      aliasMapping.call(
        mockThis,
        { ...mockToDbItem, UNKNOWN_ATTR: "mock_value_of_unknown_attr" },
        {
          ...mockToDbCtx,
          schemaOptions: {
            ...mockToDbCtx.schemaOptions,
            allowUnknownAttributes: false,
          },
        }
      )
    ).toThrowError(`MockModel item contains unknown property: "UNKNOWN_ATTR"`);
  });

  test(`throws an error if an unknown attribute is found and "allowUnknownAttributes" does not include the key`, () => {
    expect(() =>
      aliasMapping.call(
        mockThis,
        { ...mockToDbItem, UNKNOWN_ATTR: "mock_value_of_unknown_attr" },
        // Here, allowUnknownAttributes is provided, but the key "UNKNOWN_ATTR" is not included
        {
          ...mockToDbCtx,
          schemaOptions: {
            ...mockToDbCtx.schemaOptions,
            allowUnknownAttributes: ["SOME_OTHER_ATTR"],
          },
        }
      )
    ).toThrowError(`MockModel item contains unknown property: "UNKNOWN_ATTR"`);
  });
});
