/**
 * Configuration loading and validation for whitelabel build system
 */

import * as fs from "fs";
import { WhitelabelConfig } from "./types";
import { log, error } from "./logger";
import schema from "../../whitelabel-config.schema.json";

/**
 * Validates that a configuration object meets all requirements
 */
export function validateConfig(
  config: any
): asserts config is WhitelabelConfig {
  if (!config || typeof config !== "object") {
    error("Config must be a valid JSON object");
  }

  if (typeof config.chainId !== "number" || config.chainId < 1) {
    error("chainId must be a positive number");
  }

  if (
    typeof config.chainName !== "string" ||
    config.chainName.trim().length === 0
  ) {
    error("chainName must be a non-empty string");
  }

  if (!config.addresses || typeof config.addresses !== "object") {
    error("addresses must be an object");
  }

  const requiredAddresses = schema.properties.addresses.required;

  for (const addr of requiredAddresses) {
    if (!config.addresses[addr]) {
      error(`addresses.${addr} is required`);
    }
  }

  // Validate Ethereum addresses
  const addressPattern = /^0x[a-fA-F0-9]{40}$/;

  const validateAddress = (key: string, value: any) => {
    if (typeof value === "string") {
      if (!addressPattern.test(value)) {
        error(
          `addresses.${key} must be a valid Ethereum address (got: ${value})`
        );
      }
    } else if (value && typeof value === "object" && "address" in value) {
      if (!addressPattern.test(value.address)) {
        error(
          `addresses.${key}.address must be a valid Ethereum address (got: ${value.address})`
        );
      }
      if (typeof value.creationBlock !== "number" || value.creationBlock < 0) {
        error(`addresses.${key}.creationBlock must be a non-negative number`);
      }
    }
  };

  Object.entries(config.addresses).forEach(([key, value]) => {
    if (key.startsWith("_") || key === "$schema") return;
    validateAddress(key, value);
  });

  log("Config validation passed", true);
}

/**
 * Loads and validates a whitelabel configuration from a JSON file
 */
export function loadConfig(configPath: string): WhitelabelConfig {
  log(`Loading config from: ${configPath}`);

  if (!fs.existsSync(configPath)) {
    error(`Config file not found: ${configPath}`);
  }

  try {
    const configContent = fs.readFileSync(configPath, "utf-8");
    const config = JSON.parse(configContent);
    validateConfig(config);
    return config;
  } catch (err: any) {
    if (err.message.includes("ERROR:")) {
      throw err;
    }
    error(`Failed to parse config file: ${err.message}`);
  }
}
