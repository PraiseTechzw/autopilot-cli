import { jsonSuccess, writeJson, writeOut } from "../core/output.js";
import { PRODUCT_NAME, PRODUCT_VERSION } from "../version.js";

export interface VersionInfo {
  readonly name: string;
  readonly version: string;
  readonly node: string;
  readonly platform: NodeJS.Platform;
  readonly arch: string;
}

export function getVersionInfo(): VersionInfo {
  return {
    name: PRODUCT_NAME,
    version: PRODUCT_VERSION,
    node: process.version,
    platform: process.platform,
    arch: process.arch,
  };
}

export function versionCommand(json: boolean): number {
  if (json) {
    writeJson(jsonSuccess("version", getVersionInfo()));
  } else {
    writeOut(`${PRODUCT_NAME} ${PRODUCT_VERSION}`);
  }

  return 0;
}
