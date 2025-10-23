/**
 * SDK file modification functions for whitelabel build system
 */

import * as fs from 'fs'
import { WhitelabelConfig } from './types'
import { log, error } from './logger'
import { backupFile } from './file-utils'
import {
  SDK_CORE_ADDRESSES_PATH,
  SDK_CORE_CHAINS_PATH,
  UNIVERSAL_ROUTER_CONSTANTS_PATH,
  PERMIT2_CONSTANTS_PATH
} from './constants'

/**
 * Generates a chain ID enum name from the config
 */
function getChainIdEnumName(config: WhitelabelConfig): string {
  return config.chainName.toUpperCase().replace(/[^A-Z0-9]/g, '_')
}

/**
 * Modifies sdk-core/src/addresses.ts to include custom chain addresses
 */
export function modifySdkCoreAddresses(config: WhitelabelConfig, dryRun: boolean): void {
  log('Modifying sdk-core addresses...')

  if (!fs.existsSync(SDK_CORE_ADDRESSES_PATH)) {
    error(`File not found: ${SDK_CORE_ADDRESSES_PATH}`)
  }

  let content = fs.readFileSync(SDK_CORE_ADDRESSES_PATH, 'utf-8')

  const chainIdName = getChainIdEnumName(config)

  // Create the custom chain addresses object
  const customChainAddresses = `
  [ChainId.${chainIdName}]: {
    v3CoreFactoryAddress: '${config.addresses.v3CoreFactory}',
    multicallAddress: '${config.addresses.multicall}',
    quoterAddress: '${config.addresses.quoter}',${
      config.addresses.v3Migrator ? `\n    v3MigratorAddress: '${config.addresses.v3Migrator}',` : ''
    }${
      config.addresses.nonfungiblePositionManager ? `\n    nonfungiblePositionManagerAddress: '${config.addresses.nonfungiblePositionManager}',` : ''
    }${
      config.addresses.tickLens ? `\n    tickLensAddress: '${config.addresses.tickLens}',` : ''
    }${
      config.addresses.swapRouter02 ? `\n    swapRouter02Address: '${config.addresses.swapRouter02}',` : ''
    }${
      config.addresses.mixedRouteQuoterV1 ? `\n    mixedRouteQuoterV1Address: '${config.addresses.mixedRouteQuoterV1}',` : ''
    }${
      config.addresses.v4PoolManager ? `\n    v4PoolManagerAddress: '${config.addresses.v4PoolManager}',` : ''
    }${
      config.addresses.v4PositionManager ? `\n    v4PositionManagerAddress: '${config.addresses.v4PositionManager}',` : ''
    }${
      config.addresses.v4StateView ? `\n    v4StateView: '${config.addresses.v4StateView}',` : ''
    }${
      config.addresses.v4Quoter ? `\n    v4QuoterAddress: '${config.addresses.v4Quoter}',` : ''
    }
  },`

  // Find the CHAIN_TO_ADDRESSES_MAP object literal
  const chainMapDeclaration = 'export const CHAIN_TO_ADDRESSES_MAP: Record<SupportedChainsType, ChainAddresses> = {'
  const chainMapStart = content.indexOf(chainMapDeclaration)

  if (chainMapStart === -1) {
    error('Could not find CHAIN_TO_ADDRESSES_MAP in sdk-core/src/addresses.ts')
  }

  // Start counting braces from the '= {' part
  const chainMapObjectStart = content.indexOf('= {', chainMapStart) + 2  // +2 to get to the '{'

  // Find the matching closing brace for CHAIN_TO_ADDRESSES_MAP by counting braces
  let braceCount = 0
  let inChainMap = false
  let chainMapEnd = -1

  for (let i = chainMapObjectStart; i < content.length; i++) {
    if (content[i] === '{') {
      braceCount++
      inChainMap = true
    } else if (content[i] === '}') {
      braceCount--
      if (inChainMap && braceCount === 0) {
        chainMapEnd = i
        break
      }
    }
  }

  if (chainMapEnd === -1) {
    error('Could not find closing brace for CHAIN_TO_ADDRESSES_MAP')
  }

  // Insert the custom chain addresses before the closing brace
  content = content.slice(0, chainMapEnd) + customChainAddresses + '\n' + content.slice(chainMapEnd)

  // Add V2_FACTORY_ADDRESSES entry
  const v2FactoryDeclaration = 'export const V2_FACTORY_ADDRESSES: AddressMap = {'
  const v2FactoryStart = content.indexOf(v2FactoryDeclaration)
  if (v2FactoryStart === -1) {
    error('Could not find V2_FACTORY_ADDRESSES in sdk-core/src/addresses.ts')
  }

  const v2FactoryObjectStart = content.indexOf('= {', v2FactoryStart) + 2
  braceCount = 0
  let inV2Factory = false
  let v2FactoryEnd = -1

  for (let i = v2FactoryObjectStart; i < content.length; i++) {
    if (content[i] === '{') {
      braceCount++
      inV2Factory = true
    } else if (content[i] === '}') {
      braceCount--
      if (inV2Factory && braceCount === 0) {
        v2FactoryEnd = i
        break
      }
    }
  }

  if (v2FactoryEnd === -1) {
    error('Could not find closing brace for V2_FACTORY_ADDRESSES')
  }

  content = content.slice(0, v2FactoryEnd) + `  [ChainId.${chainIdName}]: '${config.addresses.v2Factory}',\n` + content.slice(v2FactoryEnd)

  // Add V2_ROUTER_ADDRESSES entry
  const v2RouterDeclaration = 'export const V2_ROUTER_ADDRESSES: AddressMap = {'
  const v2RouterStart = content.indexOf(v2RouterDeclaration)
  if (v2RouterStart === -1) {
    error('Could not find V2_ROUTER_ADDRESSES in sdk-core/src/addresses.ts')
  }

  const v2RouterObjectStart = content.indexOf('= {', v2RouterStart) + 2
  braceCount = 0
  let inV2Router = false
  let v2RouterEnd = -1

  for (let i = v2RouterObjectStart; i < content.length; i++) {
    if (content[i] === '{') {
      braceCount++
      inV2Router = true
    } else if (content[i] === '}') {
      braceCount--
      if (inV2Router && braceCount === 0) {
        v2RouterEnd = i
        break
      }
    }
  }

  if (v2RouterEnd === -1) {
    error('Could not find closing brace for V2_ROUTER_ADDRESSES')
  }

  content = content.slice(0, v2RouterEnd) + `  [ChainId.${chainIdName}]: '${config.addresses.v2Router}',\n` + content.slice(v2RouterEnd)

  if (dryRun) {
    log('[DRY RUN] Would modify sdk-core/src/addresses.ts')
    return
  }

  backupFile(SDK_CORE_ADDRESSES_PATH)
  fs.writeFileSync(SDK_CORE_ADDRESSES_PATH, content, 'utf-8')
  log('Modified sdk-core addresses')
}

