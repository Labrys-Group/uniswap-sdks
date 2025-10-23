/**
 * Logging utilities for whitelabel build system
 */

export function log(message: string, verbose: boolean = true): void {
  if (verbose) {
    console.log(`[whitelabel-build] ${message}`)
  }
}

export function error(message: string): never {
  console.error(`\n[ERROR] ${message}\n`)
  process.exit(1)
}

export function success(message: string): void {
  console.log(`\n[SUCCESS] ${message}\n`)
}
