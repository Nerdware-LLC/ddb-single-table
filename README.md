<div align="center">

  <a href="https://github.com/Nerdware-LLC">
    <img src=".github/assets/ddb-single-table-banner.png" alt="ddb-single-table banner" />
  </a>

  <br />

A schema-based DynamoDB modeling tool, high-level API, and type-generator <br>
built to _**supercharge**_ single-table designs!⚡<br><br>
Marshalling ✅ Validation ✅ Where-style query API ✅ and more. <br>
<font size="2"><i>Fully-typed support for ESM and CommonJS</i></font>

[![npm package][npm-badge]](https://www.npmjs.com/package/@nerdware/ddb-single-table "npmjs.com: @nerdware/ddb-single-table")
&nbsp;
[![Test Workflow][gh-test-badge]](.github/workflows/test.yaml "View Test Workflow file")
&nbsp;
[![Codecov][codecov-badge]](https://codecov.io/gh/Nerdware-LLC/ddb-single-table "View coverage report")
&nbsp;
[![pre-commit][pre-commit-badge]](https://pre-commit.com/ "pre-commit.com")
&nbsp;
[![semantic-release][semantic-badge]](https://github.com/semantic-release/semantic-release#readme "github.com: semantic-release")
&nbsp;
[![License: MIT][license-badge]](https://opensource.org/licenses/MIT "opensource.org: The MIT License")

<!--   BADGE LINKS   -->

[npm-badge]: https://img.shields.io/npm/v/%40nerdware/ddb-single-table?logo=npm&label=npm%40latest
[gh-test-badge]: https://github.com/Nerdware-LLC/ddb-single-table/actions/workflows/test.yaml/badge.svg?branch=main
[codecov-badge]: https://codecov.io/gh/Nerdware-LLC/ddb-single-table/graph/badge.svg?token=RLCCIOLT01
[pre-commit-badge]: https://img.shields.io/badge/pre--commit-F8B424.svg?logo=pre-commit&logoColor=F8B424&labelColor=gray
[semantic-badge]: https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-6601ff.svg
[license-badge]: https://img.shields.io/badge/License-MIT-000080.svg

</div>

- [✨ Key Features](#-key-features)
- [🚀 Getting Started](#-getting-started)
- [🧙‍♂️ Data IO Order of Operations](#️-data-io-order-of-operations)
  - [`toDB`](#todb)
  - [`fromDB`](#fromdb)
- [📖 Schema API](#-schema-api)
  - [Schema Types](#schema-types)
    - [1. Table-Keys Schema](#1-table-keys-schema)
    - [2. Model Schema](#2-model-schema)
  - [Attribute Configs](#attribute-configs)
  - [Key Attribute Configs](#key-attribute-configs)
    - [`isHashKey`](#ishashkey)
    - [`isRangeKey`](#israngekey)
    - [`index`](#index)
  - [`alias`](#alias)
  - [`type`](#type)
    - [Nested Data Types](#nested-data-types)
    - [Enums](#enums)
  - [`schema`](#schema)
  - [`oneOf`](#oneof)
  - [`nullable`](#nullable)
  - [`required`](#required)
  - [`default`](#default)
  - [`validate`](#validate)
  - [`transformValue`](#transformvalue)
- [⚙️ Model Schema Options](#️-model-schema-options)
  - [`autoAddTimestamps`](#autoaddtimestamps)
  - [`allowUnknownAttributes`](#allowunknownattributes)
  - [`transformItem`](#transformitem)
  - [`validateItem`](#validateitem)
- [🧪 Testing / Mocking](#-testing--mocking)
  - [Local `DynamoDBClient` Mock](#local-dynamodbclient-mock)
  - [Global `DynamoDBClient` Mock via `setupFiles`](#global-dynamodbclient-mock-via-setupfiles)
- [📦 Batch Requests](#-batch-requests)
  - [Batch Retries with Exponential Backoff](#batch-retries-with-exponential-backoff)
- [❓ FAQ](#-faq)
- [🤝 Contributing](#-contributing)
- [📝 License](#-license)
- [💬 Contact](#-contact)

## ✨ Key Features

- Easy-to-use declarative API for managing DDB tables, connections, and models
- Auto-generated typings for model items
- Custom attribute aliases for each model
- Create attributes/properties from combinations of other attributes/properties
- Type checking and conversions for all DDB attribute types
- Validation checks for individual properties _and_ entire objects
- Where-style query API
- Default values
- Property-level get/set modifiers
- Schema-level get/set modifiers
- Required/nullable property assertions
- Easy access to a streamlined [DynamoDB client](#q-how-does-ddb-st-interact-with-the-underlying-dynamodb-client)
- Automatic [retries for batch operations](#-batch-requests) using exponential backoff
- Support for transactions — _group up to 100 operations into a single atomic transaction!_

## 🚀 Getting Started

1. Install the package:

   ```bash
   npm install @nerdware/ddb-single-table

   # If you don't already have the AWS SDK v3 installed, you will need to install it as well:
   npm install @aws-sdk/client-dynamodb
   ```

2. Create your table:

   ```ts
   import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
   import { Table } from "@nerdware/ddb-single-table";

   // OR, using require/CommonJS:
   //    const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
   //    const { Table } = require("@nerdware/ddb-single-table");

   export const myTable = new Table({
     tableName: "my-table-name",
     // The `tableKeysSchema` includes all table and index keys:
     tableKeysSchema: {
       pk: {
         type: "string", // keys can be "string", "number", or "Buffer"
         required: true,
         isHashKey: true,
       },
       sk: {
         type: "string",
         required: true,
         isRangeKey: true,
         index: {
           // This index allows queries using "sk" as the hash key
           name: "Overloaded_SK_GSI",
           rangeKey: "data",
           global: true,
           project: true, // project all attributes
           throughput: { read: 5, write: 5 },
         },
       },
       data: {
         type: "string",
         required: true,
         index: {
           // This index allows queries using "data" as the hash key
           name: "Overloaded_Data_GSI",
           rangeKey: "sk",
           global: true,
           project: true, // project all attributes
           throughput: { read: 5, write: 5 },
         },
       },
     },
     // You can provide your own DDB client instance:
     ddbClient: new DynamoDBClient({
       // This example shows how to connect to dynamodb-local:
       region: "local",
       endpoint: "http://localhost:8000",
       // All AWS SDK client auth methods are supported.
       // Since this example is using dynamodb-local, we simply use
       // hard-coded "local" credentials, but for production you would
       // obviously want to use a more secure method like an IAM role.
       credentials: {
         accessKeyId: "local",
         secretAccessKey: "local",
       },
     }),
   });
   ```

3. Create a model, and generate item-typings from its schema:

   ```ts
   import { myTable } from "./path/to/myTable.ts";
   import { isValid } from "./path/to/some/validators.ts";
   import type { ItemTypeFromSchema } from "@nerdware/ddb-single-table";

   const UserModel = myTable.createModel({
     pk: {
       type: "string",
       alias: "id", // <-- Each Model can have custom aliases for keys
       default: ({ createdAt }: { createdAt: Date }) => {
         return `USER#${createdAt.getTime()}`
       },
       validate: (id: string) => /^USER#\d{10,}$/.test(id),
       required: true,
     },
     sk: {
       type: "string",
       default: (userItem: { pk: string }) => {
         // Functional defaults are called with the entire UNALIASED item as the first arg.
         return `#DATA#${userItem.pk}` // <-- Not userItem.id
       },
       validate: (sk: string) => /^#DATA#USER#\d{10,}$/.test(sk)
       required: true,
     },
     data: {
       type: "string",
       alias: "email",
       validate: (value: string) => isValid.email(value),
       required: true,
     },
     profile: {
       type: "map", // Nested attributes ftw!
       schema: {
         displayName: { type: "string", required: true },
         businessName: { type: "string", nullable: true },
         photoUrl: { type: "string", nullable: true },
         favoriteFood: { type: "string", nullable: true },
         // You can nest attributes up to the DynamoDB max depth of 32
       },
     },
     checklist: {
       type: "array",
       required: false,
       schema: [
         {
           type: "map",
           schema: {
             id: {
               // Nested attributes have the same awesome schema capabilities!
               type: "string",
               default: (userItem: { sk: string }) => {
                 return `FOO_CHECKLIST_ID#${userItem.sk}#${Date.now()}`
               },
               validate: (id: string) => isValid.checklistID(id),
               required: true,
              },
              description: { type: "string", required: true },
              isCompleted: { type: "boolean", required: true, default: false },
            },
          },
        ],
      },
      /* By default, 'createdAt' and 'updatedAt' attributes are created for
      each Model (unless explicitly disabled). Here's an example with these
      attributes explicitly provided:                                    */
      createdAt: {
        type: "Date",
        required: true,
        default: () => new Date()
      },
      updatedAt: {
        type: "Date",
        required: true,
        default: () => new Date(),
        /* transformValue offers powerful hooks which allow you to modify values TO
        and/or FROM the db. Each attribute can define its own transformValue hooks.*/
        transformValue: {
          toDB: () => new Date(), /* <-- For data traveling TO the db (write ops).
          transformValue can also include a `fromDB` fn to transform values
             coming FROM the db. If specified, your `fromDB` transforms are
             applied for both write and read operations. */
        },
      },
   });

   // The `ItemTypeFromSchema` type is a helper type which converts
   // your schema into a Typescript type for your model's items.
   export type UserItem = ItemTypeFromSchema<typeof UserModel.schema>;
   ```

4. Use your model and generated types:

   ```ts
   import { UserModel, type UserItem } from "./path/to/UserModel.ts";

   // Create a new user:
   const newUser = await UserModel.createItem({
     email: "human_person@example.com",
     profile: {
       displayName: "Guy McHumanPerson",
       businessName: "Definitely Not a Penguin in a Human Costume, LLC",
       photoUrl: "s3://my-bucket-name/path/to/human/photo.jpg",
       favoriteFood: null,
     },
     checklist: [
       { description: "Find fish to eat" },
       { description: "Return human costume by 5pm" },
     ],
   });

   // You can use explicit type annotations, or allow TS to infer types.
   // For example, the line below yields the same as the above example:
   //   const newUser: UserItem = await UserModel.createItem(...);

   // The `newUser` is of type `UserItem`, with all keys aliased as specified:
   const { id, sk, email, profile, checklist, createdAt, updatedAt }: UserItem =
     {
       ...newUser,
     };

   // You can also use the model to query for items using `where` syntax:
   const usersWhoAreDefinitelyHuman = await UserModel.query({
     where: {
       email: {
         beginsWith: "human_", // <-- All DDB operators are supported!
       },
     },
   });

   // There are a lot more features I've yet to document, but hopefully
   // this is enough to get you started! Pull requests are welcome! 🐧
   ```

5. [**Profit**](https://knowyourmeme.com/memes/profit)! 💰🥳🎉 <!-- huzzah! 🐧 -->

## 🧙‍♂️ Data IO Order of Operations

When any Model method is invoked, it begins a request-response cycle in which DDB-ST applies a series of transformations and validations to ensure that the data conforms to the schema defined for the Model. DDB-ST collectively refers to these transformations and validations as _"**IO-Actions**"_, and they are categorized into two groups: `toDB` and `fromDB`. The `toDB` actions are applied to Model-method arguments before they're passed off to the underlying AWS SDK, while the `fromDB` actions are applied to all values returned from the AWS SDK before they're returned to the caller.

The `toDB` and `fromDB` flows both have a specific order in which **IO-Actions** are applied.

> [!IMPORTANT]
> Some Model-methods will skip certain **IO-Actions** depending on the method's purpose. For example, `Model.updateItem` skips the [**`"Required" Checks`**](#required) **IO-Action**, since the method is commonly used to write partial updates to items.

### `toDB`

| Order | IO-Action                                         | Description                                            | Skipped by Method(s) |
| :---: | :------------------------------------------------ | :----------------------------------------------------- | :------------------- |
|   1   | [**`Alias Mapping`**](#alias)                     | Replaces attribute _aliases_ with attribute names.     |                      |
|   2   | [**`Set Defaults`**](#default)                    | Applies defaults defined in the schema.                | `updateItem`         |
|   3   | [**`Attribute toDB Modifiers`**](#transformvalue) | Runs your `transformValue.toDB` functions.             |                      |
|   4   | [**`Item toDB Modifier`**](#transformitem)        | Runs your `transformItem.toDB` function.               | `updateItem`         |
|   5   | [**`Type Checking`**](#type)                      | Checks properties for conformance with their `"type"`. |                      |
|   6   | [**`Attribute Validation`**](#validate)           | Validates individual item properties.                  |                      |
|   7   | [**`Item Validation`**](#validateitem)            | Validates an item in its entirety.                     | `updateItem`         |
|   8   | [**`Convert JS Types`**](#type)                   | Converts JS types into DynamoDB types.                 |                      |
|   9   | [**`"Required" Checks`**](#required)              | Checks for `"required"` and `"nullable"` attributes.   | `updateItem`         |

### `fromDB`

| Order | IO-Action                                           | Description                                        |
| :---: | :-------------------------------------------------- | :------------------------------------------------- |
|   1   | [**`Convert JS Types`**](#type)                     | Converts DynamoDB types into JS types.             |
|   2   | [**`Attribute fromDB Modifiers`**](#transformvalue) | Runs your `transformValue.fromDB` functions.       |
|   3   | [**`Item fromDB Modifier`**](#transformitem)        | Runs your `transformItem.fromDB` function.         |
|   4   | [**`Alias Mapping`**](#alias)                       | Replaces attribute names with attribute _aliases_. |

## 📖 Schema API

DDB-ST provides a declarative schema API for defining your table and model schemas. The schema is defined as a plain object, with each attribute defined as a key in the object. Each attribute can include any number of configs, which are used to define the attribute's type, validation, default value, and other properties.

### Schema Types

There are two kinds of schema in DDB-ST:

<ul><!-- This ul is used to provide left-indentation without breaking auto-toc's header recognition. -->

#### 1. Table-Keys Schema<!-- Using `1. #### Table-Keys Schema` breaks auto-toc's header recognition. -->

- This schema defines the table's hash and range keys, as well as any keys which serve as primary/hash keys for secondary indexes.
- There is only 1 **Table-Keys Schema**, and the attributes defined within it are shared across all Models.
- If a Model will simply re-use all of the existing configs for an attribute defined in the **Table-Keys Schema**, then the attribute can be omitted from the Model's schema. In practice, however, it is encouraged to always include such attributes in the Model's schema, as this will make it easier to understand the Model and its schema.

#### 2. Model Schema

- Each Model has its own schema that may include any number of key and non-key attribute definitions.
- If a **Model Schema** includes key attributes, those attributes must also be defined in the **Table-Keys Schema**.
- Each **Model Schema** may specify its own custom configs for key attributes, including `alias`, `default`, `validate`, and `transformValue`. Attribute configs that affect a key attribute's type (`type`, `required`) must match the **Table-Keys Schema**.

</ul>

### Attribute Configs

The following schema configs are used to define attributes in your schema:

| Config Name                         | Description                                              | Can Use in<br>Table-Keys Schema? | Can Use in<br>Model Schema? |
| :---------------------------------- | :------------------------------------------------------- | :------------------------------: | :-------------------------: |
| [`isHashKey`](#ishashkey)           | Indicates whether the attribute is a table hash key.     |                ✅                |             ❌              |
| [`isRangeKey`](#israngekey)         | Indicates whether the attribute is a table range key.    |                ✅                |             ❌              |
| [`index`](#index)                   | Secondary-index configs defined on the index's hash key. |                ✅                |             ❌              |
| [`alias`](#alias)                   | An optional alias to apply to the attribute.             |                ✅                |             ✅              |
| [`type`](#type)                     | The attribute's type.                                    |                ✅                |             ✅              |
| [`schema`](#schema)                 | An optional schema for nested attributes.                |                ✅                |             ✅              |
| [`oneOf`](#oneof)                   | An optional array of allowed values for enum attributes. |                ✅                |             ✅              |
| [`nullable`](#nullable)             | Indicates whether the attribute value may be `null`.     |                ✅                |             ✅              |
| [`required`](#required)             | Indicates whether the attribute is required.             |                ✅                |             ✅              |
| [`default`](#default)               | An optional default value to apply.                      |                ✅                |             ✅              |
| [`validate`](#validate)             | An optional validation function to apply.                |                ✅                |             ✅              |
| [`transformValue`](#transformvalue) | An optional dictionary of data transformation hooks.     |                ✅                |             ✅              |

### Key Attribute Configs

#### `isHashKey`

A boolean value which indicates whether the attribute is a table hash key.

```ts
const TableKeysSchema = {
  pk: {
    type: "string",
    isHashKey: true,
    required: true, // Key attributes must always include `required: true`
  },
} as const satisfies TableKeysSchemaType;
```

#### `isRangeKey`

A boolean value which indicates whether the attribute is a table range key.

```ts
const TableKeysSchema = {
  sk: {
    type: "string",
    isHashKey: true,
    required: true, // Key attributes must always include `required: true`
  },
  // ... other attributes ...
} as const satisfies TableKeysSchemaType;
```

#### `index`

Secondary index configs, defined within the the attribute config of the index's hash-key.

> See type: [`SecondaryIndexConfig`](./src/Schema/types.ts#L150)

```ts
const TableKeysSchema = {
  fooIndexHashKey: {
    type: "string",
    required: true, // Key attributes must always include `required: true`
    index: {
      // The index config must specify a `name` — all other index configs are optional.
      name: "FooIndex",

      // `rangeKey` defines the attribute to use for the index's range key, if any.
      rangeKey: "barIndexRangeKey",

      /**
       * `global` is a boolean that indicates whether the index is global.
       *
       *   `true`     = global index (default)
       *   `false`    = local index
       */
      global: true,

      /**
       * `project` is used to configured the index's projection type.
       *
       *   `true`     = project ALL attributes
       *   `false`    = project ONLY the index keys (default)
       *   `string[]` = project ONLY the specified attributes
       */
      project: true,

      /**
       * `throughput` is used to configured provisioned throughput for the index.
       *
       * If your table's billing mode is PROVISIONED, this is optional.
       * If your table's billing mode is PAY_PER_REQUEST, do not include this.
       */
      throughput: {
        read: 5, //  RCU (Read Capacity Units)
        write: 5, // WCU (Write Capacity Units)
      },
    },
  },
  // ... other attributes ...
} as const satisfies TableKeysSchemaType;
```

### `alias`

An optional Model-specific alias to apply to a key attribute. An attribute's `alias` serves as its name outside of the database for the Model in which the `alias` is defined. For example, a key attribute named `"pk"` will always be `"pk"` in the database, but if a Model configures the field with an alias of `"id"`, then objects returned from the Model's methods will include the field `"id"` rather than `"pk"`. Similarly, the attribute alias can be used in arguments provided to Model methods.

During write operations, if the object provided to the Model method contains a key matching a schema-defined `alias` value, the key is replaced with the attribute's name. For both read and write operations, when data is returned from the database, this key-switch occurs in reverse — any object keys which match an attribute with a defined `alias` will be replaced with their respective `alias`.

> [!IMPORTANT]
> All of a Model's `alias` values must be unique, or the Model's constructor will throw an error.

### `type`

The attribute's type. The following `type` values are supported:

| Attribute Type | DynamoDB Representation                      | Can use for<br>KEY attributes? | Can use for<br>NON-KEY attributes? |
| :------------- | :------------------------------------------- | :----------------------------: | :--------------------------------: |
| `"string"`     | "S" (String)                                 |               ✅               |                 ✅                 |
| `"number"`     | "N" (Number)                                 |               ✅               |                 ✅                 |
| `"Buffer"`     | "B" (Binary)                                 |               ✅               |                 ✅                 |
| `"boolean"`    | "BOOL" (Boolean)                             |               ❌               |                 ✅                 |
| `"Date"`       | Converted to [ISO-8601 String][mdn-iso-8601] |               ❌               |                 ✅                 |
| `"map"`        | "M" (Map)                                    |               ❌               |                 ✅                 |
| `"array"`      | "L" (List)                                   |               ❌               |                 ✅                 |
| `"tuple"`      | "L" (List)                                   |               ❌               |                 ✅                 |
| `"enum"`       | "S" (String)                                 |               ❌               |                 ✅                 |

[mdn-iso-8601]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString

#### Nested Data Types

The `"map"`, `"array"`, and `"tuple"` types facilitate nested data structures up to the DynamoDB max depth of 32.

Nested data structures are defined using the [`schema`](#schema) attribute config.

#### Enums

The `enum` type is used to limit the possible values of a string attribute to a specific set of values using the [`oneOf`](#oneof) attribute config.

### `schema`

The `schema` attribute config is used with `"map"`, `"array"`, and `"tuple"` attributes to define nested data structures. The way `schema` is used depends on the attribute's `type`:

```ts
const UserModelSchema = {
  // A map attribute with a nested schema:
  myMap: {
    type: "map",
    schema: {
      fooKey: { type: "string", required: true },
      anotherField: { type: "string" },
    },
  },

  // An array attribute that simply holds strings:
  myArray: {
    type: "array",
    schema: [{ type: "string" }],
  },

  // An array attribute with a nested map schema:
  myChecklist: {
    type: "array",
    schema: [
      {
        type: "map",
        schema: {
          id: { type: "string", required: true },
          description: { type: "string", required: true },
          isCompleted: { type: "boolean", required: true, default: false },
        },
      },
    ],
  },

  // A tuple attribute with a nested schema:
  coordinates: {
    type: "tuple",
    schema: [
      { type: "number", required: true }, // latitude
      { type: "number", required: true }, // longitude
    ],
  },
} as const satisfies ModelSchemaType;
```

### `oneOf`

The `oneOf` attribute config is used with `"enum"` attributes to specify allowed values. It is provided as an array of strings which represent the allowed values for the attribute.

For example, the following schema defines an attribute `status` which can only be one of the three values: `"active"`, `"inactive"`, or `"pending"`:

```ts
const UserModelSchema = {
  status: {
    type: "enum",
    oneOf: ["active", "inactive", "pending"],
  },
} as const satisfies ModelSchemaType;
```

### `nullable`

Optional boolean flag indicating whether a value may be `null`. Unless this is explicitly `true`, an error will be thrown if the attribute value is `null`.

> [!NOTE]
>
> **Default:** `false`

### `required`

Optional boolean flag indicating whether a value is required for create-operations. If `true`, an error will be thrown if the attribute value is missing or `undefined`. Note that this check is performed after all other schema-defined transformations and validations have been applied.

> [!NOTE]
>
> **Default:** `false` for non-key attributes (keys are always required)

### `default`

Optional default value to apply. This can be configured as either a straight-forward primitive value, or a function which returns a default value. If one key is derived from another, this default is also applied to `Where`-query args and other related APIs.

> With the exception of `updateItem` calls, an attribute's value is set to this `default` if the initial value provided to the Model method is `undefined` or `null`.

- ##### When using a primitive-value `default`

  - The primitive's type must match the attribute's `type`, otherwise the Model's
    constructor will throw an error.

- ##### When using a function `default`

  - The function is called with the entire item-object provided to the Model method _**with
    UNALIASED keys**_, and the attribute value is set to the function's returned value.
  - _This package does not validate functional `default`s._

Bear in mind that key and index attributes are always processed _before_ all other attributes, thereby making them available to use in `default` functions for other attributes. For example, in the below `LibraryModelSchema`, each `authorID` is generated using the `unaliasedPK` plus a UUID:

```ts
const LibraryModelSchema = {
  unaliasedPK: {
    isHashKey: true,
    type: "string",
    default: () => makeLibraryID(),
    alias: "libraryID" /* <-- NOTE: This alias will NOT be available
                            in the below authorID `default` function. */,
  },
  authors: {
    type: "array",
    schema: [
      {
        type: "map",
        schema: {
          authorID: {
            type: "string",
            default: (entireLibraryItem) => {
              // unaliasedPK is available here because it is a key attribute!
              return entireLibraryItem.unaliasedPK + getUUID();
            },
          },
        },
      },
    ],
  },
};
```

### `validate`

The `validate` attribute config is used to specify a custom validation function for an attribute. The function is called with the attribute's value as its first argument, and it should return `true` if the value is valid, or `false` if it is not.

### `transformValue`

The `transformValue` attribute config is an optional dictionary of [`toDB`](#todb) and/or [`fromDB`](#fromdb) transformation functions which are called with the attribute's value. `transformValue` configs can include both `toDB` and `fromDB` functions, or just one of them.

`transformValue` functions must return either a value of the attribute's configured `"type"`, or `null` if the attribute is not `required` (`null` values for `required` attributes will cause a validation error to be thrown). If the attribute is required, the function must return a value of the attribute's configured `"type"`. Returning `undefined` either explicitly or implicitly will always be ignored, i.e., the value will remain as it was before the `transformValue` function was called.

## ⚙️ Model Schema Options

The following options are available when creating a Model:

### `autoAddTimestamps`

> [!NOTE]
>
> **Default:** `false`

This boolean indicates whether the Model should automatically add `createdAt` and `updatedAt` attributes to the Model schema. When enabled, timestamp fields are added _before_ any `default` functions defined in your schema are called, so your `default` functions can access the timestamp values for use cases like UUID generation.

### `allowUnknownAttributes`

> [!NOTE]
>
> **Default:** `false`

Whether the Model allows items to include properties which aren't defined in its schema on create/upsert operations. This may also be set to an array of strings to only allow certain attributes — this can be useful if the Model includes a `transformItem` function which adds properties to the item.

### `transformItem`

Like its [`transformValue`](#transformvalue) counterpart, the `transformItem` config is an optional dictionary of [`toDB`](#todb) and/or [`fromDB`](#fromdb) transformation functions which are called with an entire item-object, rather than an individual attribute. `transformItem` configs can include both `toDB` and `fromDB` functions, or just one of them. `transformItem` functions must return a "complete" item that effectively replaces the original.

### `validateItem`

Like its [`validate`](#validate) counterpart, the `validateItem` config is used for validation, but it is called with an entire item-object rather than an individual attribute. The `validateItem` function should return `true` if the item is valid, or `false` if it is not.

## 🧪 Testing / Mocking

For tests involving your Models, the recommended approach is to mock the underlying DynamoDB client from the SDK using a library like [aws-sdk-client-mock](https://www.npmjs.com/package/aws-sdk-client-mock).

> [!NOTE]
> Installation of `aws-sdk-client-mock` is **not** required for DDB-ST to work, but it is recommended for testing purposes. To install the package, run the following command:
>
> ```bash
> npm install -D aws-sdk-client-mock
> ```

There are two approaches to mocking the DynamoDB client — these can be used in combination, or independently of each other:

1. [**Local `DynamoDBClient` Mock**](#local-dynamodbclient-mock) — This approach mocks the client at the _test_ level, which allows for far greater control over the behavior of the mock-client for a given test.
2. [**Global `DynamoDBClient` Mock via `setupFiles`**](#global-dynamodbclient-mock-via-setupfiles) — This approach mocks the client at the _package_ level, so every file that imports the `DynamoDBClient` from `@aws-sdk/client-dynamodb` will import the _mocked_ implementation without any additional setup.

### Local `DynamoDBClient` Mock

To achieve fine-grained control over the behavior of the mock-client, mock the `DynamoDBClient` in individual test files. This allows you to customize the mock behavior for each test, and is particularly useful for unit tests.

Here's an example using [Vitest](https://vitest.dev/):

```ts
import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { mockClient } from "aws-sdk-client-mock";

// An "actual" DynamoDB client instance is created here with params for dynamodb-local:
const actualDdbClient = new DynamoDBClient({
  region: "local",
  endpoint: "http://localhost:8000",
  credentials: { accessKeyId: "local", secretAccessKey: "local" },
});

const mockDdbClient = mockClient(actualDdbClient);

const mockTable = new Table({
  ddbClient: actualDdbClient, // <-- Provide Table the "actual" client instance
  tableName: "MockTable",
  tableKeysSchema: {
    pk: { type: "string", required: true, isHashKey: true },
    sk: { type: "string", required: true, isRangeKey: true },
  },
});

// The model used in this test:
const MyModel = mockTable.createModel("MyModel", {
  pk: { alias: "id", type: "string", required: true },
  sk: { alias: "foo", type: "string", required: true },
});

describe("Tests that involve MyModel", () => {
  // Arrange mockDdbClient to return an empty object by default:
  beforeEach(() => {
    mockDdbClient.reset();
    mockDdbClient.onAnyCommand().resolves({}); // Default response for all commands
  });

  test("returns a single item", async () => {
    // Arrange
    const expectedItem = { id: "123", foo: "bar" };

    // Here, you have all the flexibility of the `aws-sdk-client-mock` library:
    mockDdbClient.on(GetItemCommand).resolvesOnce({
      Item: {
        pk: { S: expectedItem.id },
        sk: { S: expectedItem.foo },
      },
      /* For more complex objects, Model methods are your friend!

      The above marshalled `Item` object could be created from `expectedItem` like so:
        {
          Item: MyModel.ddb.marshall(
            MyModel.processItemAttributes.toDB(expectedItem, { aliasMapping: true })
          ),
        }
      */
    });

    // Act
    const result = await MyModel.getItem({ id: expectedItem.id });

    // Assert
    expect(result).toEqual(expectedItem);
  });
});
```

### Global `DynamoDBClient` Mock via `setupFiles`

To ensure that the DynamoDB client is mocked for every test across multiple test suites, you can configure your testing framework to use a global setup-file that mocks the `@aws-sdk/client-dynamodb` package. This approach can be particularly useful in large/monorepo projects with multiple test suites and/or configurations, as it allows you to apply some baseline behavior without duplicating the mock setup in each test file.

Here's an example using [Vitest](https://vitest.dev/):

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // The file `vitest.setup.ts` will be run before each test file.
    setupFiles: ["./vitest.setup.ts"],
    // The following configs are recommended, but not required:
    environment: "node",
    globals: true,
    restoreMocks: true,
    // ... other configs ...
  },
});
```

Then in the `vitest.setup.ts` file, mock the package's exports like so:

```ts
// vitest.setup.ts
import { mockClient } from "aws-sdk-client-mock";

vi.mock("@aws-sdk/client-dynamodb", async (importOriginal) => {
  const {
    DynamoDBClient: ActualDynamoDBClient, // The mocked client class
    ...otherExports
  } = await importOriginal<typeof import("@aws-sdk/client-dynamodb")>();

  const DynamoDBClient = vi.fn(() => mockClient(ActualDynamoDBClient));

  return {
    DynamoDBClient,
    ...otherExports,
  };
});
```

## 📦 Batch Requests

DDB-ST models provide a high-level API for batching CRUD operations that handles the heavy lifting for you, while also providing the flexibility to customize the behavior of each operation:

- `batchGetItems` — Retrieves multiple items from the database in a single request.
- `batchUpsertItems` — Creates or updates multiple items in the database in a single request.
- `batchDeleteItems` — Deletes multiple items from the database in a single request.
- `batchUpsertAndDeleteItems` — Creates, updates, or deletes multiple items in the database in a single request.

### Batch Retries with Exponential Backoff

[As recommended by AWS](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Programming.Errors.html#Programming.Errors.BatchOperations), DDB-ST will automatically retry batch operations which either return unprocessed requests (e.g., `UnprocessedKeys` for `BatchGetItem`), or result in a retryable error. In adherence to AWS best practices, all retries are implemented using a configurable exponential backoff strategy (described below).

#### Exponential Backoff Strategy<!-- omit in toc -->

1. First request: no delay
2. Second request: delay `initialDelay` milliseconds (_default:_ 100)
3. All subsequent request delays are equal to the previous delay multiplied by the `timeMultiplier` (_default:_ 2), until either:

   - The `maxRetries` limit is reached (_default:_ 10), or
   - The `maxDelay` limit is reached (_default:_ 3500, or 3.5 seconds)

   Ergo, the base `delay` calculation can be summarized as follows:

   > `delay in milliseconds = initialDelay * timeMultiplier^attemptNumber`

   If `useJitter` is true (_default:_ false), the `delay` is randomized by applying the following to the base `delay`:

   > `Math.round( Math.random() * delay )`

   Note that the determination as to whether the delay exceeds the `maxDelay` is made BEFORE the jitter is applied.

## ❓ FAQ

### Q: _Why "single-table-first"?_<!-- omit in toc -->

**A:** Single-table design patterns can yield both greater IO and cost performance, while also reducing the amount of infrastructure that needs to be provisioned and maintained. For a technical breakdown as to why this is the case, check out [this fantastic presentation](https://www.youtube.com/watch?v=xfxBhvGpoa0) from one of the designers of DynamoDB speaking at AWS re:Invent.

### Q: _How does DDB-ST interact with the underlying DynamoDB client?_<!-- omit in toc -->

**A:** DDB-ST provides a wrapper around the DynamoDB client:

- To simplify client usage, the wrapper handles all marshalling and unmarshalling of data to/from DynamoDB types.
- To ensure client resources like socket connections are cleaned up, a listener is attached to the process "exit" event which calls the client's `destroy()` method.

### Q: _What version of the AWS SDK does DDB-ST use?_<!-- omit in toc -->

**A:** Version 3. For the specific minor/patch release, please refer to the [package.json](./package.json).

## 🤝 Contributing

Pull requests are welcome! Before you begin, please check existing [GitHub Issues](https://github.com/Nerdware-LLC/ddb-single-table/issues) and [Pull Requests](https://github.com/Nerdware-LLC/ddb-single-table/pulls) to see if your idea is already in the pipeline. If not, [here's a guide on how to contribute to this project](./CONTRIBUTING.md). Thank you!

## 📝 License

**ddb-single-table** is open-source software licensed under an [MIT License](/LICENSE).

<div align="center" style="margin-top:35px;">

## 💬 Contact

Trevor Anderson — [Trevor@Nerdware.cloud](mailto:trevor@nerdware.cloud) — [@trevor-anderson](https://github.com/trevor-anderson)

[<img src="https://github.com/trevor-anderson/trevor-anderson/blob/main/assets/github_logo_white.svg" height="40" alt="Check out Nerdware on GitHub" />](https://github.com/Nerdware-LLC)
&emsp;
[<img src="https://github.com/trevor-anderson/trevor-anderson/blob/main/assets/YouTube_icon_circle.svg" height="40" alt="Check out Nerdware on YouTube" />](https://www.youtube.com/@nerdware-io)
&emsp;
[<img src="https://github.com/trevor-anderson/trevor-anderson/blob/main/assets/LinkedIn_icon_circle.svg" height="40" alt="Trevor Anderson's LinkedIn" />](https://www.linkedin.com/in/meet-trevor-anderson/)
&emsp;
[<img src="https://github.com/trevor-anderson/trevor-anderson/blob/main/assets/email_icon_circle.svg" height="40" alt="Email Trevor Anderson" />](mailto:trevor@nerdware.cloud)

[**_Dare Mighty Things._**](https://www.youtube.com/watch?v=GO5FwsblpT8)

</div>