/**
 * Modifies universal-router-sdk/src/utils/constants.ts to include custom chain config
 */
export function modifyUniversalRouterConstants(config: WhitelabelConfig, dryRun: boolean): void {
  log('Modifying universal-router-sdk constants...')

  if (!fs.existsSync(UNIVERSAL_ROUTER_CONSTANTS_PATH)) {
    error(`File not found: ${UNIVERSAL_ROUTER_CONSTANTS_PATH}`)
  }

  let content = fs.readFileSync(UNIVERSAL_ROUTER_CONSTANTS_PATH, 'utf-8')

  // Create the custom chain config
  const customChainConfig = `
  [${config.chainId}]: {
    weth: '${config.addresses.weth}',
    routerConfigs: {
      [UniversalRouterVersion.V1_2]: {
        address: '${config.addresses.universalRouterV1_2.address}',
        creationBlock: ${config.addresses.universalRouterV1_2.creationBlock},
      },
      [UniversalRouterVersion.V2_0]: {
        address: '${config.addresses.universalRouterV2_0.address}',
        creationBlock: ${config.addresses.universalRouterV2_0.creationBlock},
      },
    },
  },`

  // Find the CHAIN_CONFIGS object literal (not the type annotation)
  const chainConfigsDeclaration = 'export const CHAIN_CONFIGS: { [key: number]: ChainConfig } = {'
  const chainConfigsStart = content.indexOf(chainConfigsDeclaration)

  if (chainConfigsStart === -1) {
    error('Could not find CHAIN_CONFIGS in universal-router-sdk/src/utils/constants.ts')
  }

  // Start counting braces from the '= {' part, not the type annotation
  const objectLiteralStart = content.indexOf('= {', chainConfigsStart) + 2  // +2 to get to the '{'

  // Find the matching closing brace for CHAIN_CONFIGS by counting braces
  let braceCount = 0
  let inChainConfigs = false
  let chainConfigsEnd = -1

  for (let i = objectLiteralStart; i < content.length; i++) {
    if (content[i] === '{') {
      braceCount++
      inChainConfigs = true
    } else if (content[i] === '}') {
      braceCount--
      if (inChainConfigs && braceCount === 0) {
        chainConfigsEnd = i
        break
      }
    }
  }

  if (chainConfigsEnd === -1) {
    error('Could not find closing brace for CHAIN_CONFIGS')
  }

  // Insert the custom chain config before the closing brace
  content = content.slice(0, chainConfigsEnd) + customChainConfig + '\n' + content.slice(chainConfigsEnd)

  if (dryRun) {
    log('[DRY RUN] Would modify universal-router-sdk/src/utils/constants.ts')
    return
  }

  backupFile(UNIVERSAL_ROUTER_CONSTANTS_PATH)
  fs.writeFileSync(UNIVERSAL_ROUTER_CONSTANTS_PATH, content, 'utf-8')
  log('Modified universal-router-sdk constants')
}

