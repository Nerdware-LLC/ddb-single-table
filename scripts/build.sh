#!/usr/bin/env bash
############################################################
# This script creates the ESM and CJS builds of the package.

# Make the ESM build
npx tsc --project tsconfig.build-esm.json
echo '{ "type": "module" }' > dist/esm/package.json

# Make the CJS build
npx tsc --project tsconfig.build-cjs.json
echo '{ "type": "commonjs" }' > dist/cjs/package.json

############################################################
