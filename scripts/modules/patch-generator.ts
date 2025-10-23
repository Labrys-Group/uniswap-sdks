/**
 * Patch generation utilities for whitelabel build system
 */

import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'
import { log, success } from './logger'
import {
  ROOT_DIR,
  SNAPSHOT_DIR,
  SDK_PACKAGES_TO_SNAPSHOT,
  SDK_CORE_ADDRESSES_PATH,
  SDK_CORE_CHAINS_PATH,
  UNIVERSAL_ROUTER_CONSTANTS_PATH,
  PERMIT2_CONSTANTS_PATH
} from './constants'

/**
 * Package metadata extracted from package.json
 */
interface PackageMetadata {
  name: string
  version: string
  encodedName: string
}

/**
 * Reads package.json and extracts metadata for patch naming
 */
function getPackageMetadata(packageName: string): PackageMetadata {
  const packageJsonPath = path.join(ROOT_DIR, 'sdks', packageName, 'package.json')

  if (!fs.existsSync(packageJsonPath)) {
    log(`Warning: package.json not found for ${packageName}, using defaults`)
    return {
      name: `@uniswap/${packageName}`,
      version: '1.0.0',
      encodedName: `@uniswap%2F${packageName}`
    }
  }

  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
    const name = packageJson.name || `@uniswap/${packageName}`
    const version = packageJson.version || '1.0.0'

    // URL-encode the package name for yarn patch format
    // Replace / with %2F in scoped packages (e.g., @uniswap/sdk-core -> @uniswap%2Fsdk-core)
    const encodedName = name.replace(/\//g, '%2F')

    return { name, version, encodedName }
  } catch (err) {
    log(`Warning: failed to parse package.json for ${packageName}, using defaults: ${err}`)
    return {
      name: `@uniswap/${packageName}`,
      version: '1.0.0',
      encodedName: `@uniswap%2F${packageName}`
    }
  }
}

/**
 * Formats a patch filename in yarn-compatible format
 * Examples: @uniswap%2Fsdk-core@7.8.0.patch, multiformats@9.9.0.patch
 */
function formatPatchFilename(packageName: string): string {
  const metadata = getPackageMetadata(packageName)
  return `${metadata.encodedName}@${metadata.version}.patch`
}

/**
 * Generates diff patches comparing snapshot and current dist directories
 */
