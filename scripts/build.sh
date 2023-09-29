#!/usr/bin/env bash
############################################################
# This script creates the ESM and CJS builds of the package.

# First, ensure this script was run from repo root
if [ ! -f "./scripts/build.sh" ]; then
  echo "Please run this script from the repo root."
  exit 1
fi

# Remove ./dist if it exists to ensure a clean build
[ -d "./dist" ] && rm -rf ./dist

# Make the ESM build
npx tsc --project tsconfig.build-esm.json
echo '{ "type": "module" }' > dist/esm/package.json

# Make the CJS build
npx tsc --project tsconfig.build-cjs.json
echo '{ "type": "commonjs" }' > dist/cjs/package.json

############################################################
