import { allCustomMatcher } from "aws-sdk-client-mock-vitest";
import { expect } from "vitest";

// See https://www.npmjs.com/package/aws-sdk-client-mock-vitest
expect.extend(allCustomMatcher);
