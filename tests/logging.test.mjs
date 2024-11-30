import { expect, test } from "@jest/globals";
import { Configuration } from "../src/configuration.mjs";
import { copyConfigurationFile, deleteConfigurationFile } from "./utils.mjs";
import { initLogger, logger, debug, info, error } from "../src/logging.mjs";

const testConfigFilePath = "/tmp/config.json";

test("Console logger initialization", () => {
  expect(logger).toBeUndefined();
  info("TEST");
  error("TEST");
  debug("TEST");
});

test("Initialize Console logger", async () => {
  await copyConfigurationFile(
    "./tests/resources/test-config-scan.json",
    testConfigFilePath
  );

  const configuration = new Configuration();
  await configuration.load(testConfigFilePath);

  initLogger(configuration);

  expect(logger).toBeDefined();
  info("TEST");
  error("TEST");
  debug("TEST");

  await deleteConfigurationFile(testConfigFilePath);
});

test("Initialize Slack logger", async () => {
  await copyConfigurationFile(
    "./tests/resources/test-config-scan-slack.json",
    testConfigFilePath
  );

  const configuration = new Configuration();
  await configuration.load(testConfigFilePath);

  initLogger(configuration);

  expect(logger).toBeDefined();

  await deleteConfigurationFile(testConfigFilePath);
});
