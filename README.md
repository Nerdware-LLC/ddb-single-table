<div align="center">

  <a href="https://github.com/Nerdware-LLC">
    <img src=".github/assets/ddb-single-table-banner.png" alt="ddb-single-table-banner" />
  </a>

  <br />

A schema-based DynamoDB modeling tool, type-generator, and client wrapper built to _**supercharge**_ single-table designs!⚡<br>
Both ESM and CommonJS builds are provided, and the package is fully typed.

[![pre-commit][pre-commit-shield]](https://github.com/pre-commit/pre-commit)
[![semantic-release][semantic-shield]](https://github.com/semantic-release/semantic-release)
[![License: MIT][license-shield]](https://opensource.org/licenses/MIT)

</div>

- [🚀 Getting Started](#-getting-started)
- [✨ Key Features](#-key-features)
- [⚙️ Usage Notes](#️-usage-notes)
- [❓ FAQ](#-faq)
  - [Q: _Why "single-table-first"?_](#q-why-single-table-first)
  - [Q: _How does DDB-ST interact with the underlying DynamoDB client?_](#q-how-does-ddb-st-interact-with-the-underlying-dynamodb-client)
  - [Q: _What version of the AWS SDK does DDB-ST use?_](#q-what-version-of-the-aws-sdk-does-ddb-st-use)
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
   import { DdbSingleTable } from "@nerdware/ddb-single-table";

   // OR const { DdbSingleTable } = require("@nerdware/ddb-single-table");

   export const myTable = new DdbSingleTable({
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
     ddbClientConfigs: {
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
     // We can auto-create the table if it doesn't exist:
     tableConfigs: {
       createIfNotExists: true,
       billingMode: "PROVISIONED",
       provisionedThroughput: { read: 20, write: 20 },
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
- Map DDB attribute names to model item properties and vice versa
- Create attributes/properties from combinations of other attributes/properties
- Type checking
- Validation checks for individual properties
- Validation checks for entire objects
- Default values
- Property-level get/set modifiers
- Schema-level get/set modifiers
- Required/nullable property assertions
- Easy access to a streamlined DynamoDB client (more info [here](#q-how-does-ddb-st-interact-with-the-underlying-dynamodb-client))

## ⚙️ Usage Notes

<!-- TODO Expand DdbST Usage-Notes into proper Usage Guide -->

- Attribute Configs:
  - `schema`: Currently, for performance reasons Typescript typings are only available for a maximum nest depth of 5. This is because the typings are generated by recursively traversing the schema object, and the deeper the nesting the more recursive calls are required. This is a temporary limitation, and is targeted for remediation in a future release.

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

## 📝 License

**ddb-single-table** is open-source software licensed under an [MIT License](/LICENSE).

<div align="center" style="margin-top:35px;">

## 💬 Contact

Trevor Anderson - [@TeeRevTweets](https://twitter.com/teerevtweets) - [Trevor@Nerdware.cloud](mailto:trevor@nerdware.cloud)

  <a href="https://www.youtube.com/channel/UCguSCK_j1obMVXvv-DUS3ng">
    <img src="https://github.com/Nerdware-LLC/fixit-api/.github/assets/YouTube_icon_circle.svg" height="40" />
  </a>
  &nbsp;
  <a href="https://www.linkedin.com/in/meet-trevor-anderson/">
    <img src="https://github.com/Nerdware-LLC/fixit-api/.github/assets/LinkedIn_icon_circle.svg" height="40" />
  </a>
  &nbsp;
  <a href="https://twitter.com/TeeRevTweets">
    <img src="https://github.com/Nerdware-LLC/fixit-api/.github/assets/Twitter_icon_circle.svg" height="40" />
  </a>
  &nbsp;
  <a href="mailto:trevor@nerdware.cloud">
    <img src="https://github.com/Nerdware-LLC/fixit-api/.github/assets/email_icon_circle.svg" height="40" />
  </a>
  <br><br>

  <a href="https://daremightythings.co/">
    <strong><i>Dare Mighty Things.</i></strong>
  </a>

</div>

<!-- LINKS -->

[pre-commit-shield]: https://img.shields.io/badge/pre--commit-33A532.svg?logo=pre-commit&logoColor=F8B424&labelColor=gray
[semantic-shield]: https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-E10079.svg
[license-shield]: https://img.shields.io/badge/License-MIT-yellow.svg
