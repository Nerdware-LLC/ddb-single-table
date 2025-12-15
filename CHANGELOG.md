# Changelog

All notable changes to this project will be documented in this file.

---

## [3.0.2](https://github.com/Nerdware-LLC/ddb-single-table/compare/v3.0.1...v3.0.2) (2025-12-15)

## [3.0.2-next.1](https://github.com/Nerdware-LLC/ddb-single-table/compare/v3.0.1...v3.0.2-next.1) (2025-12-15)

## [3.0.1](https://github.com/Nerdware-LLC/ddb-single-table/compare/v3.0.0...v3.0.1) (2025-08-04)

## [3.0.1-next.1](https://github.com/Nerdware-LLC/ddb-single-table/compare/v3.0.0...v3.0.1-next.1) (2025-08-04)

## [3.0.0](https://github.com/Nerdware-LLC/ddb-single-table/compare/v2.13.0...v3.0.0) (2025-07-01)

### Bug Fixes

- add `ReadonlyArray` type for ITFS compat ([84f70df](https://github.com/Nerdware-LLC/ddb-single-table/commit/84f70dfff8e3e671442b1820addc2437356070f7))
- add checks for `Date` objects in `recurse` fn, update types ([7b24cd4](https://github.com/Nerdware-LLC/ddb-single-table/commit/7b24cd43c5488c51ebc5240520b87390ec9bec6b))
- replace `NativeAttributeValue` w `SupportedAttributeValueType` for Dates ([4a0dd06](https://github.com/Nerdware-LLC/ddb-single-table/commit/4a0dd06243f40a9be85eb97e719736e4e7ca9b8d))
- replace inline `string | number` w `AttrValue` generic for correct typing ([e9adeaa](https://github.com/Nerdware-LLC/ddb-single-table/commit/e9adeaa06c12490f3373dbd6edb7fe9028632f3d))
- update named import for 'EnsureTableIsActiveParameters' ([bae628a](https://github.com/Nerdware-LLC/ddb-single-table/commit/bae628a09ea0512341126e29755a462399bca44c))

### Code Refactoring

- mv Date-conversion from Model IO-Action to `DdbClientFieldParser` ([d2a574c](https://github.com/Nerdware-LLC/ddb-single-table/commit/d2a574cc76ba576b159927e6f8dfd8dfe100a7a6))
- update Model methods to use new `DdbClientWrapper` return values ([e8a7bb5](https://github.com/Nerdware-LLC/ddb-single-table/commit/e8a7bb5064699be6571d5ea948f96d4914a17dd3))

### Features

- add `getRecursiveValueConverter` ([38cc316](https://github.com/Nerdware-LLC/ddb-single-table/commit/38cc316487f82f7720fc2bcf41853c065c13cb5a))
- add `isValidDatetimeString` ([33c97b3](https://github.com/Nerdware-LLC/ddb-single-table/commit/33c97b3abfddcaf301b333f51397fd9b6f67d2c0))
- add `UnknownItem` type, update `BaseItem` to use `SupportedAttributeValueType` ([ffec182](https://github.com/Nerdware-LLC/ddb-single-table/commit/ffec1826576aefb5bb0faa1941d0ac9b5a678209))
- add DdbClientArgParser for improved command argument handling and response parsing ([bdba380](https://github.com/Nerdware-LLC/ddb-single-table/commit/bdba380165321163295d6ae6d37b6e7f9a658dab))
- add export of `Model/types/*` ([8e6b95f](https://github.com/Nerdware-LLC/ddb-single-table/commit/8e6b95f63067a4e121f73baff982c70567174637))
- add FixPartialUndefined and OverrideSharedProperties types ([6a10d78](https://github.com/Nerdware-LLC/ddb-single-table/commit/6a10d78684cc9c189b0253a6b23dad2343b37042))
- add type `AttributeFunctionDefault` ([77dd84e](https://github.com/Nerdware-LLC/ddb-single-table/commit/77dd84ea2a7dde3ad6fddd81e5f4eae34bfe1931))
- rm export of NestDepth internal util types ([4fd364e](https://github.com/Nerdware-LLC/ddb-single-table/commit/4fd364e13d46f4d30784c6e4ad5dcc4994ece442))

### Reverts

- switch `transformItem` and `validateItem` param types back to `any` ([00b2525](https://github.com/Nerdware-LLC/ddb-single-table/commit/00b25253150b24132e57f4b515b39f46e298ad21))

### BREAKING CHANGES

- `schemaWithKeysOnly` has been rm'd, and batch methods filter unproc'd reqs.
- Date-conversion has been moved from `Model` to `DdbClientFieldParser`.

## [3.0.0-next.2](https://github.com/Nerdware-LLC/ddb-single-table/compare/v3.0.0-next.1...v3.0.0-next.2) (2025-07-01)

## [3.0.0-next.1](https://github.com/Nerdware-LLC/ddb-single-table/compare/v2.13.0...v3.0.0-next.1) (2025-07-01)

### Bug Fixes

- add `ReadonlyArray` type for ITFS compat ([84f70df](https://github.com/Nerdware-LLC/ddb-single-table/commit/84f70dfff8e3e671442b1820addc2437356070f7))
- add checks for `Date` objects in `recurse` fn, update types ([7b24cd4](https://github.com/Nerdware-LLC/ddb-single-table/commit/7b24cd43c5488c51ebc5240520b87390ec9bec6b))
- replace `NativeAttributeValue` w `SupportedAttributeValueType` for Dates ([4a0dd06](https://github.com/Nerdware-LLC/ddb-single-table/commit/4a0dd06243f40a9be85eb97e719736e4e7ca9b8d))
- replace inline `string | number` w `AttrValue` generic for correct typing ([e9adeaa](https://github.com/Nerdware-LLC/ddb-single-table/commit/e9adeaa06c12490f3373dbd6edb7fe9028632f3d))
- update named import for 'EnsureTableIsActiveParameters' ([bae628a](https://github.com/Nerdware-LLC/ddb-single-table/commit/bae628a09ea0512341126e29755a462399bca44c))

### Code Refactoring

- mv Date-conversion from Model IO-Action to `DdbClientFieldParser` ([d2a574c](https://github.com/Nerdware-LLC/ddb-single-table/commit/d2a574cc76ba576b159927e6f8dfd8dfe100a7a6))
- update Model methods to use new `DdbClientWrapper` return values ([e8a7bb5](https://github.com/Nerdware-LLC/ddb-single-table/commit/e8a7bb5064699be6571d5ea948f96d4914a17dd3))

### Features

- add `getRecursiveValueConverter` ([38cc316](https://github.com/Nerdware-LLC/ddb-single-table/commit/38cc316487f82f7720fc2bcf41853c065c13cb5a))
- add `isValidDatetimeString` ([33c97b3](https://github.com/Nerdware-LLC/ddb-single-table/commit/33c97b3abfddcaf301b333f51397fd9b6f67d2c0))
- add `UnknownItem` type, update `BaseItem` to use `SupportedAttributeValueType` ([ffec182](https://github.com/Nerdware-LLC/ddb-single-table/commit/ffec1826576aefb5bb0faa1941d0ac9b5a678209))
- add DdbClientArgParser for improved command argument handling and response parsing ([bdba380](https://github.com/Nerdware-LLC/ddb-single-table/commit/bdba380165321163295d6ae6d37b6e7f9a658dab))
- add export of `Model/types/*` ([8e6b95f](https://github.com/Nerdware-LLC/ddb-single-table/commit/8e6b95f63067a4e121f73baff982c70567174637))
- add FixPartialUndefined and OverrideSharedProperties types ([6a10d78](https://github.com/Nerdware-LLC/ddb-single-table/commit/6a10d78684cc9c189b0253a6b23dad2343b37042))
- add type `AttributeFunctionDefault` ([77dd84e](https://github.com/Nerdware-LLC/ddb-single-table/commit/77dd84ea2a7dde3ad6fddd81e5f4eae34bfe1931))
- rm export of NestDepth internal util types ([4fd364e](https://github.com/Nerdware-LLC/ddb-single-table/commit/4fd364e13d46f4d30784c6e4ad5dcc4994ece442))

### Reverts

- switch `transformItem` and `validateItem` param types back to `any` ([00b2525](https://github.com/Nerdware-LLC/ddb-single-table/commit/00b25253150b24132e57f4b515b39f46e298ad21))

### BREAKING CHANGES

- `schemaWithKeysOnly` has been rm'd, and batch methods filter unproc'd reqs.
- Date-conversion has been moved from `Model` to `DdbClientFieldParser`.

## [2.13.0](https://github.com/Nerdware-LLC/ddb-single-table/compare/v2.12.1...v2.13.0) (2025-06-15)

### Bug Fixes

- **docs:** improve readability of README by removing redundant links ([1d20a59](https://github.com/Nerdware-LLC/ddb-single-table/commit/1d20a59e8de9bcca45050f7ee84e0ab809aada86))

### Features

- **exports:** add type-only exports for batch ops and model params ([2fc3858](https://github.com/Nerdware-LLC/ddb-single-table/commit/2fc3858275171d9b5dde2ba165a2c843e9b758cb))
- **types:** add `convertDatesToStrings` option to `ItemTypeOpts` ([3ddcbf8](https://github.com/Nerdware-LLC/ddb-single-table/commit/3ddcbf84bc5514e0e9c2722f34960ecc12c261a0))

## [2.13.0-next.1](https://github.com/Nerdware-LLC/ddb-single-table/compare/v2.12.1...v2.13.0-next.1) (2025-06-15)

### Bug Fixes

- **docs:** improve readability of README by removing redundant links ([1d20a59](https://github.com/Nerdware-LLC/ddb-single-table/commit/1d20a59e8de9bcca45050f7ee84e0ab809aada86))

### Features

- **exports:** add type-only exports for batch ops and model params ([2fc3858](https://github.com/Nerdware-LLC/ddb-single-table/commit/2fc3858275171d9b5dde2ba165a2c843e9b758cb))
- **types:** add `convertDatesToStrings` option to `ItemTypeOpts` ([3ddcbf8](https://github.com/Nerdware-LLC/ddb-single-table/commit/3ddcbf84bc5514e0e9c2722f34960ecc12c261a0))

## [2.12.1](https://github.com/Nerdware-LLC/ddb-single-table/compare/v2.12.0...v2.12.1) (2025-05-28)

### Bug Fixes

- ensure `parentItem` is also updated w default values ([cd7e962](https://github.com/Nerdware-LLC/ddb-single-table/commit/cd7e962e211c2991b98297df028832356a6a5889))

## [2.12.1-next.1](https://github.com/Nerdware-LLC/ddb-single-table/compare/v2.12.0...v2.12.1-next.1) (2025-05-28)

### Bug Fixes

- ensure `parentItem` is also updated w default values ([cd7e962](https://github.com/Nerdware-LLC/ddb-single-table/commit/cd7e962e211c2991b98297df028832356a6a5889))

## [2.12.0](https://github.com/Nerdware-LLC/ddb-single-table/compare/v2.11.1...v2.12.0) (2025-05-26)

### Bug Fixes

- rm nullish checks, simplify Date/str checks ([9a36bcb](https://github.com/Nerdware-LLC/ddb-single-table/commit/9a36bcb5e9e34181e88ad3c20d50c4a1db641c9c))
- update `itemToReturn` to ensure provided arg is not mutated ([58a17cc](https://github.com/Nerdware-LLC/ddb-single-table/commit/58a17cc3b894a99f70ae34da96d4e00c1b5a899d))
- update `setDefaults` to ensure provided arg is not mutated ([ffff889](https://github.com/Nerdware-LLC/ddb-single-table/commit/ffff889d55d7ec33c38ae8748db68ab56d7794e2))

### Features

- replace unix timestamps w ISO-8601 fmt strings ([fac3f11](https://github.com/Nerdware-LLC/ddb-single-table/commit/fac3f11e00116a42b3c9ff9898943c140ecede76))
- rm Buffer conversions ([d2992c8](https://github.com/Nerdware-LLC/ddb-single-table/commit/d2992c866b2d698bb48f0ede5fc152f2adc191a1))
- uninstall dayjs ([b955130](https://github.com/Nerdware-LLC/ddb-single-table/commit/b95513059ad152366f8e01037fb077f9cfc82ea5))

## [2.12.0-next.1](https://github.com/Nerdware-LLC/ddb-single-table/compare/v2.11.1...v2.12.0-next.1) (2025-05-26)

### Bug Fixes

- rm nullish checks, simplify Date/str checks ([9a36bcb](https://github.com/Nerdware-LLC/ddb-single-table/commit/9a36bcb5e9e34181e88ad3c20d50c4a1db641c9c))
- update `itemToReturn` to ensure provided arg is not mutated ([58a17cc](https://github.com/Nerdware-LLC/ddb-single-table/commit/58a17cc3b894a99f70ae34da96d4e00c1b5a899d))
- update `setDefaults` to ensure provided arg is not mutated ([ffff889](https://github.com/Nerdware-LLC/ddb-single-table/commit/ffff889d55d7ec33c38ae8748db68ab56d7794e2))

### Features

- replace unix timestamps w ISO-8601 fmt strings ([fac3f11](https://github.com/Nerdware-LLC/ddb-single-table/commit/fac3f11e00116a42b3c9ff9898943c140ecede76))
- rm Buffer conversions ([d2992c8](https://github.com/Nerdware-LLC/ddb-single-table/commit/d2992c866b2d698bb48f0ede5fc152f2adc191a1))
- uninstall dayjs ([b955130](https://github.com/Nerdware-LLC/ddb-single-table/commit/b95513059ad152366f8e01037fb077f9cfc82ea5))

## [2.11.1](https://github.com/Nerdware-LLC/ddb-single-table/compare/v2.11.0...v2.11.1) (2025-05-22)

### Bug Fixes

- rm erroneous chars ([5fd41a8](https://github.com/Nerdware-LLC/ddb-single-table/commit/5fd41a8d6d01dde135a8f7261373eae9287ae20b))
- update `EnabledIOActions` to only permit correct keys for the given `IODirection` ([4847b42](https://github.com/Nerdware-LLC/ddb-single-table/commit/4847b4236832b481361fe09995c47ccc04ac1f56))

## [2.11.0](https://github.com/Nerdware-LLC/ddb-single-table/compare/v2.10.0...v2.11.0) (2025-05-21)

### Bug Fixes

- ensure Buffer and Set values are not iterated through ([4d85a8d](https://github.com/Nerdware-LLC/ddb-single-table/commit/4d85a8d8958c62632fd35f50855f96453201e036))
- update import path for `TableKeysAndIndexes` ([85e21a5](https://github.com/Nerdware-LLC/ddb-single-table/commit/85e21a5df6c72bfdfd11e9b1030393c8a5de1c69))

### Features

- add 'code' and `ECONNREFUSED` to DdbConnectionError ([1f51635](https://github.com/Nerdware-LLC/ddb-single-table/commit/1f51635e7430b070feb10e14413adb9056a42de6))
- add `MarshallingConfigs` and `DEFAULT_MARSHALLING_CONFIGS` ([1d51b27](https://github.com/Nerdware-LLC/ddb-single-table/commit/1d51b278026b910e85e8e76c4ca42a80cb427553))
- add type decs for "aws-sdk-client-mock-vitest" custom matchers ([519f70b](https://github.com/Nerdware-LLC/ddb-single-table/commit/519f70b87e2d68a57b46dea965cb494c116f94a0))
- add types `NativeAttributeValue` and `NativeKeyAttributeValue` ([401b06c](https://github.com/Nerdware-LLC/ddb-single-table/commit/401b06ce34a1507af08ac7b43e6e45af4dd3794a))
- replace `lib-dynamodb` with inline `marshall` and `unmarshall` fns ([268b89c](https://github.com/Nerdware-LLC/ddb-single-table/commit/268b89ce37bc675d3f30a042e4f109005625a402))
- rm `DdbClientErrorECONNREFUSED` (Node err, not AwsError) ([8e8401b](https://github.com/Nerdware-LLC/ddb-single-table/commit/8e8401b223bbdfe95eb70b83e553111e61a3c78b))

## [2.11.0-next.2](https://github.com/Nerdware-LLC/ddb-single-table/compare/v2.11.0-next.1...v2.11.0-next.2) (2025-05-21)

## [2.11.0-next.1](https://github.com/Nerdware-LLC/ddb-single-table/compare/v2.10.0...v2.11.0-next.1) (2025-05-21)

### Bug Fixes

- ensure Buffer and Set values are not iterated through ([4d85a8d](https://github.com/Nerdware-LLC/ddb-single-table/commit/4d85a8d8958c62632fd35f50855f96453201e036))
- update import path for `TableKeysAndIndexes` ([85e21a5](https://github.com/Nerdware-LLC/ddb-single-table/commit/85e21a5df6c72bfdfd11e9b1030393c8a5de1c69))

### Features

- add 'code' and `ECONNREFUSED` to DdbConnectionError ([1f51635](https://github.com/Nerdware-LLC/ddb-single-table/commit/1f51635e7430b070feb10e14413adb9056a42de6))
- add `MarshallingConfigs` and `DEFAULT_MARSHALLING_CONFIGS` ([1d51b27](https://github.com/Nerdware-LLC/ddb-single-table/commit/1d51b278026b910e85e8e76c4ca42a80cb427553))
- add type decs for "aws-sdk-client-mock-vitest" custom matchers ([519f70b](https://github.com/Nerdware-LLC/ddb-single-table/commit/519f70b87e2d68a57b46dea965cb494c116f94a0))
- add types `NativeAttributeValue` and `NativeKeyAttributeValue` ([401b06c](https://github.com/Nerdware-LLC/ddb-single-table/commit/401b06ce34a1507af08ac7b43e6e45af4dd3794a))
- replace `lib-dynamodb` with inline `marshall` and `unmarshall` fns ([268b89c](https://github.com/Nerdware-LLC/ddb-single-table/commit/268b89ce37bc675d3f30a042e4f109005625a402))
- rm `DdbClientErrorECONNREFUSED` (Node err, not AwsError) ([8e8401b](https://github.com/Nerdware-LLC/ddb-single-table/commit/8e8401b223bbdfe95eb70b83e553111e61a3c78b))

## [2.10.0](https://github.com/Nerdware-LLC/ddb-single-table/compare/v2.9.0...v2.10.0) (2025-05-09)

### Bug Fixes

- correct the logic testing whether 'maxRetries' has been met ([ee57cb2](https://github.com/Nerdware-LLC/ddb-single-table/commit/ee57cb2bb49ddf967d5ad6ef4ead99785bff01ad))
- rm duplicative `NestDepthMax32` definition (now it's imported) ([616751b](https://github.com/Nerdware-LLC/ddb-single-table/commit/616751bed05c6ff570e55b3dfa451133ed4bedd0))
- rm erroneous requirement of a `tableRangeKey` ([30e741b](https://github.com/Nerdware-LLC/ddb-single-table/commit/30e741bcf41986eed6e474a65e32372c579af3ee))
- update the logic in `generateUpdateExpression` to work as expected with nested partial objects/arrays ([da479f5](https://github.com/Nerdware-LLC/ddb-single-table/commit/da479f51af1572d5ed2fe70e0e765e0f339611aa))

### Features

- add type `ItemTypeToSchema` ([b7ceb03](https://github.com/Nerdware-LLC/ddb-single-table/commit/b7ceb0355ac940302324aec0dfdee29999eeaac3))

## [2.10.0-next.1](https://github.com/Nerdware-LLC/ddb-single-table/compare/v2.9.0...v2.10.0-next.1) (2025-05-09)

### Bug Fixes

- correct the logic testing whether 'maxRetries' has been met ([ee57cb2](https://github.com/Nerdware-LLC/ddb-single-table/commit/ee57cb2bb49ddf967d5ad6ef4ead99785bff01ad))
- rm duplicative `NestDepthMax32` definition (now it's imported) ([616751b](https://github.com/Nerdware-LLC/ddb-single-table/commit/616751bed05c6ff570e55b3dfa451133ed4bedd0))
- rm erroneous requirement of a `tableRangeKey` ([30e741b](https://github.com/Nerdware-LLC/ddb-single-table/commit/30e741bcf41986eed6e474a65e32372c579af3ee))
- update the logic in `generateUpdateExpression` to work as expected with nested partial objects/arrays ([da479f5](https://github.com/Nerdware-LLC/ddb-single-table/commit/da479f51af1572d5ed2fe70e0e765e0f339611aa))

### Features

- add type `ItemTypeToSchema` ([b7ceb03](https://github.com/Nerdware-LLC/ddb-single-table/commit/b7ceb0355ac940302324aec0dfdee29999eeaac3))

## [2.9.0](https://github.com/Nerdware-LLC/ddb-single-table/compare/v2.8.0...v2.9.0) (2025-04-21)

### Bug Fixes

- update import path for `Schema` types ([59aa7be](https://github.com/Nerdware-LLC/ddb-single-table/commit/59aa7bebdb5866665bd413d1ef6b6bfebf1af0d0))
- update import paths ([5fabe55](https://github.com/Nerdware-LLC/ddb-single-table/commit/5fabe550c9bb9d008aea09ce6c75af51d92a7e0e))
- update import paths for various moved types ([6027934](https://github.com/Nerdware-LLC/ddb-single-table/commit/602793407c261bf806a14e2519fe42744844c02c))

### Features

- add `nullable` attr config checks ([d4f74f9](https://github.com/Nerdware-LLC/ddb-single-table/commit/d4f74f9dc482449af9bb8ef6301277408d06a494))
- add `nullable` type checks, split `itemTypes.ts` into multiple files ([a3255b6](https://github.com/Nerdware-LLC/ddb-single-table/commit/a3255b6d55605e51d59febb976d802261f0c0672))

### Reverts

- bring back `IterateNestDepthMax10` to fix "type instantiation is excessively deep and possibly infinite" errors ([1abffb9](https://github.com/Nerdware-LLC/ddb-single-table/commit/1abffb97b10150fe3e8b5884d70498db999a1323))

## [2.9.0-next.1](https://github.com/Nerdware-LLC/ddb-single-table/compare/v2.8.0...v2.9.0-next.1) (2025-04-21)

### Bug Fixes

- update import path for `Schema` types ([59aa7be](https://github.com/Nerdware-LLC/ddb-single-table/commit/59aa7bebdb5866665bd413d1ef6b6bfebf1af0d0))
- update import paths ([5fabe55](https://github.com/Nerdware-LLC/ddb-single-table/commit/5fabe550c9bb9d008aea09ce6c75af51d92a7e0e))
- update import paths for various moved types ([6027934](https://github.com/Nerdware-LLC/ddb-single-table/commit/602793407c261bf806a14e2519fe42744844c02c))

### Features

- add `nullable` attr config checks ([d4f74f9](https://github.com/Nerdware-LLC/ddb-single-table/commit/d4f74f9dc482449af9bb8ef6301277408d06a494))
- add `nullable` type checks, split `itemTypes.ts` into multiple files ([a3255b6](https://github.com/Nerdware-LLC/ddb-single-table/commit/a3255b6d55605e51d59febb976d802261f0c0672))

### Reverts

- bring back `IterateNestDepthMax10` to fix "type instantiation is excessively deep and possibly infinite" errors ([1abffb9](https://github.com/Nerdware-LLC/ddb-single-table/commit/1abffb97b10150fe3e8b5884d70498db999a1323))

## [2.8.0](https://github.com/Nerdware-LLC/ddb-single-table/compare/v2.7.5...v2.8.0) (2025-04-13)

### Bug Fixes

- add bool type-check to avoid `dayjs.isValid` false positives ([ebe454e](https://github.com/Nerdware-LLC/ddb-single-table/commit/ebe454ee605077ea8ebdb4c2f517afd709f5a9e4))
- update tests to reflect that `autoAddTimestamps` is now false by default ([fa333c6](https://github.com/Nerdware-LLC/ddb-single-table/commit/fa333c64988b72ff6d8e3a69eb13da9366ac2039))

### Features

- add and impl `BASE_TIMESTAMP_ATTRIBUTE_CONFIG` ([d46a83d](https://github.com/Nerdware-LLC/ddb-single-table/commit/d46a83da620c9e4d917b2b496f50234cc3162c2b))
- impl `const` type params ([db3e6bf](https://github.com/Nerdware-LLC/ddb-single-table/commit/db3e6bf1952b3cd3730684911e37b3d9922b1f66))
- set `autoAddTimestamps` and `nullableIfOptional` to `false` by default ([0659f65](https://github.com/Nerdware-LLC/ddb-single-table/commit/0659f65bf1c240400863d276a8602d41e59e27ee))

## [2.8.0-next.1](https://github.com/Nerdware-LLC/ddb-single-table/compare/v2.7.5...v2.8.0-next.1) (2025-04-13)

### Bug Fixes

- add bool type-check to avoid `dayjs.isValid` false positives ([ebe454e](https://github.com/Nerdware-LLC/ddb-single-table/commit/ebe454ee605077ea8ebdb4c2f517afd709f5a9e4))
- update tests to reflect that `autoAddTimestamps` is now false by default ([fa333c6](https://github.com/Nerdware-LLC/ddb-single-table/commit/fa333c64988b72ff6d8e3a69eb13da9366ac2039))

### Features

- add and impl `BASE_TIMESTAMP_ATTRIBUTE_CONFIG` ([d46a83d](https://github.com/Nerdware-LLC/ddb-single-table/commit/d46a83da620c9e4d917b2b496f50234cc3162c2b))
- impl `const` type params ([db3e6bf](https://github.com/Nerdware-LLC/ddb-single-table/commit/db3e6bf1952b3cd3730684911e37b3d9922b1f66))
- set `autoAddTimestamps` and `nullableIfOptional` to `false` by default ([0659f65](https://github.com/Nerdware-LLC/ddb-single-table/commit/0659f65bf1c240400863d276a8602d41e59e27ee))

## [2.7.5](https://github.com/Nerdware-LLC/ddb-single-table/compare/v2.7.4...v2.7.5) (2025-03-06)

## [2.7.5-next.1](https://github.com/Nerdware-LLC/ddb-single-table/compare/v2.7.4...v2.7.5-next.1) (2025-03-06)

## [2.7.4](https://github.com/Nerdware-LLC/ddb-single-table/compare/v2.7.3...v2.7.4) (2025-02-02)

### Bug Fixes

- rm "confusing" void-return expression ([cb41c33](https://github.com/Nerdware-LLC/ddb-single-table/commit/cb41c33a0b9ca48e745713977977547e4d02e5e1))

## [2.7.4-next.1](https://github.com/Nerdware-LLC/ddb-single-table/compare/v2.7.3...v2.7.4-next.1) (2025-02-02)

### Bug Fixes

- rm "confusing" void-return expression ([cb41c33](https://github.com/Nerdware-LLC/ddb-single-table/commit/cb41c33a0b9ca48e745713977977547e4d02e5e1))

## [2.7.3](https://github.com/Nerdware-LLC/ddb-single-table/compare/v2.7.2...v2.7.3) (2024-08-28)

### Bug Fixes

- **Model:** add opt-chains to simplify mock setups ([224b985](https://github.com/Nerdware-LLC/ddb-single-table/commit/224b9857a7f43826e18e551320cb79973bb20408))

## [2.7.3-next.1](https://github.com/Nerdware-LLC/ddb-single-table/compare/v2.7.2...v2.7.3-next.1) (2024-08-28)

### Bug Fixes

- **Model:** add opt-chains to simplify mock setups ([224b985](https://github.com/Nerdware-LLC/ddb-single-table/commit/224b9857a7f43826e18e551320cb79973bb20408))

## [2.7.2](https://github.com/Nerdware-LLC/ddb-single-table/compare/v2.7.1...v2.7.2) (2024-08-18)

### Bug Fixes

- rm unnecessary opt chains ([6f7c758](https://github.com/Nerdware-LLC/ddb-single-table/commit/6f7c7584d8eeaecad0d0602caa92c0ed71383472))

## [2.7.2-next.1](https://github.com/Nerdware-LLC/ddb-single-table/compare/v2.7.1...v2.7.2-next.1) (2024-08-18)

### Bug Fixes

- rm unnecessary opt chains ([6f7c758](https://github.com/Nerdware-LLC/ddb-single-table/commit/6f7c7584d8eeaecad0d0602caa92c0ed71383472))

## [2.7.1](https://github.com/Nerdware-LLC/ddb-single-table/compare/v2.7.0...v2.7.1) (2024-08-18)

### Bug Fixes

- **types:** add `TableInstance` type alias ([9c93b65](https://github.com/Nerdware-LLC/ddb-single-table/commit/9c93b65e45fa3d8f7f75b5366e355deb22b6a4fc))

## [2.7.1-next.1](https://github.com/Nerdware-LLC/ddb-single-table/compare/v2.7.0...v2.7.1-next.1) (2024-08-18)

### Bug Fixes

- **types:** add `TableInstance` type alias ([9c93b65](https://github.com/Nerdware-LLC/ddb-single-table/commit/9c93b65e45fa3d8f7f75b5366e355deb22b6a4fc))

## [2.7.0](https://github.com/Nerdware-LLC/ddb-single-table/compare/v2.6.3...v2.7.0) (2024-08-03)

### Features

- add 'transformValues' and 'validate' ioActions to processKeyArgs ([5c0d2e5](https://github.com/Nerdware-LLC/ddb-single-table/commit/5c0d2e5bc4dc631c32cf73cc95aea24ef52232b7))

## [2.7.0-next.3](https://github.com/Nerdware-LLC/ddb-single-table/compare/v2.7.0-next.2...v2.7.0-next.3) (2024-08-03)

## [2.7.0-next.2](https://github.com/Nerdware-LLC/ddb-single-table/compare/v2.7.0-next.1...v2.7.0-next.2) (2024-06-10)

## [2.7.0-next.1](https://github.com/Nerdware-LLC/ddb-single-table/compare/v2.6.3...v2.7.0-next.1) (2024-06-10)

### Features

- add 'transformValues' and 'validate' ioActions to processKeyArgs ([5c0d2e5](https://github.com/Nerdware-LLC/ddb-single-table/commit/5c0d2e5bc4dc631c32cf73cc95aea24ef52232b7))

## [2.6.3](https://github.com/Nerdware-LLC/ddb-single-table/compare/v2.6.2...v2.6.3) (2024-06-10)

### Performance Improvements

- replace Object.entries with for-loops ([faa57a0](https://github.com/Nerdware-LLC/ddb-single-table/commit/faa57a07bed8e012cc99a11894502caacb1da18f))

## [2.6.3-next.1](https://github.com/Nerdware-LLC/ddb-single-table/compare/v2.6.2...v2.6.3-next.1) (2024-06-10)

### Performance Improvements

- replace Object.entries with for-loops ([faa57a0](https://github.com/Nerdware-LLC/ddb-single-table/commit/faa57a07bed8e012cc99a11894502caacb1da18f))

## [2.6.2](https://github.com/Nerdware-LLC/ddb-single-table/compare/v2.6.1...v2.6.2) (2024-06-09)

## [2.6.1](https://github.com/Nerdware-LLC/ddb-single-table/compare/v2.6.0...v2.6.1) (2024-06-08)

### Bug Fixes

- correct index-name lookup logic ([58a5075](https://github.com/Nerdware-LLC/ddb-single-table/commit/58a5075def07927016b08e0e28deac27e539f16d))

## [2.6.0](https://github.com/Nerdware-LLC/ddb-single-table/compare/v2.5.0...v2.6.0) (2024-05-10)

### Features

- add support for TransactWriteItems cmd ([8333d8a](https://github.com/Nerdware-LLC/ddb-single-table/commit/8333d8a9f80cf133d4f03413c7ff6bc6c31b643e))

## [2.6.0-next.1](https://github.com/Nerdware-LLC/ddb-single-table/compare/v2.5.0...v2.6.0-next.1) (2024-05-10)

### Features

- add support for TransactWriteItems cmd ([8333d8a](https://github.com/Nerdware-LLC/ddb-single-table/commit/8333d8a9f80cf133d4f03413c7ff6bc6c31b643e))

## [2.5.0](https://github.com/Nerdware-LLC/ddb-single-table/compare/v2.4.5...v2.5.0) (2024-04-22)

### Features

- bump node to v20, npm to v10 ([e06bc65](https://github.com/Nerdware-LLC/ddb-single-table/commit/e06bc65c97541ed273dc95f8ef2bcc01bda58e7f))

## [2.5.0-next.1](https://github.com/Nerdware-LLC/ddb-single-table/compare/v2.4.5...v2.5.0-next.1) (2024-04-22)

### Features

- bump node to v20, npm to v10 ([e06bc65](https://github.com/Nerdware-LLC/ddb-single-table/commit/e06bc65c97541ed273dc95f8ef2bcc01bda58e7f))

## [2.4.5](https://github.com/Nerdware-LLC/ddb-single-table/compare/v2.4.4...v2.4.5) (2024-04-22)

## [2.4.4](https://github.com/Nerdware-LLC/ddb-single-table/compare/v2.4.3...v2.4.4) (2024-04-22)

## [2.4.3](https://github.com/Nerdware-LLC/ddb-single-table/compare/v2.4.2...v2.4.3) (2024-04-22)

## [2.4.2](https://github.com/Nerdware-LLC/ddb-single-table/compare/v2.4.1...v2.4.2) (2024-04-22)

## [2.4.1](https://github.com/Nerdware-LLC/ddb-single-table/compare/v2.4.0...v2.4.1) (2024-04-04)

## [2.4.0](https://github.com/Nerdware-LLC/ddb-single-table/compare/v2.3.3...v2.4.0) (2024-02-15)

### Features

- add [@nerdware](https://github.com/nerdware) type-safety utils ([ea251eb](https://github.com/Nerdware-LLC/ddb-single-table/commit/ea251eb98afaafcd61c8ca95bdc6ed44e71a7d04))

## [2.4.0-next.1](https://github.com/Nerdware-LLC/ddb-single-table/compare/v2.3.3...v2.4.0-next.1) (2024-02-15)

### Features

- add [@nerdware](https://github.com/nerdware) type-safety utils ([ea251eb](https://github.com/Nerdware-LLC/ddb-single-table/commit/ea251eb98afaafcd61c8ca95bdc6ed44e71a7d04))

## [2.3.3](https://github.com/Nerdware-LLC/ddb-single-table/compare/v2.3.2...v2.3.3) (2024-02-14)

## [2.3.3-next.1](https://github.com/Nerdware-LLC/ddb-single-table/compare/v2.3.2...v2.3.3-next.1) (2024-02-14)

## [2.3.2](https://github.com/Nerdware-LLC/ddb-single-table/compare/v2.3.1...v2.3.2) (2024-02-11)

### Bug Fixes

- correct isFunction return type ([fd03980](https://github.com/Nerdware-LLC/ddb-single-table/commit/fd03980ea14e13e723e547cf1b42acb717d77e0e))

## [2.3.2-next.1](https://github.com/Nerdware-LLC/ddb-single-table/compare/v2.3.1...v2.3.2-next.1) (2024-02-11)

### Bug Fixes

- correct isFunction return type ([fd03980](https://github.com/Nerdware-LLC/ddb-single-table/commit/fd03980ea14e13e723e547cf1b42acb717d77e0e))

## [2.3.1](https://github.com/Nerdware-LLC/ddb-single-table/compare/v2.3.0...v2.3.1) (2024-01-29)

## [2.3.1-next.1](https://github.com/Nerdware-LLC/ddb-single-table/compare/v2.3.0...v2.3.1-next.1) (2024-01-29)

## [2.3.0](https://github.com/Nerdware-LLC/ddb-single-table/compare/v2.2.1...v2.3.0) (2023-12-11)

### Features

- **utils:** add isErrorObject ([d84b1c2](https://github.com/Nerdware-LLC/ddb-single-table/commit/d84b1c22c48cf7f85c66979ed3386dc1dab54207))

## [2.3.0-next.1](https://github.com/Nerdware-LLC/ddb-single-table/compare/v2.2.1...v2.3.0-next.1) (2023-12-10)

### Features

- **utils:** add isErrorObject ([d84b1c2](https://github.com/Nerdware-LLC/ddb-single-table/commit/d84b1c22c48cf7f85c66979ed3386dc1dab54207))

## [2.2.1](https://github.com/Nerdware-LLC/ddb-single-table/compare/v2.2.0...v2.2.1) (2023-10-29)

### Bug Fixes

- correct ts-eslint rules impl for flatconfig ([5a5aef3](https://github.com/Nerdware-LLC/ddb-single-table/commit/5a5aef3331f1aa6a9546034f295663185df8841e))

## [2.2.1-next.1](https://github.com/Nerdware-LLC/ddb-single-table/compare/v2.2.0...v2.2.1-next.1) (2023-10-29)

### Bug Fixes

- correct ts-eslint rules impl for flatconfig ([5a5aef3](https://github.com/Nerdware-LLC/ddb-single-table/commit/5a5aef3331f1aa6a9546034f295663185df8841e))

## [2.2.0](https://github.com/Nerdware-LLC/ddb-single-table/compare/v2.1.3...v2.2.0) (2023-10-16)

### Bug Fixes

- add explicit 'override' to err name prop ([b63768c](https://github.com/Nerdware-LLC/ddb-single-table/commit/b63768c22c24f1c38b44af2958bf50bbe9d521fd))
- add type cast to getAttrErrID dest test ([13caecc](https://github.com/Nerdware-LLC/ddb-single-table/commit/13caecc96028b2cc347c8475a7350a3dfeb55144))
- update props to account for exactOptionalPropertyTypes ([931932e](https://github.com/Nerdware-LLC/ddb-single-table/commit/931932e645046f99059d77211f824bb99c1eae4a))

### Features

- expand itemType nest-depth to 32 ([38c4096](https://github.com/Nerdware-LLC/ddb-single-table/commit/38c40962ae66b52682dcef5fc293c43642fda2c8))

## [2.2.0-next.1](https://github.com/Nerdware-LLC/ddb-single-table/compare/v2.1.3...v2.2.0-next.1) (2023-10-16)

### Bug Fixes

- add explicit 'override' to err name prop ([b63768c](https://github.com/Nerdware-LLC/ddb-single-table/commit/b63768c22c24f1c38b44af2958bf50bbe9d521fd))
- add type cast to getAttrErrID dest test ([13caecc](https://github.com/Nerdware-LLC/ddb-single-table/commit/13caecc96028b2cc347c8475a7350a3dfeb55144))
- update props to account for exactOptionalPropertyTypes ([931932e](https://github.com/Nerdware-LLC/ddb-single-table/commit/931932e645046f99059d77211f824bb99c1eae4a))

### Features

- expand itemType nest-depth to 32 ([38c4096](https://github.com/Nerdware-LLC/ddb-single-table/commit/38c40962ae66b52682dcef5fc293c43642fda2c8))

## [2.1.3](https://github.com/Nerdware-LLC/ddb-single-table/compare/v2.1.2...v2.1.3) (2023-10-10)

## [2.1.2](https://github.com/Nerdware-LLC/ddb-single-table/compare/v2.1.1...v2.1.2) (2023-10-08)

### Bug Fixes

- correct err type check logic ([a67451c](https://github.com/Nerdware-LLC/ddb-single-table/commit/a67451c7fce9baca2cef20b52695d43328bbdc31))

## [2.1.2-next.1](https://github.com/Nerdware-LLC/ddb-single-table/compare/v2.1.1...v2.1.2-next.1) (2023-10-08)

### Bug Fixes

- correct err type check logic ([a67451c](https://github.com/Nerdware-LLC/ddb-single-table/commit/a67451c7fce9baca2cef20b52695d43328bbdc31))

## [2.1.1](https://github.com/Nerdware-LLC/ddb-single-table/compare/v2.1.0...v2.1.1) (2023-10-08)

### Bug Fixes

- correct typeof KeyParam fn default ([378bb84](https://github.com/Nerdware-LLC/ddb-single-table/commit/378bb8408280ad8fda271f89ae4e5e8dc895e3d2))
- strip 'Configs' suffix from 'ddbClient' key ([2573080](https://github.com/Nerdware-LLC/ddb-single-table/commit/2573080452e0e01991644e67993c98acac3fbb42))

## [2.1.1-next.1](https://github.com/Nerdware-LLC/ddb-single-table/compare/v2.1.0...v2.1.1-next.1) (2023-10-07)

### Bug Fixes

- correct typeof KeyParam fn default ([378bb84](https://github.com/Nerdware-LLC/ddb-single-table/commit/378bb8408280ad8fda271f89ae4e5e8dc895e3d2))
- strip 'Configs' suffix from 'ddbClient' key ([2573080](https://github.com/Nerdware-LLC/ddb-single-table/commit/2573080452e0e01991644e67993c98acac3fbb42))

## [2.1.0](https://github.com/Nerdware-LLC/ddb-single-table/compare/v2.0.7...v2.1.0) (2023-10-07)

### Features

- add 'autoAddTimestamps' to ModelSchema ([2ecfcd2](https://github.com/Nerdware-LLC/ddb-single-table/commit/2ecfcd2c36525cb8e6fcd1b2354c9b348fabce2b))

## [2.1.0-next.1](https://github.com/Nerdware-LLC/ddb-single-table/compare/v2.0.7-next.1...v2.1.0-next.1) (2023-10-07)

### Features

- add 'autoAddTimestamps' to ModelSchema ([2ecfcd2](https://github.com/Nerdware-LLC/ddb-single-table/commit/2ecfcd2c36525cb8e6fcd1b2354c9b348fabce2b))

## [2.0.7](https://github.com/Nerdware-LLC/ddb-single-table/compare/v2.0.6...v2.0.7) (2023-10-02)

### Bug Fixes

- make 'ddbClient' optional to allow env-var configs ([a7fa8f3](https://github.com/Nerdware-LLC/ddb-single-table/commit/a7fa8f3e5bad06d68cc8d8a8361f39b9454afa04))
- replace 'SupportedValues' w unknown in transformValue ([02d0238](https://github.com/Nerdware-LLC/ddb-single-table/commit/02d023836b90acd3dd36c7f9680b1d2e4d210e26))

## [2.0.7-next.2](https://github.com/Nerdware-LLC/ddb-single-table/compare/v2.0.7-next.1...v2.0.7-next.2) (2023-10-02)

### Bug Fixes

- set transformItem fns to return BaseItem ([eb773a5](https://github.com/Nerdware-LLC/ddb-single-table/commit/eb773a567a6cb01f376588944877669dbe76dcc3))

## [2.0.7-next.1](https://github.com/Nerdware-LLC/ddb-single-table/compare/v2.0.6...v2.0.7-next.1) (2023-10-02)

### Bug Fixes

- make 'ddbClient' optional to allow env-var configs ([a7fa8f3](https://github.com/Nerdware-LLC/ddb-single-table/commit/a7fa8f3e5bad06d68cc8d8a8361f39b9454afa04))
- replace 'SupportedValues' w unknown in transformValue ([02d0238](https://github.com/Nerdware-LLC/ddb-single-table/commit/02d023836b90acd3dd36c7f9680b1d2e4d210e26))

## [2.0.6](https://github.com/Nerdware-LLC/ddb-single-table/compare/v2.0.5...v2.0.6) (2023-10-02)

### Bug Fixes

- add export all from Schema ([e8865b7](https://github.com/Nerdware-LLC/ddb-single-table/commit/e8865b7623ffec5c42d54eb8aeffc840091f4e61))

## [2.0.5](https://github.com/Nerdware-LLC/ddb-single-table/compare/v2.0.4...v2.0.5) (2023-10-01)

### Bug Fixes

- correct Model method return typings ([2ae1044](https://github.com/Nerdware-LLC/ddb-single-table/commit/2ae10449f3a2cbcb23deba995f63b52d7cf0f4f0))

## [2.0.5-next.1](https://github.com/Nerdware-LLC/ddb-single-table/compare/v2.0.4...v2.0.5-next.1) (2023-10-01)

### Bug Fixes

- correct Model method return typings ([2ae1044](https://github.com/Nerdware-LLC/ddb-single-table/commit/2ae10449f3a2cbcb23deba995f63b52d7cf0f4f0))

## [2.0.4](https://github.com/Nerdware-LLC/ddb-single-table/compare/v2.0.3...v2.0.4) (2023-09-29)

### Bug Fixes

- add 'npx' before 'tsc' invocations ([1bd4fdf](https://github.com/Nerdware-LLC/ddb-single-table/commit/1bd4fdffe4783920574a40ce456967e4b5e7ca8a))

## [2.0.4-next.1](https://github.com/Nerdware-LLC/ddb-single-table/compare/v2.0.3...v2.0.4-next.1) (2023-09-29)

### Bug Fixes

- add 'npx' before 'tsc' invocations ([1bd4fdf](https://github.com/Nerdware-LLC/ddb-single-table/commit/1bd4fdffe4783920574a40ce456967e4b5e7ca8a))

## [2.0.1](https://github.com/Nerdware-LLC/ddb-single-table/compare/v2.0.0...v2.0.1) (2023-09-28)

## [2.0.0](https://github.com/Nerdware-LLC/ddb-single-table/compare/v1.3.1...v2.0.0) (2023-09-28)

### Bug Fixes

- change TKSchema type param to not conflict w class ([28b8000](https://github.com/Nerdware-LLC/ddb-single-table/commit/28b80009360258c1d546972d67acf8b2495368ae))
- ensure isNumber works for all DDB number types ([46cdc01](https://github.com/Nerdware-LLC/ddb-single-table/commit/46cdc0162c4bad6448c5bf78ff57ca5a0de4612c))
- have Input extend 'object' for DDB types w/o index sig ([afef500](https://github.com/Nerdware-LLC/ddb-single-table/commit/afef5005bf9ea9d53835c643ae2f8ef2278b39c8))
- impl new import path for Schema types ([a73e60d](https://github.com/Nerdware-LLC/ddb-single-table/commit/a73e60dbe7cbfc06b0f9093f060de3a8a6d65682))
- impl new import path for Schema types ([5c4a2db](https://github.com/Nerdware-LLC/ddb-single-table/commit/5c4a2dbbeb9d1ff8f8f9c13cc58cde66c8fafb94))
- rm export of mv'd schemaTypes ([e835266](https://github.com/Nerdware-LLC/ddb-single-table/commit/e835266f111c8663d1b697e2851472af67fe073a))
- update Schema types import path ([5d73365](https://github.com/Nerdware-LLC/ddb-single-table/commit/5d733654ecc02e8937ed85dc666d782de13ecbde))

### Code Refactoring

- ensure Model ItemType doesn't cause tsc OOM issue ([a8b8d93](https://github.com/Nerdware-LLC/ddb-single-table/commit/a8b8d93ef7cab4266a6f49ab68f19d1f32cd545a))

### Features

- add base Schema class, mv shared validation here ([77bb180](https://github.com/Nerdware-LLC/ddb-single-table/commit/77bb18036f9a6fc64d7b8967ece6dd23c2f6951a))
- add BatchOperationParams ([f45df6e](https://github.com/Nerdware-LLC/ddb-single-table/commit/f45df6e8adf1cb1fc02c32b59869d7a630574a93))
- add index file for Schema exports ([128cb9e](https://github.com/Nerdware-LLC/ddb-single-table/commit/128cb9e90fb1217221de885f4d5ed8f6c1bba971))
- add ModelSchema class, mv validation here ([5273f5c](https://github.com/Nerdware-LLC/ddb-single-table/commit/5273f5c086c51f1d8107210b16fe7bb5e7c22f59))
- add TableKeysAndIndexes, update Table types ([b14f648](https://github.com/Nerdware-LLC/ddb-single-table/commit/b14f648538f6146649b00b9c98637ee8b95c2d91))
- add TK Schema class, mv validation here ([0b10623](https://github.com/Nerdware-LLC/ddb-single-table/commit/0b106230ea6271a9799225c94d5919d5643f1d4c))
- add usage of unified 'aliasesMap' ctx param ([113bb29](https://github.com/Nerdware-LLC/ddb-single-table/commit/113bb295b215f9820cf4488c82ca71395d8d409f))

### Performance Improvements

- replace mapped ItemParams w BaseItem ([f182c73](https://github.com/Nerdware-LLC/ddb-single-table/commit/f182c738397aff19b66acf2544cf623a41660ff4))

### BREAKING CHANGES

- Model API has been changed to fix tsc OOM issue.

## [2.0.0-next.1](https://github.com/Nerdware-LLC/ddb-single-table/compare/v1.3.1...v2.0.0-next.1) (2023-09-28)

### Bug Fixes

- change TKSchema type param to not conflict w class ([28b8000](https://github.com/Nerdware-LLC/ddb-single-table/commit/28b80009360258c1d546972d67acf8b2495368ae))
- ensure isNumber works for all DDB number types ([46cdc01](https://github.com/Nerdware-LLC/ddb-single-table/commit/46cdc0162c4bad6448c5bf78ff57ca5a0de4612c))
- have Input extend 'object' for DDB types w/o index sig ([afef500](https://github.com/Nerdware-LLC/ddb-single-table/commit/afef5005bf9ea9d53835c643ae2f8ef2278b39c8))
- impl new import path for Schema types ([a73e60d](https://github.com/Nerdware-LLC/ddb-single-table/commit/a73e60dbe7cbfc06b0f9093f060de3a8a6d65682))
- impl new import path for Schema types ([5c4a2db](https://github.com/Nerdware-LLC/ddb-single-table/commit/5c4a2dbbeb9d1ff8f8f9c13cc58cde66c8fafb94))
- rm export of mv'd schemaTypes ([e835266](https://github.com/Nerdware-LLC/ddb-single-table/commit/e835266f111c8663d1b697e2851472af67fe073a))
- update Schema types import path ([5d73365](https://github.com/Nerdware-LLC/ddb-single-table/commit/5d733654ecc02e8937ed85dc666d782de13ecbde))

### Code Refactoring

- ensure Model ItemType doesn't cause tsc OOM issue ([a8b8d93](https://github.com/Nerdware-LLC/ddb-single-table/commit/a8b8d93ef7cab4266a6f49ab68f19d1f32cd545a))

### Features

- add base Schema class, mv shared validation here ([77bb180](https://github.com/Nerdware-LLC/ddb-single-table/commit/77bb18036f9a6fc64d7b8967ece6dd23c2f6951a))
- add BatchOperationParams ([f45df6e](https://github.com/Nerdware-LLC/ddb-single-table/commit/f45df6e8adf1cb1fc02c32b59869d7a630574a93))
- add index file for Schema exports ([128cb9e](https://github.com/Nerdware-LLC/ddb-single-table/commit/128cb9e90fb1217221de885f4d5ed8f6c1bba971))
- add ModelSchema class, mv validation here ([5273f5c](https://github.com/Nerdware-LLC/ddb-single-table/commit/5273f5c086c51f1d8107210b16fe7bb5e7c22f59))
- add TableKeysAndIndexes, update Table types ([b14f648](https://github.com/Nerdware-LLC/ddb-single-table/commit/b14f648538f6146649b00b9c98637ee8b95c2d91))
- add TK Schema class, mv validation here ([0b10623](https://github.com/Nerdware-LLC/ddb-single-table/commit/0b106230ea6271a9799225c94d5919d5643f1d4c))
- add usage of unified 'aliasesMap' ctx param ([113bb29](https://github.com/Nerdware-LLC/ddb-single-table/commit/113bb295b215f9820cf4488c82ca71395d8d409f))

### Performance Improvements

- replace mapped ItemParams w BaseItem ([f182c73](https://github.com/Nerdware-LLC/ddb-single-table/commit/f182c738397aff19b66acf2544cf623a41660ff4))

### BREAKING CHANGES

- Model API has been changed to fix tsc OOM issue.

## [1.3.1](https://github.com/Nerdware-LLC/ddb-single-table/compare/v1.3.0...v1.3.1) (2023-09-22)

## [1.3.0](https://github.com/Nerdware-LLC/ddb-single-table/compare/v1.2.0...v1.3.0) (2023-09-22)

### Bug Fixes

- correct '.vscode' file patterns in gitignore ([6b4008a](https://github.com/Nerdware-LLC/ddb-single-table/commit/6b4008af862ce6120aaadb850ed1d700bb7feca4))
- correct import path for ModelSchemaType ([5c886da](https://github.com/Nerdware-LLC/ddb-single-table/commit/5c886da44300b6fdbc88983686dd709f37945ccc))
- **prettier:** add missing 'plugins' key to config ([957245b](https://github.com/Nerdware-LLC/ddb-single-table/commit/957245bcf511c4ba839fd9913c7965408f5eabf2))
- rm extraneous import ([48aa92d](https://github.com/Nerdware-LLC/ddb-single-table/commit/48aa92d98abe37fc550ac7f5915127e279210287))
- rm extraneous import ([5e8dcf2](https://github.com/Nerdware-LLC/ddb-single-table/commit/5e8dcf2552e4c237bc69533e4e98068a1c94cee4))
- rm old export ([e03e181](https://github.com/Nerdware-LLC/ddb-single-table/commit/e03e1813c37bc978125c293dd93b213b417d6e84))
- rm types files that have been moved ([b295c99](https://github.com/Nerdware-LLC/ddb-single-table/commit/b295c994175e935010b3c512467d0efc1310098b))
- update name of imported type used by isType utils ([55547fb](https://github.com/Nerdware-LLC/ddb-single-table/commit/55547fbcd6d031a60f0ec196aa7e385f20a3c508))
- update Table and Model export names ([2af75d3](https://github.com/Nerdware-LLC/ddb-single-table/commit/2af75d3f1f27b83f8ededddad2bac29c6691c989))

### Features

- add handler for batch requests ([96747c9](https://github.com/Nerdware-LLC/ddb-single-table/commit/96747c94b8f1cce1f4f358ae6232dcb3a968b229))

### Performance Improvements

- streamline generic mapped types ([5b8ef1f](https://github.com/Nerdware-LLC/ddb-single-table/commit/5b8ef1fe48335f2d7d8b1d2dd5258c48a76b404f))

## [1.2.0-next.2](https://github.com/Nerdware-LLC/ddb-single-table/compare/v1.2.0-next.1...v1.2.0-next.2) (2023-09-20)

### Bug Fixes

- correct import path for ModelSchemaType ([5c886da](https://github.com/Nerdware-LLC/ddb-single-table/commit/5c886da44300b6fdbc88983686dd709f37945ccc))
- rm extraneous import ([48aa92d](https://github.com/Nerdware-LLC/ddb-single-table/commit/48aa92d98abe37fc550ac7f5915127e279210287))
- rm extraneous import ([5e8dcf2](https://github.com/Nerdware-LLC/ddb-single-table/commit/5e8dcf2552e4c237bc69533e4e98068a1c94cee4))

### Reverts

- use old '.vscode' gitignore pattern ([8d7af84](https://github.com/Nerdware-LLC/ddb-single-table/commit/8d7af8424ffdd9b0004d1075feff9eb1d88ec002))
- correct '.vscode' file patterns in gitignore ([dd7dcb2](https://github.com/Nerdware-LLC/ddb-single-table/commit/dd7dcb20c17f4df250e1c5d070839554ac61e344))
- **prettier:** add missing 'plugins' key to config ([458e64d](https://github.com/Nerdware-LLC/ddb-single-table/commit/458e64dc22cac7266dcadad029b9cc0a384e49f6))
- rm old export ([9cbf213](https://github.com/Nerdware-LLC/ddb-single-table/commit/9cbf213616323e18400b5f760a5705c5586a56e6))
- rm types files that have been moved ([775f743](https://github.com/Nerdware-LLC/ddb-single-table/commit/775f743dc4e9daac4a3402480cc944c297b04458))
- update name of imported type used by isType utils ([f0672e4](https://github.com/Nerdware-LLC/ddb-single-table/commit/f0672e44b68793f8c91e1cc6d1b07a338028c3a5))
- update Table and Model export names ([b27b516](https://github.com/Nerdware-LLC/ddb-single-table/commit/b27b51628d8c23f75843c79453b00b1667c59a15))

### Features

- add handler for batch requests ([f94b1f5](https://github.com/Nerdware-LLC/ddb-single-table/commit/f94b1f55fc5d4a8b186c235ad2d9053fcbae5cb4))

### Performance Improvements

- streamline generic mapped types ([bad5ed6](https://github.com/Nerdware-LLC/ddb-single-table/commit/bad5ed6abd1d32894a8df9b49c7f7c8a6b87cea3))

## [1.2.0-next.1](https://github.com/Nerdware-LLC/ddb-single-table/compare/v1.1.0...v1.2.0-next.1) (2023-09-20)

### Bug Fixes

- correct '.vscode' file patterns in gitignore ([6b4008a](https://github.com/Nerdware-LLC/ddb-single-table/commit/6b4008af862ce6120aaadb850ed1d700bb7feca4))
- **prettier:** add missing 'plugins' key to config ([957245b](https://github.com/Nerdware-LLC/ddb-single-table/commit/957245bcf511c4ba839fd9913c7965408f5eabf2))
- rm old export ([e03e181](https://github.com/Nerdware-LLC/ddb-single-table/commit/e03e1813c37bc978125c293dd93b213b417d6e84))
- rm types files that have been moved ([b295c99](https://github.com/Nerdware-LLC/ddb-single-table/commit/b295c994175e935010b3c512467d0efc1310098b))
- update name of imported type used by isType utils ([55547fb](https://github.com/Nerdware-LLC/ddb-single-table/commit/55547fbcd6d031a60f0ec196aa7e385f20a3c508))
- update Table and Model export names ([2af75d3](https://github.com/Nerdware-LLC/ddb-single-table/commit/2af75d3f1f27b83f8ededddad2bac29c6691c989))

### Features

- add handler for batch requests ([96747c9](https://github.com/Nerdware-LLC/ddb-single-table/commit/96747c94b8f1cce1f4f358ae6232dcb3a968b229))

### Performance Improvements

- streamline generic mapped types ([5b8ef1f](https://github.com/Nerdware-LLC/ddb-single-table/commit/5b8ef1fe48335f2d7d8b1d2dd5258c48a76b404f))

## [1.1.0](https://github.com/Nerdware-LLC/ddb-single-table/compare/v1.0.0...v1.1.0) (2023-09-01)

### Bug Fixes

- add 'undefined' to banned types ([1e3c58f](https://github.com/Nerdware-LLC/ddb-single-table/commit/1e3c58fe5d0d772d1d75a6dd27df365762491038))
- correct isRecordObject logic, add jsdoc ([82f9359](https://github.com/Nerdware-LLC/ddb-single-table/commit/82f9359140f7074ad629785c57dc0b766a34ff6a))
- replace old gen-KCE arg type w WhereQueryParam ([edaea9d](https://github.com/Nerdware-LLC/ddb-single-table/commit/edaea9df8ce7cbfc687fa764767e6ba3928554a6))
- replace old gen-KCE fn with WhereQuery fn ([5625c81](https://github.com/Nerdware-LLC/ddb-single-table/commit/5625c81f529f476f54627b00aae293d5019cf69e))
- rm unused isDate import ([3e0b36e](https://github.com/Nerdware-LLC/ddb-single-table/commit/3e0b36eb3b70d431018744c8f4a85c7e24a33874))
- update Model to use new WhereQuery fn ([7d42a91](https://github.com/Nerdware-LLC/ddb-single-table/commit/7d42a91981edb1ccd74a3227286e74ee1b07d290))

### Features

- add DdbTableConfigs type ([ad98702](https://github.com/Nerdware-LLC/ddb-single-table/commit/ad987027abc15d71e18d57d6916b20165aabfbf8))
- add lodash.set package ([8dbcb50](https://github.com/Nerdware-LLC/ddb-single-table/commit/8dbcb506995f508c453c30770400ab2fdeea8052))
- add type DdbTableIndexes ([054dc7c](https://github.com/Nerdware-LLC/ddb-single-table/commit/054dc7cdb41c663c0ea73dfcfd6ac42383b8d263))
- impl new typings for wait-for-active and table-configs ([f009185](https://github.com/Nerdware-LLC/ddb-single-table/commit/f0091851e9cd6d16c9d05ad45fe496840ba24de5))

## [1.1.0-next.1](https://github.com/Nerdware-LLC/ddb-single-table/compare/v1.0.1-next.2...v1.1.0-next.1) (2023-09-01)

### Bug Fixes

- replace old gen-KCE arg type w WhereQueryParam ([edaea9d](https://github.com/Nerdware-LLC/ddb-single-table/commit/edaea9df8ce7cbfc687fa764767e6ba3928554a6))
- replace old gen-KCE fn with WhereQuery fn ([5625c81](https://github.com/Nerdware-LLC/ddb-single-table/commit/5625c81f529f476f54627b00aae293d5019cf69e))
- update Model to use new WhereQuery fn ([7d42a91](https://github.com/Nerdware-LLC/ddb-single-table/commit/7d42a91981edb1ccd74a3227286e74ee1b07d290))

### Features

- add DdbTableConfigs type ([ad98702](https://github.com/Nerdware-LLC/ddb-single-table/commit/ad987027abc15d71e18d57d6916b20165aabfbf8))
- add lodash.set package ([8dbcb50](https://github.com/Nerdware-LLC/ddb-single-table/commit/8dbcb506995f508c453c30770400ab2fdeea8052))
- add type DdbTableIndexes ([054dc7c](https://github.com/Nerdware-LLC/ddb-single-table/commit/054dc7cdb41c663c0ea73dfcfd6ac42383b8d263))
- impl new typings for wait-for-active and table-configs ([f009185](https://github.com/Nerdware-LLC/ddb-single-table/commit/f0091851e9cd6d16c9d05ad45fe496840ba24de5))

## [1.0.1-next.2](https://github.com/Nerdware-LLC/ddb-single-table/compare/v1.0.1-next.1...v1.0.1-next.2) (2023-08-28)

### Bug Fixes

- correct isRecordObject logic, add jsdoc ([82f9359](https://github.com/Nerdware-LLC/ddb-single-table/commit/82f9359140f7074ad629785c57dc0b766a34ff6a))
- rm unused isDate import ([3e0b36e](https://github.com/Nerdware-LLC/ddb-single-table/commit/3e0b36eb3b70d431018744c8f4a85c7e24a33874))

## [1.0.1-next.1](https://github.com/Nerdware-LLC/ddb-single-table/compare/v1.0.0...v1.0.1-next.1) (2023-08-28)

### Bug Fixes

- add 'undefined' to banned types ([1e3c58f](https://github.com/Nerdware-LLC/ddb-single-table/commit/1e3c58fe5d0d772d1d75a6dd27df365762491038))

## 1.0.0 (2023-08-27)

### Bug Fixes

- **ci:** rename release secret to not conflict w GH ([3d85abe](https://github.com/Nerdware-LLC/ddb-single-table/commit/3d85abe41d427210e1caa1c86764fad4eb06db7c))
- **ci:** set release to use GITHUB_TOKEN ([cd086a5](https://github.com/Nerdware-LLC/ddb-single-table/commit/cd086a56db6a01507e72d6f1df5e9f2264013fce))
- replace JSON.stringify w safeJsonStringify ([5c743ef](https://github.com/Nerdware-LLC/ddb-single-table/commit/5c743ef39a15c192ac03911ede4d4c736b34ac90))

### Features

- add fallback message to ensure it's always a string ([8ca5622](https://github.com/Nerdware-LLC/ddb-single-table/commit/8ca5622d04f0f5b215625b497c3938bbd7f7df7c))
- add util isConvertibleToDate ([2112deb](https://github.com/Nerdware-LLC/ddb-single-table/commit/2112deb86d5c628e4d22856ac3a293a364dd1210))
- init commit w setup and migrations from fixit-api ([69d1990](https://github.com/Nerdware-LLC/ddb-single-table/commit/69d19902fb6cfbf828192fa9613252e7024cd5e9))