export function generateDiffPatches(outputDir: string, dryRun: boolean): void {
  log('Generating diff patches for dist directories...')

  if (dryRun) {
    log('[DRY RUN] Would generate patches in: ' + outputDir)
    return
  }

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  let patchesGenerated = 0

  for (const pkg of SDK_PACKAGES_TO_SNAPSHOT) {
    const snapshotPath = path.join(SNAPSHOT_DIR, pkg)
    const currentDistPath = path.join(ROOT_DIR, 'sdks', pkg, 'dist')

    if (!fs.existsSync(snapshotPath)) {
      log(`Warning: no snapshot found for ${pkg}, skipping`)
      continue
    }

    if (!fs.existsSync(currentDistPath)) {
      log(`Warning: dist directory not found for ${pkg}, skipping`)
      continue
    }

    // Validate that snapshots contain files
    const snapshotFiles = fs.readdirSync(snapshotPath, { recursive: true })
    const currentFiles = fs.readdirSync(currentDistPath, { recursive: true })
    log(`Comparing ${pkg}: snapshot has ${snapshotFiles.length} files, current has ${currentFiles.length} files`)

    const patchName = formatPatchFilename(pkg)
    const patchPath = path.join(outputDir, patchName)

    try {
      // Use git diff --no-index to compare directories not in git
      // Format: git diff --no-index <old> <new>
      const diffCommand = `git diff --no-index "${snapshotPath}" "${currentDistPath}"`
      log(`Running: ${diffCommand}`, false)

      const diff = execSync(diffCommand, {
        cwd: ROOT_DIR,
        encoding: 'utf-8'
      })

      if (diff.trim()) {
        // Replace snapshot paths with package-relative paths (a/dist/..., b/dist/...)
        // This matches yarn patch format expectations
        let cleanedDiff = diff
          .replace(new RegExp(snapshotPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), `a/dist`)
          .replace(new RegExp(currentDistPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), `b/dist`)

        // Fix git diff header lines to use single a/ and b/ prefixes
        cleanedDiff = cleanedDiff.replace(/^diff --git aa\//gm, 'diff --git a/')
        cleanedDiff = cleanedDiff.replace(/ bb\//g, ' b/')
        cleanedDiff = cleanedDiff.replace(/^--- aa\//gm, '--- a/')
        cleanedDiff = cleanedDiff.replace(/^\+\+\+ bb\//gm, '+++ b/')

        fs.writeFileSync(patchPath, cleanedDiff, 'utf-8')
        log(`✓ Generated patch: ${patchName} (${cleanedDiff.split('\n').length} lines)`)
        patchesGenerated++
      }
    } catch (err: any) {
      // git diff --no-index returns exit code 1 when there are differences
      // So we need to capture the output differently
      log(`git diff exited with code ${err.status} for ${pkg}`, false)

      if (err.stdout) {
        const diff = err.stdout.toString()
        if (diff.trim()) {
          // Replace snapshot paths with package-relative paths (a/dist/..., b/dist/...)
          // This matches yarn patch format expectations
          let cleanedDiff = diff
            .replace(new RegExp(snapshotPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), `a/dist`)
            .replace(new RegExp(currentDistPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), `b/dist`)

          // Fix git diff header lines to use single a/ and b/ prefixes
          cleanedDiff = cleanedDiff.replace(/^diff --git aa\//gm, 'diff --git a/')
          cleanedDiff = cleanedDiff.replace(/ bb\//g, ' b/')
          cleanedDiff = cleanedDiff.replace(/^--- aa\//gm, '--- a/')
          cleanedDiff = cleanedDiff.replace(/^\+\+\+ bb\//gm, '+++ b/')
          cleanedDiff = cleanedDiff.replace(/^--- aa\//gm, '--- a/')
          cleanedDiff = cleanedDiff.replace(/^\+\+\+ bb\//gm, '+++ b/')

          fs.writeFileSync(patchPath, cleanedDiff, 'utf-8')
          log(`✓ Generated patch: ${patchName} (${cleanedDiff.split('\n').length} lines)`)
          patchesGenerated++
        } else {
          log(`No differences detected in ${pkg} dist (stdout empty)`)
        }
      } else {
        log(`Could not generate diff for ${pkg}/dist - no stdout available`)
      }
    }
  }

  if (patchesGenerated > 0) {
    success(`${patchesGenerated} diff patch(es) saved to: ${outputDir}`)
  } else {
    log('⚠️  No differences found in dist directories - this may indicate the build process is not incorporating source changes')
  }
}

/**
 * Generates patches for modified source files
 */
export function generateSourcePatches(outputDir: string, dryRun: boolean): void {
  log('Generating patches for modified source files...')

  if (dryRun) {
    log('[DRY RUN] Would generate source patches in: ' + outputDir)
    return
  }

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  let patchesGenerated = 0

  const modifiedFiles = [
    {
      path: SDK_CORE_ADDRESSES_PATH,
      packageName: 'sdk-core',
      relativePath: 'src/addresses.ts'
    },
    {
      path: UNIVERSAL_ROUTER_CONSTANTS_PATH,
      packageName: 'universal-router-sdk',
      relativePath: 'src/utils/constants.ts'
    },
    {
      path: PERMIT2_CONSTANTS_PATH,
      packageName: 'permit2-sdk',
      relativePath: 'src/constants.ts'
    },
    {
      path: SDK_CORE_CHAINS_PATH,
      packageName: 'sdk-core',
      relativePath: 'src/chains.ts'
    }
  ]

  // Group files by package to generate one patch per package
  const filesByPackage = new Map<string, typeof modifiedFiles>()
  for (const file of modifiedFiles) {
    if (!filesByPackage.has(file.packageName)) {
      filesByPackage.set(file.packageName, [])
    }
    filesByPackage.get(file.packageName)!.push(file)
  }

  // Generate one patch per package containing all modified files
  for (const [packageName, files] of filesByPackage.entries()) {
    const patchName = formatPatchFilename(packageName)
    const patchPath = path.join(outputDir, patchName)
    let combinedDiff = ''

    for (const file of files) {
      const backupPath = `${file.path}.backup`

      if (!fs.existsSync(backupPath)) {
        log(`Warning: no backup found for ${file.packageName}/${file.relativePath}, skipping`)
        continue
      }

      if (!fs.existsSync(file.path)) {
        log(`Warning: source file not found for ${file.packageName}/${file.relativePath}, skipping`)
        continue
      }

      try {
        // Use git diff --no-index to compare backup vs current
        const diffCommand = `git diff --no-index "${backupPath}" "${file.path}"`
        log(`Running: ${diffCommand}`, false)

        const diff = execSync(diffCommand, {
          cwd: ROOT_DIR,
          encoding: 'utf-8'
        })

        if (diff.trim()) {
          // Replace absolute paths with package-relative paths (a/src/..., b/src/...)
          // This matches yarn patch format expectations
          // Note: We need to replace "a/<fullpath>" with "a/<relativepath>"
          const escapedBackupPath = backupPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          const escapedFilePath = file.path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

          let cleanedDiff = diff
            .replace(new RegExp(`a/${escapedBackupPath}`, 'g'), `a/${file.relativePath}`)
            .replace(new RegExp(`b/${escapedFilePath}`, 'g'), `b/${file.relativePath}`)

          combinedDiff += cleanedDiff
        }
      } catch (err: any) {
        // git diff --no-index returns exit code 1 when there are differences
        log(`git diff exited with code ${err.status} for ${file.packageName}/${file.relativePath}`, false)

        if (err.stdout) {
          const diff = err.stdout.toString()
          if (diff.trim()) {
            // Replace absolute paths with package-relative paths (a/src/..., b/src/...)
            // This matches yarn patch format expectations
            // Note: We need to replace "a/<fullpath>" with "a/<relativepath>"
            const escapedBackupPath = backupPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            const escapedFilePath = file.path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

            let cleanedDiff = diff
              .replace(new RegExp(`a/${escapedBackupPath}`, 'g'), `a/${file.relativePath}`)
              .replace(new RegExp(`b/${escapedFilePath}`, 'g'), `b/${file.relativePath}`)

            combinedDiff += cleanedDiff
          } else {
            log(`No differences detected in ${file.packageName}/${file.relativePath} (stdout empty)`)
          }
        } else {
          log(`Could not generate diff for ${file.packageName}/${file.relativePath} - no stdout available`)
        }
      }
    }

    if (combinedDiff.trim()) {
      fs.writeFileSync(patchPath, combinedDiff, 'utf-8')
      log(`✓ Generated source patch: ${patchName} (${combinedDiff.split('\n').length} lines)`)
      patchesGenerated++
    }
  }

  if (patchesGenerated > 0) {
    success(`${patchesGenerated} source patch(es) saved to: ${outputDir}`)
  } else {
    log('⚠️  No differences found in source files - this is unexpected')
  }
}
