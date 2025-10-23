/**
 * Command execution utilities for whitelabel build system
 */

import { execSync } from 'child_process'
import { log, error } from './logger'
import { ROOT_DIR } from './constants'

export interface RunCommandOptions {
  verbose?: boolean
  cwd?: string
}

/**
 * Executes a shell command with error handling
 */
export function runCommand(command: string, options: RunCommandOptions = {}): string {
  const { verbose = true, cwd = ROOT_DIR } = options

  if (verbose) {
    log(`Running: ${command}`)
  }

  try {
    return execSync(command, {
      cwd,
      encoding: 'utf-8',
      stdio: verbose ? 'inherit' : 'pipe'
    }) as string
  } catch (err: any) {
    error(`Command failed: ${command}\n${err.message}`)
  }
}
