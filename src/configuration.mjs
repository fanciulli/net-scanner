import { readFile, access, constants } from "node:fs/promises";
import { Ajv } from "ajv";
import addFormats from "ajv-formats";

const ajvInstance = new Ajv({ useDefaults: true });
addFormats(ajvInstance);

import { configSchema } from "./configurationSchema.mjs";

const configValidator = ajvInstance.compile(configSchema);

class Configuration {
  async load(filePath) {
    await access(filePath, constants.R_OK);

    let configFileContent = await readFile(filePath, { encoding: "utf-8" });
    let configuration = JSON.parse(configFileContent);

    const valid = configValidator(configuration);
    if (valid) {
      this._config = configuration;
    } else {
      this._config = undefined;
      throw Error("Configuration is not valid");
    }
  }

  get target() {
    return this._config?.target;
  }

  get netmask() {
    return this._config?.netmask;
  }

  isTargetNetwork() {
    if (this._config !== undefined && this._config.netmask !== undefined) {
      return true;
    } else {
      return false;
    }
  }

  isScanReportEnabled() {
    let scanSection = this._config?.scan;

    if (scanSection) {
      return scanSection.enableFinalReport;
    } else {
      return false;
    }
  }

  get logger() {
    if (this._config && this._config.logger) {
      return this._config.logger;
    } else {
      return {
        transport: "console",
      };
    }
  }
}

export { Configuration };
