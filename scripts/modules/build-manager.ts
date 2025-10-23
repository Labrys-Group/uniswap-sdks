/**
 * Build and snapshot management for whitelabel build system
 */

import * as fs from "fs";
import * as path from "path";
import { log, success } from "./logger";
import { runCommand } from "./command-runner";
import { ROOT_DIR, SNAPSHOT_DIR, SDK_PACKAGES_TO_SNAPSHOT } from "./constants";

/**
 * Runs the initial build of all SDK packages
 */
export function runInitialBuild(verbose: boolean): void {
  log("Running initial build of SDK packages...");
  runCommand("yarn g:build --force", { verbose });
  success("Initial build completed");
}

/**
 * Creates snapshots of dist directories before modifications
 */
export function snapshotDistDirectories(dryRun: boolean): void {
  log("Creating snapshots of dist directories...");

  if (dryRun) {
    log("[DRY RUN] Would snapshot dist directories");
    return;
  }

  // Clean up any existing snapshot directory
  if (fs.existsSync(SNAPSHOT_DIR)) {
    fs.rmSync(SNAPSHOT_DIR, { recursive: true, force: true });
  }

  fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });

  for (const pkg of SDK_PACKAGES_TO_SNAPSHOT) {
    const distPath = path.join(ROOT_DIR, "sdks", pkg, "dist");
    const snapshotPath = path.join(SNAPSHOT_DIR, pkg);

    log(`DEBUG: ${snapshotPath}`);

    if (!fs.existsSync(distPath)) {
      log(`Warning: dist directory not found for ${pkg}, skipping snapshot`);
      continue;
    }

    // Recursively copy dist directory
    fs.cpSync(distPath, snapshotPath, { recursive: true });
    log(`Snapshotted: ${pkg}/dist`);
  }

  log("Dist snapshots created");
}

/**
 * Removes all snapshot directories
 */
export function cleanupSnapshots(): void {
  log("Cleaning up snapshot directories...");

  if (fs.existsSync(SNAPSHOT_DIR)) {
    fs.rmSync(SNAPSHOT_DIR, { recursive: true, force: true });
    log("Snapshots removed");
  }
}

/**
 * Rebuilds SDK packages after modifications
 */
export function runRebuild(verbose: boolean): void {
  log("Rebuilding SDK packages with custom addresses...");
  runCommand("yarn g:build --force", { verbose });
  success("Rebuild completed");
}
