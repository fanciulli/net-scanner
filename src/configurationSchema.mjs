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
    scan: {
      type: "object",
      properties: {
        enableFinalReport: {
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
