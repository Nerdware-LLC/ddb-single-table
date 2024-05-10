<div align="center">

  <a href="https://github.com/Nerdware-LLC">
    <img src=".github/assets/ddb-single-table-banner.png" alt="ddb-single-table banner" />
  </a>

  <br />

A schema-based DynamoDB modeling tool, high-level API, and type-generator <br>
built to _**supercharge**_ single-table designs!⚡<br><br>
Marshalling ✅ Validation ✅ Where-style query API ✅ and [more](#-key-features). <br>
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

- [🚀 Getting Started](#-getting-started)
- [✨ Key Features](#-key-features)
  - [Batch Retries with Exponential Backoff](#batch-retries-with-exponential-backoff)
- [❓ FAQ](#-faq)
  - [Q: _Why "single-table-first"?_](#q-why-single-table-first)
  - [Q: _How does DDB-ST interact with the underlying DynamoDB client?_](#q-how-does-ddb-st-interact-with-the-underlying-dynamodb-client)
  - [Q: _What version of the AWS SDK does DDB-ST use?_](#q-what-version-of-the-aws-sdk-does-ddb-st-use)
- [🤝 Contributing](#-contributing)
- [📝 License](#-license)
- [💬 Contact](#-contact)

---

## 🚀 Getting Started

1. Install the package:

   ```bash
   npm install @nerdware/ddb-single-table
   ```

2. Create your table:

   ```ts
   import { Table } from "@nerdware/ddb-single-table";

   // OR const { Table } = require("@nerdware/ddb-single-table");

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
     } as const, // For TypeScript, all schema must end with `as const`
     // You can provide your own DDB client instance or configs for a new one:
     ddbClient: {
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
     },
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
          return `#DATA#${userItem.pk}`
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
        businessName: { type: "string" },
        photoUrl: { type: "string" },
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
   } as const); // <-- Don't forget to add `as const`!

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
   const { id, sk, email, profile, checklist, createdAt, updatedAt }: UserItem = {
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

## ✨ Key Features

- Easy-to-use declarative API for managing DDB tables, connections, and models
- Auto-generated typings for model items
- Custom attribute aliases for each model
- Create attributes/properties from combinations of other attributes/properties
- Type checking and conversions for all DDB attribute types
- Validation checks for individual properties
- Validation checks for entire objects
- Where-style query API
- Default values
- Property-level get/set modifiers
- Schema-level get/set modifiers
- Required/nullable property assertions
- Easy access to a streamlined DynamoDB client (more info [here](#q-how-does-ddb-st-interact-with-the-underlying-dynamodb-client))
- Automatic retries for batch operations using exponential backoff (more info [here](#batch-retries-with-exponential-backoff))
- Support for transactions - _group up to 100 operations into a single atomic transaction!_

### Batch Retries with Exponential Backoff

[As recommended by AWS](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Programming.Errors.html#Programming.Errors.BatchOperations), DDB-ST will automatically retry batch operations which either return unprocessed requests (e.g., `UnprocessedKeys` for `BatchGetItem`), or result in a retryable error. All retries are implemented using a configurable exponential backoff strategy which adheres to AWS best practices.

<details>

  <summary><i><b>Click here for a detailed overview of the exponential backoff strategy.</b></i></summary>

1. First request: no delay
2. Second request: delay `initialDelay` milliseconds (default: 100)
3. All subsequent request delays are equal to the previous delay multiplied by the `timeMultiplier` (default: 2), until either:

   - The `maxRetries` limit is reached (default: 10), or
   - The `maxDelay` limit is reached (default: 3500, or 3.5 seconds)

   Ergo, the base `delay` calculation can be summarized as follows:

   > `delay in milliseconds = initialDelay * timeMultiplier^attemptNumber`

   If `useJitter` is true (default: false), the `delay` is randomized by applying the following to the base `delay`:

   > `Math.round( Math.random() * delay )`

   Note that the determination as to whether the delay exceeds the `maxDelay` is made BEFORE the jitter is applied.

</details>

<!-- TODO Add more how-to/usage documentation -->

## ❓ FAQ

### Q: _Why "single-table-first"?_

**A:** Single-table design patterns can yield both greater IO and cost performance, while also reducing the amount of infrastructure that needs to be provisioned and maintained. For a technical breakdown as to why this is the case, check out [this fantastic presentation](https://www.youtube.com/watch?v=xfxBhvGpoa0) from one of the designers of DynamoDB speaking at AWS re:Invent.

### Q: _How does DDB-ST interact with the underlying DynamoDB client?_

**A:** DDB-ST provides a single streamlined abstraction over both the document and vanilla DynamoDB clients:

- CRUD actions use the document client to provide built-in marshalling/unmarshalling of DDB-attribute objects.
- Utility actions like DescribeTable which aren't included in the document client use the vanilla client.
- To ensure client resources like socket connections are cleaned up, a listener is attached to the process "exit" event which calls the vanilla client's `destroy()` method. Note that although the document client does expose the same method, calling it on the doc-client results in a no-op.

### Q: _What version of the AWS SDK does DDB-ST use?_

**A:** Version 3. For the specific minor/patch release, please refer to the [package.json](./package.json).

## 🤝 Contributing

Pull requests are welcome! Before you begin, please check existing [GitHub Issues](https://github.com/Nerdware-LLC/ddb-single-table/issues) and [Pull Requests](https://github.com/Nerdware-LLC/ddb-single-table/pulls) to see if your idea is already in the pipeline. If not, [here's a guide on how to contribute to this project](./CONTRIBUTING.md). Thank you!

## 📝 License

**ddb-single-table** is open-source software licensed under an [MIT License](/LICENSE).

<div align="center" style="margin-top:35px;">

## 💬 Contact

Trevor Anderson — [Trevor@Nerdware.cloud](mailto:trevor@nerdware.cloud) — [@TeeRevTweets](https://twitter.com/teerevtweets)

[<img src="https://github.com/trevor-anderson/trevor-anderson/blob/main/assets/YouTube_icon_circle.svg" height="40" alt="Check out Nerdware on YouTube" />](https://www.youtube.com/@nerdware-io)
&emsp;
[<img src="https://github.com/trevor-anderson/trevor-anderson/blob/main/assets/LinkedIn_icon_circle.svg" height="40" alt="Trevor Anderson's LinkedIn" />](https://www.linkedin.com/in/meet-trevor-anderson/)
&emsp;
[<img src="https://github.com/trevor-anderson/trevor-anderson/blob/main/assets/Twitter_icon_circle.svg" height="40" alt="Trevor Anderson's Twitter" />](https://twitter.com/TeeRevTweets)
&emsp;
[<img src="https://github.com/trevor-anderson/trevor-anderson/blob/main/assets/email_icon_circle.svg" height="40" alt="Email Trevor Anderson" />](mailto:trevor@nerdware.cloud)

[**_Dare Mighty Things._**](https://www.youtube.com/watch?v=GO5FwsblpT8)

</div>
