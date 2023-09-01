# Changelog

All notable changes to this project will be documented in this file.

---

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
