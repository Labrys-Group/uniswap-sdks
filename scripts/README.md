# Whitelabel Build Script

This directory contains scripts for building whitelabeled versions of the Uniswap SDKs with custom contract addresses.

## Overview

The `whitelabel-build.ts` script allows you to deploy Uniswap-compatible protocols on custom chains or testnets with different contract addresses by:

1. **Loading and validating** your custom configuration from `whitelabel-config.json`
2. **Building all SDK packages** using the standard build process
3. **Injecting custom contract addresses** into the SDK source files
4. **Rebuilding the packages** with the updated addresses
5. **Generating git diff text patches** showing the differences between original and modified builds

This is useful for:
- Deploying on custom EVM chains
- Testing with custom contract deployments
- Creating chain-specific SDK distributions

## Quick Start

### 1. Configure Your Addresses

Edit `whitelabel-config.json` at the repository root with your custom chain and contract addresses:

```json
{
  "$schema": "./whitelabel-config.schema.json",
  "chainId": 12345,
  "chainName": "My Custom Chain",
  "addresses": {
    "v2Factory": "0x...",
    "v2Router": "0x...",
    "v3CoreFactory": "0x...",
    "multicall": "0x...",
    "quoter": "0x...",
    "universalRouterV1_2": {
      "address": "0x...",
      "creationBlock": 12345
    },
    "universalRouterV2_0": {
      "address": "0x...",
      "creationBlock": 67890
    },
    "weth": "0x...",
    "permit2": "0x..."
  }
}
```

