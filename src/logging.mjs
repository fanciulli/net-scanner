import pino from "pino";

let logger = undefined;

function initLogger(configuration) {
  const configLogger = configuration.logger;

  switch (configLogger.transport) {
    case "console":
      logger = pino();
      break;

    case "slack":
      logger = pino({
        transport: {
          target: "@youngkiu/pino-slack-webhook",
          level: configLogger.level,
          options: {
            webhookUrl: configLogger.webhookUrl,
            channel: configLogger.channel,
            username: configLogger.username,
            icon_emoji: configLogger.icon_emoji,
          },
        },
      });
      break;
  }
}

function info(message) {
  if (logger) {
    logger.info(message);
  } else {
    console.log("[INFO] " + message);
  }
}

function error(message) {
  if (logger) {
    logger.error(message);
  } else {
    console.log("[ERROR] " + message);
  }
}

function debug(message) {
  if (logger) {
    logger.debug(message);
  } else {
    console.log("[DEBUG] " + message);
  }
}

export { initLogger, debug, info, error, logger };
