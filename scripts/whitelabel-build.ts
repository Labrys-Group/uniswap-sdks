#!/usr/bin/env node

/**
 * Whitelabel Build Script
 *
 * Generates patches for whitelabel SDK builds by:
 * 1. Loading custom chain configuration
 * 2. Building SDKs and snapshotting dist directories
 * 3. Modifying SDK source files with custom addresses
 * 4. Rebuilding SDKs with modifications
 * 5. Generating patches showing the differences
 *
 * Usage: yarn whitelabel:build [--dry-run] [--config <path>] [--output-dir <path>]
 */

import { parseCliArgs } from "./modules/cli";
import { loadConfig } from "./modules/config";
import { log, success } from "./modules/logger";
import {
  runInitialBuild,
  snapshotDistDirectories,
  cleanupSnapshots,
  runRebuild,
} from "./modules/build-manager";
import {
  addChainIdToSdkCore,
  modifySdkCoreAddresses,
  modifyUniversalRouterConstants,
  modifyPermit2Constants,
} from "./modules/sdk-modifiers";
import {
  generateDiffPatches,
  generateSourcePatches,
} from "./modules/patch-generator";
import { restoreAllFiles } from "./modules/file-utils";

/**
 * Main execution function
 */
async function main() {
  console.log("\n=== Whitelabel Build Script ===\n");

  const options = parseCliArgs();

  if (options.dryRun) {
    console.log("[DRY RUN MODE] No files will be modified\n");
  }

  try {
    // Step 1: Load and validate config
    const config = loadConfig(options.configPath);
    log(`Loaded config for chain: ${config.chainName} (ID: ${config.chainId})`);

    // Step 2: Run initial build
    if (!options.dryRun) {
      runInitialBuild(options.verbose);
    } else {
      log("[DRY RUN] Skipping initial build");
    }

    // Step 3: Snapshot dist directories (baseline before modifications)
    snapshotDistDirectories(options.dryRun);

    // Step 4: Inject custom addresses into SDK source files
    addChainIdToSdkCore(config, options.dryRun);
    modifySdkCoreAddresses(config, options.dryRun);
    modifyUniversalRouterConstants(config, options.dryRun);
    modifyPermit2Constants(config, options.dryRun);

    // Step 5: Rebuild with custom addresses
    if (!options.dryRun) {
      runRebuild(options.verbose);
    } else {
      log("[DRY RUN] Skipping rebuild");
    }

    // Step 6: Generate diff patches (comparing snapshots vs rebuilt dist)
    generateDiffPatches(options.outputDir, options.dryRun);

    // Step 7: Generate source file patches (comparing backups vs modified source)
    if (options.includeSourcePatch) {
      generateSourcePatches(options.outputDir, options.dryRun);
    }

    // Step 8: Clean up snapshots
    if (!options.dryRun) {
      cleanupSnapshots();
    }

    // Step 9: Restore original files (optional - ask user)
    if (!options.dryRun) {
      const readline = require("readline").createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      readline.question(
        "\nRestore original files? (y/N): ",
        (answer: string) => {
          if (answer.toLowerCase() === "y") {
            restoreAllFiles();
            success(
              "Files restored. Patches are available in " + options.outputDir
            );
          } else {
            success(
              "Done! Modified files kept. Patches available in " +
                options.outputDir
            );
          }
          readline.close();
          process.exit(0);
        }
      );
    } else {
      success("Dry run completed - no changes made");
    }
  } catch (err: any) {
    console.error(err);

    // Attempt to restore files and clean up on error
    if (!options.dryRun) {
      try {
        restoreAllFiles();
      } catch (restoreErr) {
        console.error("Failed to restore files:", restoreErr);
      }

      try {
        cleanupSnapshots();
      } catch (cleanupErr) {
        console.error("Failed to cleanup snapshots:", cleanupErr);
      }
    }

    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}
