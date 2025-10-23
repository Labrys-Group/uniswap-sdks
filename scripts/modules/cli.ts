/**
 * CLI argument parsing for whitelabel build system
 */

import * as path from "path";
import { CliOptions } from "./types";
import { ROOT_DIR } from "./constants";
import { error } from "./logger";

/**
 * Parses command-line arguments and returns CLI options
 */
export function parseCliArgs(): CliOptions {
  const args = process.argv.slice(2);
  const options: CliOptions = {
    includeSourcePatch: false,
    dryRun: false,
    configPath: path.join(ROOT_DIR, "whitelabel-config.json"),
    outputDir: path.join(ROOT_DIR, "whitelabel-patches"),
    verbose: true,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case "--dry-run":
        options.dryRun = true;
        break;
      case "--config":
        options.configPath = path.resolve(args[++i]);
        break;
      case "--output-dir":
        options.outputDir = path.resolve(args[++i]);
        break;
      case "--quiet":
        options.verbose = false;
        break;
      case "--source-patch":
        options.includeSourcePatch = true;
        break;
      case "--help":
        printHelp();
        process.exit(0);
      default:
        error(`Unknown option: ${arg}`);
    }
  }

  return options;
}

/**
 * Prints help text to console
 */
function printHelp(): void {
  console.log(`
Whitelabel Build Script
=======================

Usage: yarn whitelabel:build [options]

Options:
  --dry-run              Preview changes without modifying files
  --config <path>        Custom config file path (default: whitelabel-config.json)
  --output-dir <path>    Output directory for patches (default: whitelabel-patches)
  --source-patch         Generate patches for source files in addition to dist
  --quiet                Suppress verbose output
  --help                 Show this help message

Example:
  yarn whitelabel:build --dry-run
  yarn whitelabel:build --config my-config.json --output-dir ./patches
  yarn whitelabel:build --source-patch
`);
}
