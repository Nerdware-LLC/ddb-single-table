<div align="center">

  <a href="https://github.com/Nerdware-LLC">
    <img src=".github/assets/ddb-single-table-banner.png" alt="ddb-single-table-banner" />
  </a>

**A schema-based DynamoDB modeling tool and client wrapper for NodeJS built to supercharge single-table designs⚡**

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
- [💬 Contact](#-contact)
- [📝 License](#-license)

> This project is currently ESM-only and does not support CommonJS module syntax. If you need to use this project in a CommonJS environment, please open an issue and I'll prioritize adding support.

---

## 🚀 Getting Started

## ✨ Key Features

- Easy to use declarative API for managing DDB tables, connections, and models
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

---

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

## 📝 License

**ddb-single-table** is open-source software licensed under an [MIT License](/LICENSE).

<!-- LINKS -->

[pre-commit-shield]: https://img.shields.io/badge/pre--commit-33A532.svg?logo=pre-commit&logoColor=F8B424&labelColor=gray
[semantic-shield]: https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-E10079.svg
[license-shield]: https://img.shields.io/badge/License-MIT-yellow.svg
