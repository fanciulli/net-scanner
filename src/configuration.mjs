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
    return this._config?.netmask ? true : false;
  }

  reportStartScan() {
    return this._config?.report ? this._config.report.begin : false;
  }

  reportScanCompleted() {
    return this._config?.report ? this._config.report.end : false;
  }

  reportNewDevices() {
    return this._config?.report ? this._config.report.newDevices : false;
  }

  reportUpdatedDevices() {
    return this._config?.report ? this._config.report.updatedDevices : false;
  }

  reportKnownDevices() {
    return this._config?.report ? this._config.report.knownDevices : false;
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
