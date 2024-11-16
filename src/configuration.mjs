import { readFile, access, constants } from "node:fs/promises";
import { Ajv } from "ajv";
import addFormats from "ajv-formats";

const ajvInstance = new Ajv();
addFormats(ajvInstance);

const configSchema = {
  type: "object",
  properties: {
    target: {
      type: "string",
      oneOf: [{ format: "ipv4" }],
    },
    logger: {
      type: "object",
      properties: {
        transport: {
          type: "string",
          enum: ["console", "slack"],
        },
        target: {
          type: "string",
        },
        level: {
          type: "string",
          enum: ["info", "debug"],
        },
        options: {
          type: "object",
          properties: {
            webhookUrl: {
              type: "string",
            },
            channel: {
              type: "string",
            },
            username: {
              type: "string",
            },
            icon_emoji: {
              type: "string",
            },
          },
          required: ["webhookUrl", "channel", "username", "icon_emoji"],
          additionalProperties: false,
        },
      },
      required: ["transport"],
      additionalProperties: false,
    },
  },
  required: ["target"],
  additionalProperties: false,
};

const configValidator = ajvInstance.compile(configSchema);

class Configuration {
  async load(filePath) {
    await access(filePath, constants.R_OK);

    let configFileContent = await readFile(filePath, { encoding: "utf-8" });
    let configuration = JSON.parse(configFileContent);

    const valid = configValidator(configuration);
    if (!valid) {
      this._config = undefined;
      throw Error("Configuration is not valid");
    } else {
      this._config = configuration;
    }
  }

  get target() {
    if (this._config) {
      return this._config.target;
    } else {
      return undefined;
    }
  }

  get logger() {
    if (this._config && this._config.logger) {
      return this._config.logger;
    } else {
      return undefined;
    }
  }
}

export { Configuration };