See the [Configuration Reference](#configuration-reference) below for all available fields.

### 2. Preview Changes (Dry Run)

Test the script without making any modifications:

```bash
yarn whitelabel:build --dry-run
```

This will show you what files would be modified without actually changing anything.

### 3. Run the Script

Execute the build with your custom addresses:

```bash
yarn whitelabel:build
```

The script will:
- Build the SDKs with original addresses
- Inject your custom addresses
- Rebuild with the new addresses
- Generate diff patches in `whitelabel-patches/`
- Ask if you want to restore the original files

## CLI Options

```bash
yarn whitelabel:build [options]
```

### Available Options

| Option | Description | Default |
|--------|-------------|---------|
| `--dry-run` | Preview changes without modifying files | `false` |
| `--config <path>` | Path to custom config file | `whitelabel-config.json` |
| `--output-dir <path>` | Directory for patch output | `whitelabel-patches` |
| `--quiet` | Suppress verbose output | `false` |
| `--help` | Show help message | - |

### Examples

```bash
# Preview changes
yarn whitelabel:build --dry-run

# Use custom config file
yarn whitelabel:build --config ./my-custom-config.json

# Save patches to a different directory
yarn whitelabel:build --output-dir ./my-patches

# Run quietly with custom config
yarn whitelabel:build --config ./test-config.json --quiet
```

## Configuration Reference

### Required Fields

All addresses must be valid Ethereum addresses (40 hex characters with `0x` prefix).

#### Basic Information
- **`chainId`** (number): Your custom chain ID (must be > 0)
- **`chainName`** (string): A friendly name for your chain

#### Contract Addresses

##### V2 Contracts (Required)
- **`v2Factory`** (string): Uniswap V2 Factory contract address
- **`v2Router`** (string): Uniswap V2 Router contract address

##### V3 Contracts (Required)
- **`v3CoreFactory`** (string): Uniswap V3 Core Factory contract address
- **`multicall`** (string): Multicall contract address
- **`quoter`** (string): V3 Quoter contract address

##### Universal Router (Required)
- **`universalRouterV1_2`** (object):
  - `address` (string): Universal Router V1.2 contract address
  - `creationBlock` (number): Block number when deployed
- **`universalRouterV2_0`** (object):
  - `address` (string): Universal Router V2.0 contract address
  - `creationBlock` (number): Block number when deployed

##### Core Infrastructure (Required)
- **`weth`** (string): Wrapped native token contract address (WETH/WMATIC/etc.)
- **`permit2`** (string): Permit2 contract address

##### V3 Optional Contracts
- **`nonfungiblePositionManager`** (string, optional): V3 Position Manager
- **`v3Migrator`** (string, optional): V3 Migrator contract
- **`swapRouter02`** (string, optional): Swap Router 02 contract
- **`tickLens`** (string, optional): Tick Lens contract
- **`mixedRouteQuoterV1`** (string, optional): Mixed Route Quoter V1

##### V4 Optional Contracts
- **`v4PoolManager`** (string, optional): V4 Pool Manager contract
- **`v4PositionManager`** (string, optional): V4 Position Manager contract
- **`v4StateView`** (string, optional): V4 State View contract
- **`v4Quoter`** (string, optional): V4 Quoter contract

### Configuration Example

```json
{
  "$schema": "./whitelabel-config.schema.json",
  "chainId": 99999,
  "chainName": "My Testnet",
  "addresses": {
    "v2Factory": "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f",
    "v2Router": "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
    "v3CoreFactory": "0x1F98431c8aD98523631AE4a59f267346ea31F984",
    "multicall": "0x1F98415757620B543A52E61c46B32eB19261F984",
    "quoter": "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6",
    "nonfungiblePositionManager": "0xC36442b4a4522E871399CD717aBDD847Ab11FE88",
    "v3Migrator": "0xA5644E29708357803b5A882D272c41cC0dF92B34",
    "swapRouter02": "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
    "tickLens": "0xbfd8137f7d1516D3ea5cA83523914859ec47F573",
    "mixedRouteQuoterV1": "0x84E44095eeBfEC7793Cd7d5b57B7e401D7f1cA2E",
    "universalRouterV1_2": {
      "address": "0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD",
      "creationBlock": 17143817
    },
    "universalRouterV2_0": {
      "address": "0x66a9893cc07d91d95644aedd05d03f95e1dba8af",
      "creationBlock": 21234567
    },
    "weth": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    "permit2": "0x000000000022D473030F116dDEE9F6B43aC78BA3",
    "v4PoolManager": "0x000000000004444c5dc75cB358380D2e3dE08A90",
    "v4PositionManager": "0xbd216513d74c8cf14cf4747e6aaa6420ff64ee9e",
    "v4StateView": "0x7ffe42c4a5deea5b0fec41c94c136cf115597227",
    "v4Quoter": "0x52f0e24d1c21c8a0cb1e5a5dd6198556bd9e1203"
  }
}
```

## How It Works

### Step-by-Step Process

1. **Configuration Loading**
   - Reads `whitelabel-config.json`
   - Validates all required fields
   - Checks address formats and types

2. **Initial Build**
   - Runs `yarn g:build` to build all SDKs with original addresses
   - Creates backup copies of files to be modified

3. **Address Injection**
   - **sdk-core**: Adds custom chain ID and addresses to:
     - `sdks/sdk-core/src/chains.ts` - ChainId enum
     - `sdks/sdk-core/src/addresses.ts` - Address maps
   - **universal-router-sdk**: Updates:
     - `sdks/universal-router-sdk/src/utils/constants.ts` - Router configs
   - **permit2-sdk**: Modifies:
     - `sdks/permit2-sdk/src/constants.ts` - Permit2 address function

4. **Rebuild**
   - Runs `yarn g:build` again with modified source files
   - Generates new build artifacts with custom addresses

5. **Patch Generation**
   - Creates git diffs for all modified files
   - Saves patches to `whitelabel-patches/` directory
   - Each patch file shows the exact changes made

6. **File Restoration**
   - Prompts to restore original files (recommended)
   - Patches are preserved for review and reapplication
   - Backup files are automatically cleaned up

### Modified Files

The script modifies the following source files:

- `sdks/sdk-core/src/chains.ts`
- `sdks/sdk-core/src/addresses.ts`
- `sdks/universal-router-sdk/src/utils/constants.ts`
- `sdks/permit2-sdk/src/constants.ts`

All modifications are tracked and reversible via the backup system.

## Error Handling

The script includes comprehensive error handling:

### Configuration Errors
- **Invalid JSON**: Clear error message pointing to the syntax issue
- **Missing required fields**: Lists all missing fields
- **Invalid addresses**: Shows which address is malformed
- **Invalid chain ID**: Must be a positive number

### Build Errors
- **Failed builds**: Shows the exact command that failed
- **Missing files**: Reports which expected file wasn't found
- **Regex failures**: Indicates if source file structure changed

### Recovery
- On any error, the script automatically restores original files
- Backup files are cleaned up on successful completion
- Manual recovery: `.backup` files are created alongside originals

## Output

### Console Output

During execution, you'll see:
```
=== Whitelabel Build Script ===

[whitelabel-build] Loading config from: whitelabel-config.json
[whitelabel-build] Config validation passed
[whitelabel-build] Loaded config for chain: My Custom Chain (ID: 12345)
[whitelabel-build] Running initial build of SDK packages...
[whitelabel-build] Adding custom ChainId to sdk-core...
[whitelabel-build] Modified sdk-core addresses
[whitelabel-build] Modified universal-router-sdk constants
[whitelabel-build] Modified permit2-sdk constants
[whitelabel-build] Rebuilding SDK packages with custom addresses...
[whitelabel-build] Generating git diff patches...
[whitelabel-build] Generated patch: sdks_sdk-core_src_chains.patch
[whitelabel-build] Generated patch: sdks_sdk-core_src_addresses.patch

[SUCCESS] Diff patches saved to: whitelabel-patches
```

### Generated Patches

Patch files in `whitelabel-patches/` contain git-style diffs:

```diff
--- a/sdks/sdk-core/src/chains.ts
+++ b/sdks/sdk-core/src/chains.ts
@@ -45,6 +45,7 @@ export enum ChainId {
   MONAD_TESTNET = 10143,
   SONEIUM = 1868,
   MONAD = 143,
+  MY_CUSTOM_CHAIN = 12345,
 }
```

These patches can be:
- Reviewed to verify changes
- Applied to other repositories
- Committed for version control
- Used for documentation

## Troubleshooting

### Common Issues

**Q: The script fails with "Could not find ChainId enum"**
- The SDK source structure may have changed
- Check if `sdks/sdk-core/src/chains.ts` exists
- Verify the file contains `export enum ChainId`

**Q: Address validation fails**
- Ensure all addresses start with `0x`
- Addresses must be exactly 40 hex characters (plus `0x`)
- Check for typos or missing characters

**Q: Build fails during execution**
- Run `yarn install` first to ensure dependencies
- Try `yarn g:build` manually to debug
- Check that you're in the repository root

**Q: Patches aren't being generated**
- Make sure you're in a git repository
- Check that files were actually modified
- Verify the output directory exists and is writable

### Getting Help

For issues or questions:
1. Run with `--dry-run` to preview changes
2. Check the git status for unexpected modifications
3. Review generated patches for correctness
4. Restore original files if needed (`.backup` files)

## Advanced Usage

### Multiple Configurations

Maintain different configs for different chains:

```bash
# Testnet config
yarn whitelabel:build --config configs/testnet.json --output-dir patches/testnet

# Mainnet config
yarn whitelabel:build --config configs/mainnet.json --output-dir patches/mainnet
```

### Applying Patches

After generating patches, you can apply them to other repositories:

```bash
cd /path/to/other/repo
git apply /path/to/uniswap-sdks/whitelabel-patches/sdks_sdk-core_src_addresses.patch
```

### Automated Workflows

Integrate into CI/CD:

```bash
#!/bin/bash
set -e

# Generate patches
yarn whitelabel:build --config production.json --output-dir ./dist/patches

# Build distributable packages
yarn g:build

# Archive for distribution
tar -czf whitelabel-sdk.tar.gz dist/
```

### Keeping Changes

To keep the modified files instead of restoring:

1. Run the script
2. When prompted "Restore original files? (y/N):", enter `N`
3. The modified files will remain in place
4. Patches are still generated for reference

## Schema Validation

The configuration is validated against `whitelabel-config.schema.json`, which provides:
- Type checking for all fields
- Format validation for addresses
- Required field enforcement
- IDE autocomplete support (in VS Code, etc.)

Reference the schema in your config:
```json
{
  "$schema": "./whitelabel-config.schema.json",
  ...
}
```

## Best Practices

1. **Always dry-run first**: Use `--dry-run` to preview changes
2. **Version control patches**: Commit generated patches for audit trail
3. **Test builds**: Verify SDK functionality after whitelabeling
4. **Document deployments**: Note which config was used for each deployment
5. **Validate addresses**: Double-check all addresses before running
6. **Keep backups**: Save original SDK distributions separately
7. **Review patches**: Examine diffs to ensure correctness

## License

This script is part of the Uniswap SDKs repository and follows the same MIT license.
