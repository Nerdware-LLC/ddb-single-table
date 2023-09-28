# Changelog

All notable changes to this project will be documented in this file.

---

# [2.0.0-next.1](https://github.com/Nerdware-LLC/ddb-single-table/compare/v1.3.1...v2.0.0-next.1) (2023-09-28)


### Bug Fixes

* change TKSchema type param to not conflict w class ([28b8000](https://github.com/Nerdware-LLC/ddb-single-table/commit/28b80009360258c1d546972d67acf8b2495368ae))
* ensure isNumber works for all DDB number types ([46cdc01](https://github.com/Nerdware-LLC/ddb-single-table/commit/46cdc0162c4bad6448c5bf78ff57ca5a0de4612c))
* have Input extend 'object' for DDB types w/o index sig ([afef500](https://github.com/Nerdware-LLC/ddb-single-table/commit/afef5005bf9ea9d53835c643ae2f8ef2278b39c8))
* impl new import path for Schema types ([a73e60d](https://github.com/Nerdware-LLC/ddb-single-table/commit/a73e60dbe7cbfc06b0f9093f060de3a8a6d65682))
* impl new import path for Schema types ([5c4a2db](https://github.com/Nerdware-LLC/ddb-single-table/commit/5c4a2dbbeb9d1ff8f8f9c13cc58cde66c8fafb94))
* rm export of mv'd schemaTypes ([e835266](https://github.com/Nerdware-LLC/ddb-single-table/commit/e835266f111c8663d1b697e2851472af67fe073a))
* update Schema types import path ([5d73365](https://github.com/Nerdware-LLC/ddb-single-table/commit/5d733654ecc02e8937ed85dc666d782de13ecbde))


### Code Refactoring

* ensure Model ItemType doesn't cause tsc OOM issue ([a8b8d93](https://github.com/Nerdware-LLC/ddb-single-table/commit/a8b8d93ef7cab4266a6f49ab68f19d1f32cd545a))


### Features

* add base Schema class, mv shared validation here ([77bb180](https://github.com/Nerdware-LLC/ddb-single-table/commit/77bb18036f9a6fc64d7b8967ece6dd23c2f6951a))
* add BatchOperationParams ([f45df6e](https://github.com/Nerdware-LLC/ddb-single-table/commit/f45df6e8adf1cb1fc02c32b59869d7a630574a93))
* add index file for Schema exports ([128cb9e](https://github.com/Nerdware-LLC/ddb-single-table/commit/128cb9e90fb1217221de885f4d5ed8f6c1bba971))
* add ModelSchema class, mv validation here ([5273f5c](https://github.com/Nerdware-LLC/ddb-single-table/commit/5273f5c086c51f1d8107210b16fe7bb5e7c22f59))
* add TableKeysAndIndexes, update Table types ([b14f648](https://github.com/Nerdware-LLC/ddb-single-table/commit/b14f648538f6146649b00b9c98637ee8b95c2d91))
* add TK Schema class, mv validation here ([0b10623](https://github.com/Nerdware-LLC/ddb-single-table/commit/0b106230ea6271a9799225c94d5919d5643f1d4c))
* add usage of unified 'aliasesMap' ctx param ([113bb29](https://github.com/Nerdware-LLC/ddb-single-table/commit/113bb295b215f9820cf4488c82ca71395d8d409f))


### Performance Improvements

* replace mapped ItemParams w BaseItem ([f182c73](https://github.com/Nerdware-LLC/ddb-single-table/commit/f182c738397aff19b66acf2544cf623a41660ff4))


### BREAKING CHANGES

* Model API has been changed to fix tsc OOM issue.

## [1.3.1](https://github.com/Nerdware-LLC/ddb-single-table/compare/v1.3.0...v1.3.1) (2023-09-22)

# [1.3.0](https://github.com/Nerdware-LLC/ddb-single-table/compare/v1.2.0...v1.3.0) (2023-09-22)


### Bug Fixes

* correct '.vscode' file patterns in gitignore ([6b4008a](https://github.com/Nerdware-LLC/ddb-single-table/commit/6b4008af862ce6120aaadb850ed1d700bb7feca4))
* correct import path for ModelSchemaType ([5c886da](https://github.com/Nerdware-LLC/ddb-single-table/commit/5c886da44300b6fdbc88983686dd709f37945ccc))
* **prettier:** add missing 'plugins' key to config ([957245b](https://github.com/Nerdware-LLC/ddb-single-table/commit/957245bcf511c4ba839fd9913c7965408f5eabf2))
* rm extraneous import ([48aa92d](https://github.com/Nerdware-LLC/ddb-single-table/commit/48aa92d98abe37fc550ac7f5915127e279210287))
* rm extraneous import ([5e8dcf2](https://github.com/Nerdware-LLC/ddb-single-table/commit/5e8dcf2552e4c237bc69533e4e98068a1c94cee4))
* rm old export ([e03e181](https://github.com/Nerdware-LLC/ddb-single-table/commit/e03e1813c37bc978125c293dd93b213b417d6e84))
* rm types files that have been moved ([b295c99](https://github.com/Nerdware-LLC/ddb-single-table/commit/b295c994175e935010b3c512467d0efc1310098b))
* update name of imported type used by isType utils ([55547fb](https://github.com/Nerdware-LLC/ddb-single-table/commit/55547fbcd6d031a60f0ec196aa7e385f20a3c508))
* update Table and Model export names ([2af75d3](https://github.com/Nerdware-LLC/ddb-single-table/commit/2af75d3f1f27b83f8ededddad2bac29c6691c989))


### Features

* add handler for batch requests ([96747c9](https://github.com/Nerdware-LLC/ddb-single-table/commit/96747c94b8f1cce1f4f358ae6232dcb3a968b229))


### Performance Improvements

* streamline generic mapped types ([5b8ef1f](https://github.com/Nerdware-LLC/ddb-single-table/commit/5b8ef1fe48335f2d7d8b1d2dd5258c48a76b404f))


### Reverts

* use old '.vscode' gitignore pattern ([8d7af84](https://github.com/Nerdware-LLC/ddb-single-table/commit/8d7af8424ffdd9b0004d1075feff9eb1d88ec002))

# [1.2.0-next.2](https://github.com/Nerdware-LLC/ddb-single-table/compare/v1.2.0-next.1...v1.2.0-next.2) (2023-09-20)


### Bug Fixes

* correct import path for ModelSchemaType ([5c886da](https://github.com/Nerdware-LLC/ddb-single-table/commit/5c886da44300b6fdbc88983686dd709f37945ccc))
* rm extraneous import ([48aa92d](https://github.com/Nerdware-LLC/ddb-single-table/commit/48aa92d98abe37fc550ac7f5915127e279210287))
* rm extraneous import ([5e8dcf2](https://github.com/Nerdware-LLC/ddb-single-table/commit/5e8dcf2552e4c237bc69533e4e98068a1c94cee4))


### Reverts

* use old '.vscode' gitignore pattern ([8d7af84](https://github.com/Nerdware-LLC/ddb-single-table/commit/8d7af8424ffdd9b0004d1075feff9eb1d88ec002))
=======
* correct '.vscode' file patterns in gitignore ([dd7dcb2](https://github.com/Nerdware-LLC/ddb-single-table/commit/dd7dcb20c17f4df250e1c5d070839554ac61e344))
* **prettier:** add missing 'plugins' key to config ([458e64d](https://github.com/Nerdware-LLC/ddb-single-table/commit/458e64dc22cac7266dcadad029b9cc0a384e49f6))
* rm old export ([9cbf213](https://github.com/Nerdware-LLC/ddb-single-table/commit/9cbf213616323e18400b5f760a5705c5586a56e6))
* rm types files that have been moved ([775f743](https://github.com/Nerdware-LLC/ddb-single-table/commit/775f743dc4e9daac4a3402480cc944c297b04458))
* update name of imported type used by isType utils ([f0672e4](https://github.com/Nerdware-LLC/ddb-single-table/commit/f0672e44b68793f8c91e1cc6d1b07a338028c3a5))
* update Table and Model export names ([b27b516](https://github.com/Nerdware-LLC/ddb-single-table/commit/b27b51628d8c23f75843c79453b00b1667c59a15))


### Features

* add handler for batch requests ([f94b1f5](https://github.com/Nerdware-LLC/ddb-single-table/commit/f94b1f55fc5d4a8b186c235ad2d9053fcbae5cb4))


### Performance Improvements

* streamline generic mapped types ([bad5ed6](https://github.com/Nerdware-LLC/ddb-single-table/commit/bad5ed6abd1d32894a8df9b49c7f7c8a6b87cea3))


# [1.2.0-next.1](https://github.com/Nerdware-LLC/ddb-single-table/compare/v1.1.0...v1.2.0-next.1) (2023-09-20)


### Bug Fixes

* correct '.vscode' file patterns in gitignore ([6b4008a](https://github.com/Nerdware-LLC/ddb-single-table/commit/6b4008af862ce6120aaadb850ed1d700bb7feca4))
* **prettier:** add missing 'plugins' key to config ([957245b](https://github.com/Nerdware-LLC/ddb-single-table/commit/957245bcf511c4ba839fd9913c7965408f5eabf2))
* rm old export ([e03e181](https://github.com/Nerdware-LLC/ddb-single-table/commit/e03e1813c37bc978125c293dd93b213b417d6e84))
* rm types files that have been moved ([b295c99](https://github.com/Nerdware-LLC/ddb-single-table/commit/b295c994175e935010b3c512467d0efc1310098b))
* update name of imported type used by isType utils ([55547fb](https://github.com/Nerdware-LLC/ddb-single-table/commit/55547fbcd6d031a60f0ec196aa7e385f20a3c508))
* update Table and Model export names ([2af75d3](https://github.com/Nerdware-LLC/ddb-single-table/commit/2af75d3f1f27b83f8ededddad2bac29c6691c989))


### Features

* add handler for batch requests ([96747c9](https://github.com/Nerdware-LLC/ddb-single-table/commit/96747c94b8f1cce1f4f358ae6232dcb3a968b229))


### Performance Improvements

* streamline generic mapped types ([5b8ef1f](https://github.com/Nerdware-LLC/ddb-single-table/commit/5b8ef1fe48335f2d7d8b1d2dd5258c48a76b404f))

# [1.1.0](https://github.com/Nerdware-LLC/ddb-single-table/compare/v1.0.0...v1.1.0) (2023-09-01)


### Bug Fixes

* add 'undefined' to banned types ([1e3c58f](https://github.com/Nerdware-LLC/ddb-single-table/commit/1e3c58fe5d0d772d1d75a6dd27df365762491038))
* correct isRecordObject logic, add jsdoc ([82f9359](https://github.com/Nerdware-LLC/ddb-single-table/commit/82f9359140f7074ad629785c57dc0b766a34ff6a))
* replace old gen-KCE arg type w WhereQueryParam ([edaea9d](https://github.com/Nerdware-LLC/ddb-single-table/commit/edaea9df8ce7cbfc687fa764767e6ba3928554a6))
* replace old gen-KCE fn with WhereQuery fn ([5625c81](https://github.com/Nerdware-LLC/ddb-single-table/commit/5625c81f529f476f54627b00aae293d5019cf69e))
* rm unused isDate import ([3e0b36e](https://github.com/Nerdware-LLC/ddb-single-table/commit/3e0b36eb3b70d431018744c8f4a85c7e24a33874))
* update Model to use new WhereQuery fn ([7d42a91](https://github.com/Nerdware-LLC/ddb-single-table/commit/7d42a91981edb1ccd74a3227286e74ee1b07d290))


### Features

* add DdbTableConfigs type ([ad98702](https://github.com/Nerdware-LLC/ddb-single-table/commit/ad987027abc15d71e18d57d6916b20165aabfbf8))
* add lodash.set package ([8dbcb50](https://github.com/Nerdware-LLC/ddb-single-table/commit/8dbcb506995f508c453c30770400ab2fdeea8052))
* add type DdbTableIndexes ([054dc7c](https://github.com/Nerdware-LLC/ddb-single-table/commit/054dc7cdb41c663c0ea73dfcfd6ac42383b8d263))
* impl new typings for wait-for-active and table-configs ([f009185](https://github.com/Nerdware-LLC/ddb-single-table/commit/f0091851e9cd6d16c9d05ad45fe496840ba24de5))

# [1.1.0-next.1](https://github.com/Nerdware-LLC/ddb-single-table/compare/v1.0.1-next.2...v1.1.0-next.1) (2023-09-01)


### Bug Fixes

* replace old gen-KCE arg type w WhereQueryParam ([edaea9d](https://github.com/Nerdware-LLC/ddb-single-table/commit/edaea9df8ce7cbfc687fa764767e6ba3928554a6))
* replace old gen-KCE fn with WhereQuery fn ([5625c81](https://github.com/Nerdware-LLC/ddb-single-table/commit/5625c81f529f476f54627b00aae293d5019cf69e))
* update Model to use new WhereQuery fn ([7d42a91](https://github.com/Nerdware-LLC/ddb-single-table/commit/7d42a91981edb1ccd74a3227286e74ee1b07d290))


### Features

* add DdbTableConfigs type ([ad98702](https://github.com/Nerdware-LLC/ddb-single-table/commit/ad987027abc15d71e18d57d6916b20165aabfbf8))
* add lodash.set package ([8dbcb50](https://github.com/Nerdware-LLC/ddb-single-table/commit/8dbcb506995f508c453c30770400ab2fdeea8052))
* add type DdbTableIndexes ([054dc7c](https://github.com/Nerdware-LLC/ddb-single-table/commit/054dc7cdb41c663c0ea73dfcfd6ac42383b8d263))
* impl new typings for wait-for-active and table-configs ([f009185](https://github.com/Nerdware-LLC/ddb-single-table/commit/f0091851e9cd6d16c9d05ad45fe496840ba24de5))

## [1.0.1-next.2](https://github.com/Nerdware-LLC/ddb-single-table/compare/v1.0.1-next.1...v1.0.1-next.2) (2023-08-28)


### Bug Fixes

* correct isRecordObject logic, add jsdoc ([82f9359](https://github.com/Nerdware-LLC/ddb-single-table/commit/82f9359140f7074ad629785c57dc0b766a34ff6a))
* rm unused isDate import ([3e0b36e](https://github.com/Nerdware-LLC/ddb-single-table/commit/3e0b36eb3b70d431018744c8f4a85c7e24a33874))

## [1.0.1-next.1](https://github.com/Nerdware-LLC/ddb-single-table/compare/v1.0.0...v1.0.1-next.1) (2023-08-28)


### Bug Fixes

* add 'undefined' to banned types ([1e3c58f](https://github.com/Nerdware-LLC/ddb-single-table/commit/1e3c58fe5d0d772d1d75a6dd27df365762491038))

# 1.0.0 (2023-08-27)


### Bug Fixes

* **ci:** rename release secret to not conflict w GH ([3d85abe](https://github.com/Nerdware-LLC/ddb-single-table/commit/3d85abe41d427210e1caa1c86764fad4eb06db7c))
* **ci:** set release to use GITHUB_TOKEN ([cd086a5](https://github.com/Nerdware-LLC/ddb-single-table/commit/cd086a56db6a01507e72d6f1df5e9f2264013fce))
* replace JSON.stringify w safeJsonStringify ([5c743ef](https://github.com/Nerdware-LLC/ddb-single-table/commit/5c743ef39a15c192ac03911ede4d4c736b34ac90))


### Features

* add fallback message to ensure it's always a string ([8ca5622](https://github.com/Nerdware-LLC/ddb-single-table/commit/8ca5622d04f0f5b215625b497c3938bbd7f7df7c))
* add util isConvertibleToDate ([2112deb](https://github.com/Nerdware-LLC/ddb-single-table/commit/2112deb86d5c628e4d22856ac3a293a364dd1210))
* init commit w setup and migrations from fixit-api ([69d1990](https://github.com/Nerdware-LLC/ddb-single-table/commit/69d19902fb6cfbf828192fa9613252e7024cd5e9))