/**
 * Modifies permit2-sdk/src/constants.ts to include custom chain permit2 address
 */
export function modifyPermit2Constants(config: WhitelabelConfig, dryRun: boolean): void {
  log('Modifying permit2-sdk constants...')

  if (!fs.existsSync(PERMIT2_CONSTANTS_PATH)) {
    error(`File not found: ${PERMIT2_CONSTANTS_PATH}`)
  }

  let content = fs.readFileSync(PERMIT2_CONSTANTS_PATH, 'utf-8')

  // Find the permit2Address function and add a new case to the switch statement
  const switchCaseRegex = /(export function permit2Address\(chainId\?: number\): string \{\s*switch \(chainId\) \{[^}]*?)(default:)/s

  if (!switchCaseRegex.test(content)) {
    error('Could not find permit2Address switch statement in permit2-sdk/src/constants.ts')
  }

  // Add a new case before the default case
  const newCase = `    case ${config.chainId}:\n      return '${config.addresses.permit2}'\n    `

  content = content.replace(
    switchCaseRegex,
    `$1${newCase}$2`
  )

  if (dryRun) {
    log('[DRY RUN] Would modify permit2-sdk/src/constants.ts')
    return
  }

  backupFile(PERMIT2_CONSTANTS_PATH)
  fs.writeFileSync(PERMIT2_CONSTANTS_PATH, content, 'utf-8')
  log('Modified permit2-sdk constants')
}

/**
 * Adds custom chain ID to sdk-core/src/chains.ts
 */
export function addChainIdToSdkCore(config: WhitelabelConfig, dryRun: boolean): void {
  log('Adding custom ChainId to sdk-core...')

  if (!fs.existsSync(SDK_CORE_CHAINS_PATH)) {
    error(`File not found: ${SDK_CORE_CHAINS_PATH}`)
  }

  let content = fs.readFileSync(SDK_CORE_CHAINS_PATH, 'utf-8')

  // Add the custom chain ID to the ChainId enum
  const chainIdName = getChainIdEnumName(config)
  const chainIdEntry = `  ${chainIdName} = ${config.chainId},`

  // Find the ChainId enum and add the custom chain
  const chainIdEnumRegex = /(export enum ChainId \{[^}]+)(\})/s

  if (!chainIdEnumRegex.test(content)) {
    error('Could not find ChainId enum in sdk-core/src/chains.ts')
  }

  // Check if the chain ID already exists
  if (content.includes(`= ${config.chainId},`)) {
    log(`ChainId ${config.chainId} already exists, skipping...`)
    return
  }

  content = content.replace(chainIdEnumRegex, `$1\n${chainIdEntry}\n$2`)

  // Add to SUPPORTED_CHAINS array - insert before '] as const'
  const supportedChainsStart = content.indexOf('export const SUPPORTED_CHAINS = [')
  if (supportedChainsStart === -1) {
    error('Could not find SUPPORTED_CHAINS in sdk-core/src/chains.ts')
  }

  const asConstPattern = '] as const'
  const asConstIndex = content.indexOf(asConstPattern, supportedChainsStart)
  if (asConstIndex === -1) {
    error('Could not find end of SUPPORTED_CHAINS array')
  }

  // Check if there's a trailing comma before ] as const
  const beforeBracket = content.slice(supportedChainsStart, asConstIndex).trimEnd()
  const hasTrailingComma = beforeBracket.endsWith(',')

  // Insert the new chain ID
  const insertPos = asConstIndex
  const newChainEntry = hasTrailingComma
    ? `\n  ChainId.${chainIdName}`
    : `,\n  ChainId.${chainIdName}`

  content = content.slice(0, insertPos) + newChainEntry + content.slice(insertPos)

  if (dryRun) {
    log('[DRY RUN] Would modify sdk-core/src/chains.ts')
    return
  }

  backupFile(SDK_CORE_CHAINS_PATH)
  fs.writeFileSync(SDK_CORE_CHAINS_PATH, content, 'utf-8')
  log('Added custom ChainId to sdk-core')
}
