/**
 * File manipulation utilities for whitelabel build system
 */

import * as fs from 'fs'
import { log } from './logger'
import {
  SDK_CORE_ADDRESSES_PATH,
  SDK_CORE_CHAINS_PATH,
  UNIVERSAL_ROUTER_CONSTANTS_PATH,
  PERMIT2_CONSTANTS_PATH
} from './constants'

/**
 * Creates a backup of a file by copying it to {file}.backup
 */
export function backupFile(filePath: string): string {
  const backupPath = `${filePath}.backup`
  fs.copyFileSync(filePath, backupPath)
  return backupPath
}

/**
 * Restores a file from its backup and deletes the backup
 */
export function restoreFile(filePath: string): void {
  const backupPath = `${filePath}.backup`
  if (fs.existsSync(backupPath)) {
    fs.copyFileSync(backupPath, filePath)
    fs.unlinkSync(backupPath)
  }
}

/**
 * Restores all modified files from their backups
 */
export function restoreAllFiles(): void {
  log('Restoring original files...')

  const files = [
    SDK_CORE_ADDRESSES_PATH,
    SDK_CORE_CHAINS_PATH,
    UNIVERSAL_ROUTER_CONSTANTS_PATH,
    PERMIT2_CONSTANTS_PATH
  ]

  for (const file of files) {
    restoreFile(file)
  }

  log('All files restored')
}
