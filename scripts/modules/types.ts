/**
 * Type definitions for whitelabel build system
 */

export interface UniversalRouterConfig {
  address: string;
  creationBlock: number;
}

export interface WhitelabelConfig {
  $schema?: string;
  _warning?: string;
  chainId: number;
  chainName: string;
  addresses: {
    v3CoreFactory: string;
    multicall: string;
    quoter: string;
    nonfungiblePositionManager?: string;
    v3Migrator?: string;
    swapRouter02?: string;
    tickLens?: string;
    mixedRouteQuoterV1?: string;
    universalRouterV2_0: UniversalRouterConfig;
    weth: string;
    permit2: string;
  };
}

export interface CliOptions {
  includeSourcePatch: boolean;
  dryRun: boolean;
  configPath: string;
  outputDir: string;
  verbose: boolean;
}
