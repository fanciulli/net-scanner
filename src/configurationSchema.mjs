const configSchema = {
  type: "object",
  properties: {
    target: {
      type: "string",
      format: "ipv4",
    },
    netmask: {
      type: "integer",
    },
    report: {
      type: "object",
      properties: {
        begin: {
          type: "boolean",
          default: true,
        },
        end: {
          type: "boolean",
          default: true,
        },
        newDevices: {
          type: "boolean",
          default: true,
        },
        updatedDevices: {
          type: "boolean",
          default: true,
        },
        knownDevices: {
          type: "boolean",
          default: true,
        },
      },
    },
    logger: {
      type: "object",
      properties: {
        transport: {
          type: "string",
          enum: ["console", "slack"],
        },
        level: {
          type: "string",
          enum: ["info", "debug"],
        },
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
      required: ["transport"],
      additionalProperties: false,
    },
  },
  required: ["target"],
  additionalProperties: false,
};

export { configSchema };
