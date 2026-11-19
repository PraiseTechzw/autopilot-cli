export { PRODUCT_NAME, PRODUCT_VERSION } from "./version.js";
export {
  CONFIG_VERSION,
  ConfigSchema,
  defaultConfig,
  type Config,
} from "./core/config/schema.js";
export { CONFIG_FILENAME, loadConfig, type LoadedConfig } from "./core/config/load.js";
export { AppError, toAppError, type ErrorCode } from "./core/errors.js";
export {
  JSON_SCHEMA_VERSION,
  jsonFailure,
  jsonSuccess,
  serializeJson,
  type JsonEnvelope,
  type JsonFailure,
  type JsonSuccess,
} from "./core/output.js";
export { GitAdapter, type GitBranch, type GitOperation } from "./core/git/adapter.js";
export { getStatus, type StatusReport } from "./core/status.js";
export { runDoctor, type CheckStatus, type DoctorCheck, type DoctorReport } from "./core/doctor.js";
