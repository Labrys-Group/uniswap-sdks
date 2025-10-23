/**
 * Constants used throughout the whitelabel build system
 */

import * as path from "path";

export const ROOT_DIR = path.resolve(__dirname, "..", "..");

export const SDK_CORE_ADDRESSES_PATH = path.join(
  ROOT_DIR,
  "sdks/sdk-core/src/addresses.ts"
);
export const SDK_CORE_CHAINS_PATH = path.join(
  ROOT_DIR,
  "sdks/sdk-core/src/chains.ts"
);
export const UNIVERSAL_ROUTER_CONSTANTS_PATH = path.join(
  ROOT_DIR,
  "sdks/universal-router-sdk/src/utils/constants.ts"
);
export const PERMIT2_CONSTANTS_PATH = path.join(
  ROOT_DIR,
  "sdks/permit2-sdk/src/constants.ts"
);

export const SNAPSHOT_DIR = path.join(ROOT_DIR, "whitelabel-snapshot");

export const SDK_PACKAGES_TO_SNAPSHOT = [
  "sdk-core",
  "universal-router-sdk",
  "permit2-sdk",
] as const;
