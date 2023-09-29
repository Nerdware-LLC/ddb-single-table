import lodashSet from "lodash.set";
import { aliasMapping } from "./aliasMapping";
import type { IOActions, IOActionContext } from "./types";

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
  const mockToDbCtx: IOActionContext = {
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
  };

  it(`should map aliases to attributes when "ioDirection" is "toDB"`, () => {
    const result = aliasMapping.call(mockThis, mockToDbItem, mockToDbCtx);
    expect(result).toStrictEqual(mockFromDbItem);
  });

  it(`should map attributes to aliases when "ioDirection" is "fromDB"`, () => {
    const result = aliasMapping.call(mockThis, mockFromDbItem, {
      ...mockToDbCtx,
      ioDirection: "fromDB",
      aliasesMap: {
        pk: "id",
        sk: "name",
      },
    });
    expect(result).toStrictEqual(mockToDbItem);
  });

  it(`should map aliases to attributes and include uknown attributes when "allowUnknownAttributes" is true`, () => {
    const result = aliasMapping.call(
      mockThis,
      { ...mockToDbItem, UNKNOWN_ATTR: "mock_value_of_unknown_attr" },
      lodashSet(mockToDbCtx, "schemaOptions.allowUnknownAttributes", true)
    );
    expect(result).toStrictEqual({
      ...mockFromDbItem,
      UNKNOWN_ATTR: "mock_value_of_unknown_attr",
    });
  });

  it(`should map aliases to attributes and include an uknown attribute that's explicitly listed in "allowUnknownAttributes"`, () => {
    const result = aliasMapping.call(
      mockThis,
      { ...mockToDbItem, UNKNOWN_ATTR: "mock_value_of_unknown_attr" },
      lodashSet(mockToDbCtx, "schemaOptions.allowUnknownAttributes", ["UNKNOWN_ATTR"])
    );
    expect(result).toStrictEqual({
      ...mockFromDbItem,
      UNKNOWN_ATTR: "mock_value_of_unknown_attr",
    });
  });

  it(`should throw an error if an unknown attribute is found and "allowUnknownAttributes" is false`, () => {
    expect(() =>
      aliasMapping.call(
        mockThis,
        { ...mockToDbItem, UNKNOWN_ATTR: "mock_value_of_unknown_attr" },
        lodashSet(mockToDbCtx, "schemaOptions.allowUnknownAttributes", false)
      )
    ).toThrowError(`MockModel item contains unknown property: "UNKNOWN_ATTR"`);
  });

  it(`should throw an error if an unknown attribute is found and "allowUnknownAttributes" does not include the key`, () => {
    expect(() =>
      aliasMapping.call(
        mockThis,
        { ...mockToDbItem, UNKNOWN_ATTR: "mock_value_of_unknown_attr" },
        // Here, allowUnknownAttributes is provided, but the key "UNKNOWN_ATTR" is not included
        lodashSet(mockToDbCtx, "schemaOptions.allowUnknownAttributes", ["SOME_OTHER_ATTR"])
      )
    ).toThrowError(`MockModel item contains unknown property: "UNKNOWN_ATTR"`);
  });
});
